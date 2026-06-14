/* Budget Personnel 50/30/20 — cible vs réel, catégories, persistance. */
FF.register({
  id: "budget", title: "Budget 50/30/20", icon: "💰", tag: "Budget",
  desc: "Répartis ton revenu en 50 % besoins / 30 % envies / 20 % épargne et suis le réel.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("budget");
    let income = st.get("income", 3500);
    let items = st.get("items", [{ name: "Loyer", cat: "besoins", amt: 1200 }, { name: "Épicerie", cat: "besoins", amt: 450 }, { name: "Restos/sorties", cat: "envies", amt: 300 }, { name: "Épargne REER", cat: "epargne", amt: 400 }]);
    const CATS = { besoins: ["Besoins", .5, "#0f4c81"], envies: ["Envies", .3, "#f97316"], epargne: ["Épargne", .2, "#1aa06d"] };
    const out = el("div");
    function persist() { st.set("income", income); st.set("items", items); }
    function render() {
      ctx.clear(out);
      const sums = { besoins: 0, envies: 0, epargne: 0 };
      items.forEach((i) => sums[i.cat] = round2((sums[i.cat] || 0) + (+i.amt || 0)));
      const inp = {};
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-field" }, [el("label", "Revenu net mensuel"), el("input", { class: "ff-input", type: "number", value: income, onInput: (e) => { income = +e.target.value; persist(); render(); } })])]),
        el("div", { class: "ff-panel" }, [el("h2", "Cible vs réel"), ...Object.keys(CATS).map((k) => {
          const [lbl, pct, col] = CATS[k]; const target = round2(income * pct), real = sums[k] || 0; const over = real > target;
          return el("div", { style: { margin: "10px 0" } }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: "800" } }, [el("span", lbl + " (" + (pct * 100) + " %)"), el("span", { style: { color: over ? "var(--pg-err)" : "var(--pg-ok)" } }, fmt.money(real) + " / " + fmt.money(target))]),
            el("div", { style: { height: "14px", background: "var(--pg-pale)", border: "2px solid var(--pg-navy)", borderRadius: "999px", overflow: "hidden", marginTop: "4px" } }, el("div", { style: { width: Math.min(100, target ? real / target * 100 : 0) + "%", height: "100%", background: over ? "var(--pg-err)" : col } }))
          ]);
        }), el("div", { class: "ff-result", style: { marginTop: "12px" } }, [el("div", { class: "lbl" }, "Reste à allouer"), el("div", { class: "big" }, fmt.money(round2(income - sums.besoins - sums.envies - sums.epargne)))])]),
        el("div", { class: "ff-panel" }, [el("h2", "Dépenses"),
          el("table", { class: "ff-table" }, [el("tr", [el("th", "Poste"), el("th", "Catégorie"), el("th", { class: "num" }, "Montant"), el("th", "")]),
            ...items.map((it, i) => el("tr", [
              el("td", el("input", { class: "ff-input", value: it.name, onInput: (e) => { it.name = e.target.value; persist(); } })),
              el("td", el("select", { class: "ff-select", onChange: (e) => { it.cat = e.target.value; persist(); render(); } }, Object.keys(CATS).map((k) => el("option", { value: k, selected: it.cat === k }, CATS[k][0])))),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "100px" }, value: it.amt, onInput: (e) => { it.amt = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { items.splice(i, 1); persist(); render(); } }, "✕"))
            ]))]),
          el("button", { class: "ff-btn sm ghost", style: { marginTop: "8px" }, onClick: () => { items.push({ name: "Nouveau poste", cat: "besoins", amt: 0 }); persist(); render(); } }, "＋ Poste")])
      );
    }
    root.append(out); render();
  }
});
