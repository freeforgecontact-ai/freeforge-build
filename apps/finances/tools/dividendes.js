/* Stock Dividend Tracker — revenu de dividendes, rendement, projection DRIP. */
FF.register({
  id: "dividendes", title: "Suivi de Dividendes", icon: "🏦", tag: "Bourse",
  desc: "Calcule ton revenu de dividendes, ton rendement et projette le réinvestissement (DRIP).",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("dividendes");
    let pos = st.get("pos", [{ t: "BNS.TO", sh: 100, px: 68, div: 4.24 }, { t: "ENB.TO", sh: 80, px: 50, div: 3.66 }]);
    let growth = st.get("growth", { years: 10, drip: true, divGrow: 5 });
    function totals() { let val = 0, inc = 0; pos.forEach((p) => { val += (+p.sh) * (+p.px); inc += (+p.sh) * (+p.div); }); return { val: round2(val), inc: round2(inc), yld: val ? inc / val : 0 }; }
    function project() {
      let shares = pos.map((p) => ({ ...p })); let years = [];
      for (let y = 1; y <= growth.years; y++) {
        let inc = 0, val = 0;
        shares.forEach((p) => { p.div = p.div * (1 + (y > 1 ? growth.divGrow / 100 : 0)); const di = p.sh * p.div; inc += di; if (growth.drip && p.px > 0) p.sh += di / p.px; val += p.sh * p.px; });
        years.push({ y, inc: round2(inc), val: round2(val) });
      }
      return years;
    }
    const out = el("div");
    function persist() { st.set("pos", pos); st.set("growth", growth); }
    function render() {
      ctx.clear(out); const t = totals(); const proj = project();
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-stats" }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(t.val)), el("div", { class: "k" }, "Valeur")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(t.inc)), el("div", { class: "k" }, "Dividendes/an")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.pct(t.yld)), el("div", { class: "k" }, "Rendement")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(t.inc / 12)), el("div", { class: "k" }, "Par mois")])
        ])]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Positions"), el("button", { class: "ff-btn sm primary", onClick: () => { pos.push({ t: "XXX", sh: 0, px: 0, div: 0 }); persist(); render(); } }, "＋")]),
          el("table", { class: "ff-table" }, [el("tr", [el("th", "Titre"), el("th", { class: "num" }, "Actions"), el("th", { class: "num" }, "Prix"), el("th", { class: "num" }, "Div/action/an"), el("th", "")]),
            ...pos.map((p, i) => el("tr", [
              el("td", el("input", { class: "ff-input", style: { width: "90px" }, value: p.t, onInput: (e) => { p.t = e.target.value; persist(); } })),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "80px" }, value: p.sh, onInput: (e) => { p.sh = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", step: "0.01", style: { width: "80px" }, value: p.px, onInput: (e) => { p.px = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", step: "0.01", style: { width: "80px" }, value: p.div, onInput: (e) => { p.div = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { pos.splice(i, 1); persist(); render(); } }, "✕"))
            ]))]),
          el("div", { class: "ff-note" }, "Saisie manuelle (les cours boursiers gratuits exigent une clé d’API). Mets à jour prix et dividendes au besoin.")
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Projection " + growth.years + " ans"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-field ff-col" }, [el("label", "Années"), el("input", { class: "ff-input", type: "number", value: growth.years, onInput: (e) => { growth.years = +e.target.value; persist(); render(); } })]),
            el("div", { class: "ff-field ff-col" }, [el("label", "Croissance dividende %/an"), el("input", { class: "ff-input", type: "number", value: growth.divGrow, onInput: (e) => { growth.divGrow = +e.target.value; persist(); render(); } })]),
            el("label", { class: "ff-field", style: { display: "flex", gap: "8px", alignItems: "center", fontWeight: "800", marginTop: "26px" } }, [el("input", { type: "checkbox", checked: growth.drip, onChange: (e) => { growth.drip = e.target.checked; persist(); render(); } }), "Réinvestir (DRIP)"])
          ]),
          el("table", { class: "ff-table" }, [el("tr", [el("th", "An"), el("th", { class: "num" }, "Dividendes"), el("th", { class: "num" }, "Valeur")]), ...proj.filter((r) => r.y % Math.max(1, Math.ceil(growth.years / 10)) === 0 || r.y === growth.years).map((r) => el("tr", [el("td", String(r.y)), el("td", { class: "num" }, fmt.money(r.inc)), el("td", { class: "num" }, fmt.money(r.val))]))])
        ])
      );
    }
    root.append(out); render();
  }
});
