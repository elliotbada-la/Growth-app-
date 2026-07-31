/**
 * Bundles the production build into one self-contained HTML file.
 *
 * Emits page content only — no doctype/html/head/body wrapper — so it can be dropped
 * into a host that supplies its own document skeleton. Everything is inlined because
 * the target may block requests to external hosts.
 *
 * Usage: npm run build:single -- [outfile]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve('dist');
const ASSETS = join(DIST, 'assets');
const outFile = resolve(process.argv[2] ?? 'dist/growthtracker.html');

const assets = readdirSync(ASSETS);
const pick = (ext) => {
  const match = assets.find((f) => f.endsWith(ext));
  if (!match) throw new Error(`No ${ext} asset in ${ASSETS} — run "npm run build" first.`);
  return readFileSync(join(ASSETS, match), 'utf8');
};

const css = pick('.css');
const js = pick('.js');

// A literal </script> inside the bundle would close the tag early.
const safeJs = js.replace(/<\/script/gi, '<\\/script');

writeFileSync(
  outFile,
  `<title>GrowthTracker</title>
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${safeJs}
</script>
`,
);

const kb = (s) => `${Math.round(s.length / 1024)} kB`;
console.log(`Wrote ${outFile} (css ${kb(css)}, js ${kb(js)})`);
