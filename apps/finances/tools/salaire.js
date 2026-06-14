/* Calculateur de Salaire Net — Québec, par période de paie. */
FF.register({
  id: "salaire", title: "Salaire Net", icon: "💵", tag: "Québec",
  desc: "Convertis ton salaire brut en net (Québec) selon ta fréquence de paie.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("salaire");
    let s = st.get("s", { gross: 60000, freq: "biweekly", hours: 37.5 });
    const FREQ = { weekly: ["Hebdomadaire", 52], biweekly: ["Aux 2 semaines", 26], bimonthly: ["Bimensuel", 24], monthly: ["Mensuel", 12] };
    const FED = { bpa: 16129, br: [[57375, .15], [114750, .205], [177882, .26], [253414, .29], [Infinity, .33]] };
    const QC = { bpa: 18571, br: [[53255, .14], [106495, .19], [129590, .24], [Infinity, .2575]] };
    function tax(income, b) { const t0 = Math.max(0, income - b.bpa); let t = 0, prev = 0; for (const [cap, rate] of b.br) { if (t0 > prev) { t += (Math.min(t0, cap) - prev) * rate; prev = cap; } else break; } return t; }
    function net(g) {
      const fed = tax(g, FED) * 0.835, qc = tax(g, QC);
      const rrq = Math.min(Math.max(0, Math.min(g, 71300) - 3500) * 0.064, (71300 - 3500) * 0.064);
      const ae = Math.min(g, 65700) * 0.0131, rqap = Math.min(g, 98000) * 0.00494;
      const ded = fed + qc + rrq + ae + rqap; return { ded: round2(ded), net: round2(g - ded), fed: round2(fed), qc: round2(qc), rrq: round2(rrq), ae: round2(ae), rqap: round2(rqap) };
    }
    const out = el("div");
    function render() {
      ctx.clear(out); const r = net(+s.gross || 0); const per = FREQ[s.freq][1];
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-row" }, [
          el("div", { class: "ff-field ff-col" }, [el("label", "Salaire brut annuel"), el("input", { class: "ff-input", type: "number", value: s.gross, onInput: (e) => { s.gross = +e.target.value; persist(); render(); } })]),
          el("div", { class: "ff-field ff-col" }, [el("label", "Fréquence de paie"), el("select", { class: "ff-select", onChange: (e) => { s.freq = e.target.value; persist(); render(); } }, Object.keys(FREQ).map((k) => el("option", { value: k, selected: s.freq === k }, FREQ[k][0])))])
        ])]),
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Net par paie (" + FREQ[s.freq][0].toLowerCase() + ")"), el("div", { class: "big" }, fmt.money(r.net / per))]),
          el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.net)), el("div", { class: "k" }, "Net annuel")]), el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.net / 12)), el("div", { class: "k" }, "Net / mois")]), el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.ded / per)), el("div", { class: "k" }, "Retenues / paie")])]),
          el("table", { class: "ff-table", style: { marginTop: "12px" } }, [["Impôt fédéral", r.fed], ["Impôt Québec", r.qc], ["RRQ", r.rrq], ["Assurance-emploi", r.ae], ["RQAP", r.rqap]].map(([k, v]) => el("tr", [el("td", k), el("td", { class: "num" }, fmt.money(v))])))
        ])
      );
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
