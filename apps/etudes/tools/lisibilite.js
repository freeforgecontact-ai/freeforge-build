/* Analyseur de Texte & Lisibilité — Flesch (FR), Flesch-Kincaid, ARI. */
FF.register({
  id: "lisibilite", title: "Analyseur de Lisibilité", icon: "📖", tag: "Texte",
  desc: "Compte mots/phrases, estime les syllabes et calcule plusieurs indices de lisibilité.",
  mount(root, ctx) {
    const { el, store, fmt } = ctx;
    const st = store("lisibilite");
    let txt = st.get("txt", "FreeForge offre des outils simples pour les PME. Chaque outil fonctionne sur ton appareil, sans serveur. C’est rapide, privé et gratuit pour les abonnés.");
    function syllables(w) { const m = w.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüœ]/g, "").match(/[aeiouyàâäéèêëîïôöùûüœ]+/g); return Math.max(1, m ? m.length : 0); }
    function analyze(t) {
      const words = (t.match(/[\p{L}’'-]+/gu) || []); const sentences = (t.match(/[.!?…]+/g) || []).length || 1;
      const chars = t.replace(/\s/g, "").length; const syl = words.reduce((a, w) => a + syllables(w), 0);
      const W = words.length || 1; const wps = W / sentences, spw = syl / W;
      const fleschFR = 207 - 1.015 * wps - 73.6 * spw;               // Kandel & Moles (français)
      const fk = 0.39 * wps + 11.8 * spw - 15.59;                    // Flesch-Kincaid (niveau)
      const ari = 4.71 * (chars / W) + 0.5 * wps - 21.43;            // ARI
      return { W, sentences, syl, chars, fleschFR: Math.round(fleschFR), fk: Math.max(0, fk).toFixed(1), ari: Math.max(0, ari).toFixed(1), wps: wps.toFixed(1), read: Math.ceil(W / 200) };
    }
    function level(f) { return f >= 70 ? ["Facile", "var(--pg-ok)"] : f >= 50 ? ["Moyen", "var(--pg-yel2)"] : ["Difficile", "var(--pg-err)"]; }
    const out = el("div");
    function render() {
      ctx.clear(out); const r = analyze(txt); const lv = level(r.fleschFR);
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-field" }, [el("label", "Ton texte"), el("textarea", { class: "ff-input", rows: 7, value: txt, onInput: (e) => { txt = e.target.value; st.set("txt", txt); render(); } })])]),
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Facilité de lecture (Flesch FR)"), el("div", { class: "big" }, String(r.fleschFR)), el("div", { style: { color: "#fff", fontWeight: "800", marginTop: "4px" } }, lv[0])]),
          el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [
            stat(String(r.W), "Mots"), stat(String(r.sentences), "Phrases"), stat(String(r.syl), "Syllabes"), stat(r.wps, "Mots/phrase"),
            stat(r.fk, "Niveau (Flesch-Kincaid)"), stat(r.ari, "Indice ARI"), stat("~" + r.read + " min", "Temps de lecture")
          ])
        ])
      );
      function stat(v, k) { return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]); }
    }
    root.append(out); render();
  }
});
