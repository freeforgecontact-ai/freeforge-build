/* Calculateur de Nutriments — base d'aliments, totaux du repas. */
FF.register({
  id: "nutriments", title: "Calculateur de Nutriments", icon: "🍎", tag: "Nutrition",
  desc: "Compose un repas et obtiens calories, protéines, glucides, lipides et fibres.",
  mount(root, ctx) {
    const { el, store, fmt } = ctx;
    const st = store("nutriments");
    const DB = { "Poulet (poitrine)": [165, 31, 0, 3.6, 0], "Riz cuit": [130, 2.7, 28, 0.3, 0.4], "Œuf": [155, 13, 1.1, 11, 0], "Brocoli": [34, 2.8, 7, 0.4, 2.6], "Banane": [89, 1.1, 23, 0.3, 2.6], "Amandes": [579, 21, 22, 50, 12.5], "Saumon": [208, 20, 0, 13, 0], "Patate douce": [86, 1.6, 20, 0.1, 3], "Avoine": [389, 17, 66, 7, 10.6], "Yogourt grec": [59, 10, 3.6, 0.4, 0], "Lentilles cuites": [116, 9, 20, 0.4, 7.9], "Avocat": [160, 2, 9, 15, 7], "Pain blé entier": [247, 13, 41, 3.4, 7], "Cheddar": [403, 25, 1.3, 33, 0], "Pomme": [52, 0.3, 14, 0.2, 2.4], "Beurre d’arachide": [588, 25, 20, 50, 6] };
    let items = st.get("items", [{ f: "Poulet (poitrine)", g: 150 }, { f: "Riz cuit", g: 200 }]);
    const out = el("div"); root.append(out);
    function persist() { st.set("items", items); }
    function render() {
      ctx.clear(out);
      const tot = items.reduce((a, it) => { const d = DB[it.f] || [0, 0, 0, 0, 0]; const k = (+it.g || 0) / 100; return { kcal: a.kcal + d[0] * k, p: a.p + d[1] * k, g: a.g + d[2] * k, l: a.l + d[3] * k, fib: a.fib + d[4] * k }; }, { kcal: 0, p: 0, g: 0, l: 0, fib: 0 });
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Total du repas"), el("div", { class: "big" }, fmt.num(tot.kcal, 0) + " kcal")]),
          el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [["Protéines", tot.p], ["Glucides", tot.g], ["Lipides", tot.l], ["Fibres", tot.fib]].map(([k, v]) => el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.num(v, 1) + " g"), el("div", { class: "k" }, k)])))]),
        el("div", { class: "ff-panel" }, [el("h2", "Aliments"),
          el("table", { class: "ff-table" }, [el("tr", [el("th", "Aliment"), el("th", { class: "num" }, "Grammes"), el("th", { class: "num" }, "kcal"), el("th", "")]),
            ...items.map((it, i) => { const d = DB[it.f] || [0]; return el("tr", [el("td", el("select", { class: "ff-select", onChange: (e) => { it.f = e.target.value; persist(); render(); } }, Object.keys(DB).map((f) => el("option", { selected: it.f === f }, f)))), el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "90px" }, value: it.g, onInput: (e) => { it.g = +e.target.value; persist(); render(); } })), el("td", { class: "num" }, fmt.num((d[0] || 0) * (+it.g || 0) / 100, 0)), el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { items.splice(i, 1); persist(); render(); } }, "✕"))]); })]),
          el("button", { class: "ff-btn sm ghost", style: { marginTop: "8px" }, onClick: () => { items.push({ f: Object.keys(DB)[0], g: 100 }); persist(); render(); } }, "＋ Aliment"),
          el("div", { class: "ff-note" }, "Valeurs par 100 g (sources nutritionnelles courantes). Ajoute autant d’aliments que tu veux.")])
      );
    }
    render();
  }
});
