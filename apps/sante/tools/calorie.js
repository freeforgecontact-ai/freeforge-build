/* Calorie & Macro Tracker — calories + protéines/glucides/lipides + ratios. */
FF.register({
  id: "calorie", title: "Calories & Macros", icon: "🥗", tag: "Nutrition",
  desc: "Suis tes calories et tes macros (P/G/L) avec graphique de répartition.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("calorie");
    let goal = st.get("goal", 2000);
    let items = st.get("items", [{ n: "Œufs (2)", p: 12, g: 1, l: 10 }, { n: "Riz (1 tasse)", p: 4, g: 45, l: 0 }]);
    function kcal(i) { return (+i.p || 0) * 4 + (+i.g || 0) * 4 + (+i.l || 0) * 9; }
    const out = el("div");
    function persist() { st.set("goal", goal); st.set("items", items); }
    function render() {
      ctx.clear(out);
      const tot = items.reduce((a, i) => ({ p: a.p + (+i.p || 0), g: a.g + (+i.g || 0), l: a.l + (+i.l || 0) }), { p: 0, g: 0, l: 0 });
      const cal = round2(tot.p * 4 + tot.g * 4 + tot.l * 9);
      const pc = cal ? { p: tot.p * 4 / cal, g: tot.g * 4 / cal, l: tot.l * 9 / cal } : { p: 0, g: 0, l: 0 };
      const inp = {};
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-field" }, [el("label", "Objectif calorique"), el("input", { class: "ff-input", type: "number", value: goal, onInput: (e) => { goal = +e.target.value; persist(); render(); } })]),
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Total du jour"), el("div", { class: "big" }, fmt.num(cal, 0) + " / " + goal + " kcal")]),
          el("div", { style: { display: "flex", height: "22px", borderRadius: "999px", overflow: "hidden", border: "2.5px solid var(--pg-navy)", marginTop: "12px" } }, [
            bar(pc.p, "#0f4c81", "P"), bar(pc.g, "#f97316", "G"), bar(pc.l, "#1aa06d", "L")
          ]),
          el("div", { class: "ff-stats", style: { marginTop: "10px" } }, [
            stat(Math.round(tot.p) + " g", "Protéines " + fmt.pct(pc.p)),
            stat(Math.round(tot.g) + " g", "Glucides " + fmt.pct(pc.g)),
            stat(Math.round(tot.l) + " g", "Lipides " + fmt.pct(pc.l))
          ])
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Aliments du jour"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-field ff-col" }, [el("label", "Aliment"), inp.n = el("input", { class: "ff-input" })]),
            el("div", { class: "ff-field", style: { flex: "0 0 80px" } }, [el("label", "P (g)"), inp.p = el("input", { class: "ff-input", type: "number", value: "0" })]),
            el("div", { class: "ff-field", style: { flex: "0 0 80px" } }, [el("label", "G (g)"), inp.g = el("input", { class: "ff-input", type: "number", value: "0" })]),
            el("div", { class: "ff-field", style: { flex: "0 0 80px" } }, [el("label", "L (g)"), inp.l = el("input", { class: "ff-input", type: "number", value: "0" })])
          ]),
          el("button", { class: "ff-btn primary", onClick: () => { if (inp.n.value) { items.push({ n: inp.n.value, p: +inp.p.value, g: +inp.g.value, l: +inp.l.value }); persist(); render(); } } }, "＋ Ajouter"),
          items.length ? el("table", { class: "ff-table", style: { marginTop: "12px" } }, [el("tr", [el("th", "Aliment"), el("th", { class: "num" }, "kcal"), el("th", { class: "num" }, "P/G/L"), el("th", "")]), ...items.map((i, k) => el("tr", [el("td", i.n), el("td", { class: "num" }, fmt.num(kcal(i), 0)), el("td", { class: "num" }, `${i.p}/${i.g}/${i.l}`), el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { items.splice(k, 1); persist(); render(); } }, "✕"))]))]) : null
        ])
      );
      function bar(frac, col, lbl) { return el("div", { style: { width: (frac * 100) + "%", background: col, color: "#fff", fontSize: ".7rem", fontWeight: "800", textAlign: "center", lineHeight: "18px" } }, frac > 0.08 ? lbl : ""); }
      function stat(v, k) { return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]); }
    }
    root.append(out); render();
  }
});
