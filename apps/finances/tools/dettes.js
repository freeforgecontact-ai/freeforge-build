/* Debt Payoff Planner — avalanche vs boule de neige. */
FF.register({
  id: "dettes", title: "Plan de Remboursement", icon: "💳", tag: "Dettes",
  desc: "Compare avalanche (taux élevé) et boule de neige (petit solde) pour rembourser plus vite.",
  mount(root, ctx) {
    const { el, store, fmt, round2, toast } = ctx;
    const st = store("dettes");
    let debts = st.get("debts", [{ name: "Carte de crédit", bal: 4000, rate: 19.99, min: 120 }, { name: "Prêt auto", bal: 12000, rate: 6.5, min: 280 }, { name: "Marge de crédit", bal: 6000, rate: 9.5, min: 150 }]);
    let extra = st.get("extra", 200);
    function simulate(order) {
      let list = order.map((d) => ({ ...d, bal: +d.bal })); let month = 0, interest = 0; let budget = list.reduce((a, d) => a + (+d.min || 0), 0) + (+extra);
      while (list.some((d) => d.bal > 0.01) && month < 1200) {
        month++; let pool = budget;
        list.forEach((d) => { if (d.bal <= 0) return; const i = d.bal * (d.rate / 100 / 12); interest += i; d.bal += i; });
        // paiements minimums
        list.forEach((d) => { if (d.bal <= 0) return; const pay = Math.min(d.bal, +d.min || 0); d.bal -= pay; pool -= pay; });
        // surplus vers la 1re dette de l'ordre encore active
        for (const d of list) { if (pool <= 0) break; if (d.bal <= 0) continue; const pay = Math.min(d.bal, pool); d.bal -= pay; pool -= pay; }
      }
      return { months: month, interest: round2(interest) };
    }
    const out = el("div");
    function persist() { st.set("debts", debts); st.set("extra", extra); }
    function render() {
      ctx.clear(out);
      const avalanche = simulate([...debts].sort((a, b) => b.rate - a.rate));
      const snowball = simulate([...debts].sort((a, b) => a.bal - b.bal));
      const total = round2(debts.reduce((a, d) => a + (+d.bal || 0), 0));
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Mes dettes — " + fmt.money(total)), el("button", { class: "ff-btn sm primary", onClick: () => { debts.push({ name: "Nouvelle dette", bal: 1000, rate: 10, min: 50 }); persist(); render(); } }, "＋")]),
          el("table", { class: "ff-table" }, [el("tr", [el("th", "Dette"), el("th", { class: "num" }, "Solde"), el("th", { class: "num" }, "Taux %"), el("th", { class: "num" }, "Min/mois"), el("th", "")]),
            ...debts.map((d, i) => el("tr", [
              el("td", el("input", { class: "ff-input", value: d.name, onInput: (e) => { d.name = e.target.value; persist(); } })),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "90px" }, value: d.bal, onInput: (e) => { d.bal = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "70px" }, value: d.rate, onInput: (e) => { d.rate = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "70px" }, value: d.min, onInput: (e) => { d.min = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { debts.splice(i, 1); persist(); render(); } }, "✕"))
            ]))]),
          el("div", { class: "ff-field", style: { marginTop: "10px" } }, [el("label", "Budget supplémentaire mensuel"), el("input", { class: "ff-input", type: "number", value: extra, onInput: (e) => { extra = +e.target.value; persist(); render(); } })])
        ]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [el("div", { class: "ff-panel" }, [el("h2", "🏔️ Avalanche"), el("p", "On attaque le plus haut taux d’abord."), stat(avalanche)])]),
          el("div", { class: "ff-col" }, [el("div", { class: "ff-panel" }, [el("h2", "⛄ Boule de neige"), el("p", "On efface le plus petit solde d’abord."), stat(snowball)])])
        ])
      );
      function stat(r) { return el("div", { class: "ff-stats" }, [el("div", { class: "ff-stat" }, [el("div", { class: "v" }, r.months + " mois"), el("div", { class: "k" }, "Durée")]), el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.interest)), el("div", { class: "k" }, "Intérêts payés")])]); }
    }
    root.append(out); render();
  }
});
