/* Télécharge Fredoka + Nunito (woff2 latin) localement → shared/fonts/, génère fonts.css (offline). */
const fs = require("fs"), path = require("path");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const URL = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900&display=swap";
const outDir = path.join(__dirname, "..", "shared", "fonts");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const css = await (await fetch(URL, { headers: { "User-Agent": UA } })).text();
  // garder uniquement les blocs @font-face dont l'unicode-range couvre le latin de base (U+0000-00FF)
  const blocks = css.split("@font-face").slice(1).map(b => "@font-face" + b.split("}").slice(0, 2).join("}") + "}");
  let out = "/* Fredoka + Nunito — vendorisées (offline). Source: Google Fonts (OFL). */\n";
  let i = 0, urls = new Map();
  for (const b of blocks) {
    if (!/unicode-range/.test(b)) continue;
    const ur = b.match(/unicode-range:\s*([^;]+);/);
    // garder latin (contient U+0000 ou U+0041 etc.) — on prend les sous-ensembles 'latin' (avec U+00xx)
    if (ur && !/U\+0000|U\+0041|U\+00/i.test(ur[1])) continue;
    const m = b.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    if (!m) continue;
    let local = urls.get(m[1]);
    if (!local) { local = "f" + (i++) + ".woff2"; urls.set(m[1], local); }
    out += b.replace(m[1], "./" + local) + "\n";
  }
  // télécharger
  for (const [url, local] of urls) {
    const buf = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
    fs.writeFileSync(path.join(outDir, local), buf);
  }
  fs.writeFileSync(path.join(outDir, "fonts.css"), out);
  console.log("fonts:", urls.size, "fichiers woff2 +", "fonts.css (" + out.length + "o)");
})().catch(e => { console.error("FONT_FAIL", e.message); process.exit(1); });
