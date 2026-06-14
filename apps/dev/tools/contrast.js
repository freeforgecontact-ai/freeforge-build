/* Contraste de Couleur & A11y — ratio WCAG, conformité AA/AAA, aperçu. */
FF.register({
  id: "contrast", title: "Contraste de Couleur & A11y", icon: "👁️", tag: "A11y",
  desc: "Mesure le contraste WCAG entre deux couleurs et vérifie l’accessibilité.",
  mount(root, ctx) {
    const { el, store, toast, copy } = ctx;
    const st = store("contrast");
    let fg = st.get("fg", "#0a3559"), bg = st.get("bg", "#ffd23f");
    function lum(hex) { const c = hex.replace("#", "").match(/.{2}/g).map((h) => { let v = parseInt(h, 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
    function ratio(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
    const out = el("div");
    function badge(ok) { return el("span", { class: "ff-chip", style: ok ? { background: "#dcfce7", color: "var(--pg-ok)", borderColor: "var(--pg-ok)" } : { background: "#fdecec", color: "var(--pg-err)", borderColor: "var(--pg-err)" } }, ok ? "✓ réussi" : "✗ échec"); }
    function render() {
      ctx.clear(out); const r = ratio(fg, bg);
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Texte (avant-plan)"), el("div", { class: "ff-inline", style: { display: "flex", gap: "8px" } }, [el("input", { type: "color", value: fg, style: { width: "52px", height: "44px", border: "2.5px solid var(--pg-navy)", borderRadius: "10px", background: "none" }, onInput: (e) => { fg = e.target.value; persist(); render(); } }), el("input", { class: "ff-input", value: fg, onInput: (e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { fg = e.target.value; persist(); render(); } } })])])]),
          el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Fond (arrière-plan)"), el("div", { class: "ff-inline", style: { display: "flex", gap: "8px" } }, [el("input", { type: "color", value: bg, style: { width: "52px", height: "44px", border: "2.5px solid var(--pg-navy)", borderRadius: "10px", background: "none" }, onInput: (e) => { bg = e.target.value; persist(); render(); } }), el("input", { class: "ff-input", value: bg, onInput: (e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { bg = e.target.value; persist(); render(); } } })])])])
        ])]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { background: bg, color: fg, border: "3px solid var(--pg-navy)", borderRadius: "14px", padding: "22px", textAlign: "center" } }, [
            el("div", { style: { fontSize: "1.6rem", fontWeight: "800" } }, "Texte normal — Aa Bb Cc"),
            el("div", { style: { fontSize: ".95rem", marginTop: "6px" } }, "Le vif renard brun saute par-dessus le chien.")
          ]),
          el("div", { class: "ff-result", style: { marginTop: "14px" } }, [el("div", { class: "lbl" }, "Ratio de contraste"), el("div", { class: "big" }, r.toFixed(2) + " : 1")]),
          el("table", { class: "ff-table", style: { marginTop: "12px" } }, [
            el("tr", [el("th", "Critère"), el("th", "Seuil"), el("th", "Résultat")]),
            el("tr", [el("td", "AA — texte normal"), el("td", "4.5:1"), el("td", badge(r >= 4.5))]),
            el("tr", [el("td", "AA — grand texte"), el("td", "3:1"), el("td", badge(r >= 3))]),
            el("tr", [el("td", "AAA — texte normal"), el("td", "7:1"), el("td", badge(r >= 7))]),
            el("tr", [el("td", "AAA — grand texte"), el("td", "4.5:1"), el("td", badge(r >= 4.5))])
          ]),
          el("button", { class: "ff-btn ghost", style: { marginTop: "10px" }, onClick: () => copy(`Contraste ${fg} sur ${bg} = ${r.toFixed(2)}:1`) }, "📋 Copier")
        ])
      );
    }
    function persist() { st.set("fg", fg); st.set("bg", bg); }
    root.append(out); render();
  }
});
