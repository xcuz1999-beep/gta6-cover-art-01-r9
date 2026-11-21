// Vice Heat — Palmera Cover Studio: entry program for gta6-cover-art-01 (round 9).
// Node 22, standard library only. Copies app/ and screenshots/ beside this file into the
// output directory and writes dossier.json there with the vendored make.fun library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// It also prints a small sanity summary so a local run shows what was handed in.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function countTree(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      const sub = countTree(p);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += st.size;
    }
  }
  return { files, bytes };
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

const appStats = countTree(join(out, 'app'));
const shotNames = existsSync(join(out, 'screenshots')) ? readdirSync(join(out, 'screenshots')).sort() : [];
// Fail locally where the scorer would: a screenshot past the 256 KiB cap must
// never reach a submission, so name it here instead of discovering it at grading.
let shotBytes = 0;
for (const name of shotNames) {
  const size = statSync(join(out, 'screenshots', name)).size;
  if (size > 262144) throw new Error(`screenshot ${name} is ${size} bytes, over the 262144 cap`);
  shotBytes += size;
}
console.log(`vice-heat: app ${appStats.files} files, ${appStats.bytes} bytes`);
console.log(`vice-heat: screenshots ${shotNames.length} (${shotBytes} bytes): ${shotNames.join(', ')}`);
console.log(`vice-heat: dossier.json ${dossier.length} bytes -> ${out}`);
