/* PDF Organizer & Splitter — fusion + extraction de pages réelles (pdf-lib, 100% local). */
FF.register({
  id: "pdf-splitter", title: "PDF — Fusion & Découpe", icon: "📄", tag: "PDF",
  desc: "Fusionne plusieurs PDF ou extrais des pages — vrai traitement, sur ton appareil.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    function rangeToIdx(spec, max) {
      const set = new Set();
      spec.split(",").forEach((p) => { p = p.trim(); if (!p) return; if (p.includes("-")) { const [a, b] = p.split("-").map((x) => parseInt(x)); for (let i = a; i <= b; i++) if (i >= 1 && i <= max) set.add(i - 1); } else { const i = parseInt(p); if (i >= 1 && i <= max) set.add(i - 1); } });
      return [...set].sort((a, b) => a - b);
    }
    async function merge(files) {
      if (!window.PDFLib) return toast("Librairie PDF non chargée", "err");
      const { PDFDocument } = window.PDFLib; const outDoc = await PDFDocument.create();
      for (const f of files) { const src = await PDFDocument.load(await f.arrayBuffer()); const pages = await outDoc.copyPages(src, src.getPageIndices()); pages.forEach((p) => outDoc.addPage(p)); }
      const bytes = await outDoc.save(); save("fusion.pdf", new Blob([bytes], { type: "application/pdf" })); toast("PDF fusionné", "ok");
    }
    async function split(file, spec) {
      if (!window.PDFLib) return toast("Librairie PDF non chargée", "err");
      const { PDFDocument } = window.PDFLib; const src = await PDFDocument.load(await file.arrayBuffer());
      const idx = rangeToIdx(spec, src.getPageCount()); if (!idx.length) return toast("Plage invalide", "err");
      const outDoc = await PDFDocument.create(); const pages = await outDoc.copyPages(src, idx); pages.forEach((p) => outDoc.addPage(p));
      const bytes = await outDoc.save(); save("extrait.pdf", new Blob([bytes], { type: "application/pdf" })); toast(idx.length + " page(s) extraite(s)", "ok");
    }
    const mFiles = el("input", { class: "ff-input", type: "file", accept: "application/pdf", multiple: true });
    const sFile = el("input", { class: "ff-input", type: "file", accept: "application/pdf" });
    const sSpec = el("input", { class: "ff-input", value: "1-3,5", placeholder: "ex. 1-3,5,8" });
    root.append(
      el("div", { class: "ff-panel" }, [el("h2", "🔗 Fusionner des PDF"), el("p", "Choisis 2 fichiers ou plus — ils seront combinés dans l’ordre."),
        el("div", { class: "ff-field" }, [el("label", "Fichiers PDF"), mFiles]),
        el("button", { class: "ff-btn primary", onClick: () => { const f = [...mFiles.files]; if (f.length < 1) return toast("Choisis au moins 1 PDF", "err"); merge(f); } }, "Fusionner")]),
      el("div", { class: "ff-panel" }, [el("h2", "✂️ Extraire des pages"),
        el("div", { class: "ff-field" }, [el("label", "Fichier PDF"), sFile]),
        el("div", { class: "ff-field" }, [el("label", ["Pages à extraire ", el("span", { class: "hint" }, "(ex. 1-3,5)")]), sSpec]),
        el("button", { class: "ff-btn primary", onClick: () => { const f = sFile.files[0]; if (!f) return toast("Choisis un PDF", "err"); split(f, sSpec.value); } }, "Extraire")]),
      el("div", { class: "ff-note" }, "Tout le traitement se fait dans ton navigateur (pdf-lib intégrée) — aucun fichier n’est envoyé sur Internet.")
    );
  }
});
