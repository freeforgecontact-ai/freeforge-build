/* Test headless d'une app FreeForge via jsdom : chargement, registre, montage de chaque outil, maths. */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path");

const appDir = process.argv[2];
if (!appDir) { console.error("usage: node test-app.js <appDir>"); process.exit(2); }

// ordre des scripts = celui de l'index.html
const html = fs.readFileSync(path.join(appDir, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="\.\/([^"]+)"><\/script>/g)].map(m => m[1]);

const dom = new JSDOM(`<!doctype html><html lang="fr"><head></head><body></body></html>`,
  { runScripts: "dangerously", url: "https://ff.local/", pretendToBeVisual: true });
const { window } = dom;
window.scrollTo = () => {};
if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

function inject(code, label) {
  const s = window.document.createElement("script");
  s.textContent = code; window.document.body.appendChild(s);
}
let fail = 0; const log = [];
function ok(c, m) { log.push((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }
function money(t) { return parseFloat(String(t).replace(/[^\d.,-]/g, "").replace(/\s/g, "").replace(",", ".")); }

try {
  for (const f of scripts) inject(fs.readFileSync(path.join(appDir, f), "utf8"), f);
  // boot
  const bootMatch = html.match(/FF\.boot\(([\s\S]*?)\);/);
  inject("FF.boot(" + (bootMatch ? bootMatch[1] : "{name:'Test'}") + ");");
  const FF = window.FF, doc = window.document;

  ok(FF && Array.isArray(FF._tools), "FF chargé");
  console.log("App:", appDir, "| outils enregistrés:", FF._tools.length);
  ok(FF._tools.length === scripts.filter(s => s.startsWith("tools/") && !s.startsWith("tools/_")).length,
    "tous les outils (non-_) enregistrés (" + FF._tools.length + ")");
  ok(doc.querySelectorAll(".ff-card").length === FF._tools.length, "lanceur affiche " + FF._tools.length + " cartes");

  // monter chaque outil
  for (const t of FF._tools) {
    window.location.hash = t.id;
    window.dispatchEvent(new window.HashChangeEvent("hashchange", { newURL: "https://ff.local/#" + t.id }));
    const surf = doc.querySelector(".ff-tool.active");
    const mounted = surf && surf.children.length > 0 && !surf.textContent.includes("Erreur outil");
    ok(mounted, "montage outil: " + t.id);
  }

  // --- vérifs maths ---
  // prix-vente: coût 100, marge 40% → TTC attendu 191.63
  window.location.hash = "prix-vente"; window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  let big = doc.querySelector(".ff-tool.active .ff-result .big");
  if (big) { const v = money(big.textContent); ok(Math.abs(v - 191.63) < 0.05, "prix-vente TTC=191,63 (obtenu " + v + ")"); }

  // impôt: revenu 60000 → net attendu ≈ 44006.70
  if (FF._tools.find(t => t.id === "impot")) {
    window.location.hash = "impot"; window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    big = doc.querySelector(".ff-tool.active .ff-result .big");
    const v = money(big.textContent);
    ok(v > 43000 && v < 45000, "impôt net 60k ≈ 44007 (obtenu " + v + ")");
  }

  // taxes: 100 $ au Québec → total 114.98
  if (FF._tools.find(t => t.id === "taxes")) {
    window.location.hash = "taxes"; window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    big = doc.querySelector(".ff-tool.active .ff-result .big");
    const v = money(big.textContent);
    ok(Math.abs(v - 114.98) < 0.02, "taxes QC 100$ → 114,98 (obtenu " + v + ")");
  }

  // factures: ouvrir "Nouvelle facture" → éditeur avec table d'articles
  if (FF._tools.find(t => t.id === "factures")) {
    window.location.hash = "factures"; window.dispatchEvent(new window.HashChangeEvent("hashchange"));
    const btn = [...doc.querySelectorAll(".ff-tool.active button")].find(b => /Nouvelle/.test(b.textContent));
    ok(!!btn, "factures: bouton Nouvelle facture présent");
    if (btn) { btn.click(); ok(!!doc.querySelector(".ff-tool.active table"), "factures: éditeur + table d'articles s'affichent"); }
  }

  console.log(log.join("\n"));
  console.log(fail === 0 ? "\nRÉSULTAT: ✅ TOUS LES TESTS PASSENT" : `\nRÉSULTAT: ❌ ${fail} échec(s)`);
  process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.log(log.join("\n"));
  console.error("EXCEPTION:", e.message, "\n", e.stack);
  process.exit(1);
}
