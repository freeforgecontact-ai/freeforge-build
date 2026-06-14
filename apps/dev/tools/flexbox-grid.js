/* Flexbox & Grid Playground — Flexbox ET CSS Grid, aperçu live + CSS généré. */
FF.register({
  id: "flexbox-grid", title: "Flexbox & Grid Playground", icon: "📐", tag: "CSS",
  desc: "Joue avec Flexbox ET CSS Grid, vois le rendu et récupère le CSS.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;
    const st = store("flexgrid");
    let mode = st.get("mode", "flex");
    let f = st.get("flex", { dir: "row", justify: "flex-start", align: "stretch", wrap: "nowrap", gap: 10, n: 5 });
    let g = st.get("grid", { cols: "1fr 1fr 1fr", rows: "auto", gap: 10, n: 6 });
    const out = el("div");
    function css() {
      if (mode === "flex") return `display: flex;\nflex-direction: ${f.dir};\njustify-content: ${f.justify};\nalign-items: ${f.align};\nflex-wrap: ${f.wrap};\ngap: ${f.gap}px;`;
      return `display: grid;\ngrid-template-columns: ${g.cols};\ngrid-template-rows: ${g.rows};\ngap: ${g.gap}px;`;
    }
    function sel(label, val, opts, on) { return el("div", { class: "ff-field" }, [el("label", label), el("select", { class: "ff-select", onChange: (e) => { on(e.target.value); persist(); render(); } }, opts.map((o) => el("option", { value: o, selected: val === o }, o)))]); }
    function render() {
      ctx.clear(out);
      const n = mode === "flex" ? f.n : g.n;
      const preview = el("div", { style: Object.assign({ border: "3px dashed var(--pg-sky)", borderRadius: "14px", padding: "10px", minHeight: "180px", background: "var(--pg-pale)" }, parseStyle(css())) },
        Array.from({ length: n }, (_, i) => el("div", { style: { background: "linear-gradient(135deg,var(--pg-blue),var(--pg-navy))", color: "#fff", fontWeight: "800", borderRadius: "10px", padding: "16px 18px", textAlign: "center", minWidth: "56px" } }, String(i + 1))));
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-seg" }, [
          el("button", { class: mode === "flex" ? "on" : "", onClick: () => { mode = "flex"; persist(); render(); } }, "Flexbox"),
          el("button", { class: mode === "grid" ? "on" : "", onClick: () => { mode = "grid"; persist(); render(); } }, "CSS Grid")
        ])]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [el("div", { class: "ff-panel" }, mode === "flex" ? [
            sel("flex-direction", f.dir, ["row", "row-reverse", "column", "column-reverse"], (v) => f.dir = v),
            sel("justify-content", f.justify, ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"], (v) => f.justify = v),
            sel("align-items", f.align, ["stretch", "flex-start", "center", "flex-end", "baseline"], (v) => f.align = v),
            sel("flex-wrap", f.wrap, ["nowrap", "wrap", "wrap-reverse"], (v) => f.wrap = v),
            num("gap (px)", f.gap, (v) => f.gap = v), num("nombre d’items", f.n, (v) => f.n = Math.max(1, Math.min(12, v)))
          ] : [
            txt("grid-template-columns", g.cols, (v) => g.cols = v),
            txt("grid-template-rows", g.rows, (v) => g.rows = v),
            num("gap (px)", g.gap, (v) => g.gap = v), num("nombre d’items", g.n, (v) => g.n = Math.max(1, Math.min(16, v)))
          ])]),
          el("div", { class: "ff-col" }, [el("div", { class: "ff-panel" }, [el("h2", "Aperçu"), preview])])
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "CSS généré"), el("pre", { style: { background: "var(--pg-navy)", color: "#dbeafe", borderRadius: "12px", padding: "14px", overflow: "auto", margin: 0 } }, ".conteneur {\n  " + css().replace(/\n/g, "\n  ") + "\n}"),
          el("button", { class: "ff-btn ghost", style: { marginTop: "10px" }, onClick: () => copy(".conteneur {\n  " + css().replace(/\n/g, "\n  ") + "\n}") }, "📋 Copier le CSS")])
      );
      function num(label, val, on) { return el("div", { class: "ff-field" }, [el("label", label), el("input", { class: "ff-input", type: "number", value: val, onInput: (e) => { on(+e.target.value); persist(); render(); } })]); }
      function txt(label, val, on) { return el("div", { class: "ff-field" }, [el("label", label), el("input", { class: "ff-input", value: val, onInput: (e) => { on(e.target.value); persist(); render(); } })]); }
    }
    function parseStyle(s) { const o = {}; s.split(";").forEach((d) => { const [k, v] = d.split(":"); if (k && v) o[k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v.trim(); }); return o; }
    function persist() { st.set("mode", mode); st.set("flex", f); st.set("grid", g); }
    root.append(out); render();
  }
});
