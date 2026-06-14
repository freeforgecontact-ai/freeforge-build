/* Optimiseur & Coloriseur SVG — nettoyage réel, recolorisation, aperçu, téléchargement */
FF.register({
  id: "svg-optim", title: "Optimiseur & Coloriseur SVG", icon: "🖌️", tag: "SVG",
  desc: "Colle un SVG, retire métadonnées/commentaires/espaces, recolore les fill/stroke, aperçu, taille avant/après.",
  mount(root, ctx) {
    const { el, store, save, copy, toast } = ctx;
    const st = store("svg-optim");
    let recolor = st.get("recolor", false);
    let newFill = st.get("newFill", "#0f4c81");
    let newStroke = st.get("newStroke", "#f97316");

    function humanSize(str) {
      const b = new Blob([str]).size;
      if (b < 1024) return b + " o";
      return (b / 1024).toFixed(1) + " Ko";
    }

    function optimizeSVG(raw) {
      let s = raw;
      // Retirer commentaires XML
      s = s.replace(/<!--[\s\S]*?-->/g, "");
      // Retirer balises metadata, title, desc
      s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
      s = s.replace(/<title[\s\S]*?<\/title>/gi, "");
      s = s.replace(/<desc[\s\S]*?<\/desc>/gi, "");
      // Retirer la déclaration XML
      s = s.replace(/<\?xml[\s\S]*?\?>/gi, "");
      // Retirer xmlns:xlink inutilisé si pas de xlink:href
      if (!s.includes("xlink:href")) s = s.replace(/\s*xmlns:xlink="[^"]*"/g, "");
      // Retirer attributs data-*
      s = s.replace(/\s+data-[a-z][^=]*="[^"]*"/g, "");
      // Retirer id vides
      s = s.replace(/\s+id=""/g, "");
      // Collapse whitespace dans les attributs d
      s = s.replace(/\s{2,}/g, " ");
      // Retirer espaces avant />
      s = s.replace(/\s+\/>/g, "/>");
      // Retirer lignes vides
      s = s.replace(/^\s*[\r\n]/gm, "");
      s = s.trim();
      return s;
    }

    function recolorSVG(s, fill, stroke) {
      // Remplacer fill= et stroke= dans les attributs
      s = s.replace(/\bfill="(?!none)[^"]*"/g, 'fill="' + fill + '"');
      s = s.replace(/\bstroke="(?!none)[^"]*"/g, 'stroke="' + stroke + '"');
      // Remplacer dans les style inline
      s = s.replace(/fill\s*:\s*(?!none)[^;}"]+/g, "fill:" + fill);
      s = s.replace(/stroke\s*:\s*(?!none)[^;}"]+/g, "stroke:" + stroke);
      return s;
    }

    const textarea = el("textarea", {
      class: "ff-input", style: "height:160px;font-family:monospace;font-size:.82rem",
      placeholder: "Colle ton SVG ici…",
      value: st.get("last", "")
    });

    const preview = el("div", {
      style: "background:#f5f5f5;border:3px solid var(--pg-navy);border-radius:14px;padding:20px;min-height:100px;display:flex;align-items:center;justify-content:center;overflow:auto"
    });

    const statBefore = el("span", { class: "ff-chip", text: "—" });
    const statAfter = el("span", { class: "ff-chip", text: "—" });
    const statSaving = el("span", { class: "ff-chip", text: "—" });

    let optimized = "";

    function process() {
      const raw = textarea.value.trim();
      if (!raw.startsWith("<")) { toast("Colle un SVG valide", "err"); return; }
      st.set("last", raw);
      let s = optimizeSVG(raw);
      if (recolor) s = recolorSVG(s, newFill, newStroke);
      optimized = s;
      const before = humanSize(raw);
      const after = humanSize(s);
      const saving = (100 - new Blob([s]).size / new Blob([raw]).size * 100).toFixed(1) + " %";
      statBefore.textContent = before;
      statAfter.textContent = after;
      statSaving.textContent = "−" + saving;
      preview.innerHTML = s;
      const svgEl = preview.querySelector("svg");
      if (svgEl) { svgEl.style.maxWidth = "100%"; svgEl.style.maxHeight = "320px"; }
    }

    const recolorChk = el("input", {
      type: "checkbox", checked: recolor,
      onChange: function(e) { recolor = e.target.checked; st.set("recolor", recolor); }
    });

    const fillInput = el("input", {
      type: "color", value: newFill, class: "ff-input", style: "height:40px;padding:4px;cursor:pointer",
      onInput: function(e) { newFill = e.target.value; st.set("newFill", newFill); }
    });

    const strokeInput = el("input", {
      type: "color", value: newStroke, class: "ff-input", style: "height:40px;padding:4px;cursor:pointer",
      onInput: function(e) { newStroke = e.target.value; st.set("newStroke", newStroke); }
    });

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "SVG source"), textarea]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [
              el("label", [recolorChk, " Recolorier fill/stroke"])
            ]),
            el("div", { class: "ff-field" }, [el("label", "Couleur fill"), fillInput]),
            el("div", { class: "ff-field" }, [el("label", "Couleur stroke"), strokeInput])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-note" }, ["Avant : ", statBefore, " | Après : ", statAfter, " | Réduction : ", statSaving])
          ])
        ]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: process }, "⚡ Optimiser"),
          el("button", { class: "ff-btn ghost", onClick: function() {
            if (!optimized) { toast("Lance l'optimisation d'abord", "err"); return; }
            copy(optimized); toast("SVG copié !", "ok");
          }}, "📋 Copier"),
          el("button", { class: "ff-btn ghost", onClick: function() {
            if (!optimized) { toast("Lance l'optimisation d'abord", "err"); return; }
            save("image-optimisee.svg", optimized, "image/svg+xml");
          }}, "⬇️ Télécharger")
        ])
      ]),
      el("div", { class: "ff-panel" }, [el("h2", "Aperçu"), preview])
    );

    if (textarea.value) process();
  }
});
