/* Simulateur Impôt & Cotisations (Québec) — barèmes indexés annuellement (défaut 2025, modifiables). */
FF.register({
  id: "impot", title: "Impôt & cotisations", icon: "📊", tag: "Québec",
  desc: "Estime impôt fédéral + provincial, RRQ, AE et RQAP. Taux moyen et marginal.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("impot");
    let income = st.get("income", 60000);
    // Barèmes (2025, Québec). Indexés chaque année → modifiables au besoin.
    const FED = { bpa: 16129, br: [[57375, .15], [114750, .205], [177882, .26], [253414, .29], [Infinity, .33]] };
    const QC = { bpa: 18571, br: [[53255, .14], [106495, .19], [129590, .24], [Infinity, .2575]] };
    // abattement Québec 16,5% sur impôt fédéral
    const FED_ABATT_QC = 0.165;
    const RRQ = { exempt: 3500, max: 71300, rate: .064 };
    const AE = { max: 65700, rate: .0131 };       // taux Québec
    const RQAP = { max: 98000, rate: .00494 };

    function tax(income, b) {
      const taxable = Math.max(0, income - b.bpa); let t = 0, prev = 0;
      for (const [cap, rate] of b.br) { if (taxable > prev) { t += (Math.min(taxable, cap) - prev) * rate; prev = cap; } else break; }
      return t;
    }
    function marginalRate(income) {
      const f = (FED.br.find(([c]) => income <= c) || FED.br[FED.br.length - 1])[1] * (1 - FED_ABATT_QC);
      const q = (QC.br.find(([c]) => income <= c) || QC.br[QC.br.length - 1])[1];
      return f + q;
    }
    function calc(income) {
      income = +income || 0;
      const fed = round2(tax(income, FED) * (1 - FED_ABATT_QC));
      const qc = round2(tax(income, QC));
      const rrq = round2(Math.min(AE.max && Math.max(0, Math.min(income, RRQ.max) - RRQ.exempt) * RRQ.rate, (RRQ.max - RRQ.exempt) * RRQ.rate));
      const ae = round2(Math.min(income, AE.max) * AE.rate);
      const rqap = round2(Math.min(income, RQAP.max) * RQAP.rate);
      const totalDed = round2(fed + qc + rrq + ae + rqap);
      const net = round2(income - totalDed);
      return { fed, qc, rrq, ae, rqap, totalDed, net, avg: income > 0 ? totalDed / income : 0, marg: marginalRate(income) };
    }
    const out = el("div"); root.append(out);
    function render() {
      ctx.clear(out); const r = calc(income);
      out.append(el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Revenu brut annuel (salarié)"),
          el("input", { class: "ff-input", type: "number", min: "0", step: "100", value: income, onInput: (e) => { income = e.target.value; st.set("income", income); render(); } })]),
        el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Revenu net estimé"), el("div", { class: "big" }, fmt.money(r.net)),
          el("div", { style: { fontSize: "13px", opacity: .9, marginTop: "4px" } }, "Taux moyen " + fmt.pct(r.avg) + " · marginal " + fmt.pct(r.marg))]),
        el("table", { class: "ff-table", style: { marginTop: "12px" } }, [
          row("Impôt fédéral (net abattement QC)", r.fed), row("Impôt du Québec", r.qc),
          row("RRQ", r.rrq), row("Assurance-emploi", r.ae), row("RQAP", r.rqap),
          el("tr", [el("td", el("strong", "Total des retenues")), el("td", { class: "num" }, el("strong", fmt.money(r.totalDed)))])
        ]),
        el("div", { class: "ff-note" }, "Estimation pour un salarié résident du Québec. Barèmes 2025 (indexés annuellement) — sans crédits autres que le montant personnel de base.")
      ]));
      function row(k, v) { return el("tr", [el("td", k), el("td", { class: "num" }, fmt.money(v))]); }
    }
    render();
  }
});
