/* Simulateur Hypothécaire Québec — convention canadienne (composé semestriel). */
FF.register({
  id: "hypotheque", title: "Simulateur Hypothécaire", icon: "🏠", tag: "Québec",
  desc: "Paiement, intérêts totaux et amortissement (composé semestriel, norme canadienne).",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("mortgage");
    let s = st.get("s", { price: 400000, down: 80000, rate: 5.25, years: 25, freq: "monthly" });
    const FREQ = { monthly: ["Mensuel", 12], biweekly: ["Aux 2 semaines", 26], weekly: ["Hebdomadaire", 52] };
    function calc() {
      const P = Math.max(0, s.price - s.down); const r = s.rate / 100;
      const periods = FREQ[s.freq][1];
      const i = Math.pow(1 + r / 2, 2 / periods) - 1; // taux périodique (composé semestriel)
      const n = s.years * periods;
      const pay = i > 0 ? P * i / (1 - Math.pow(1 + i, -n)) : P / n;
      const total = pay * n; const interest = total - P;
      return { P, pay: round2(pay), total: round2(total), interest: round2(interest), n, periods };
    }
    const out = el("div");
    function f(label, key, step) { return el("div", { class: "ff-field ff-col" }, [el("label", label), el("input", { class: "ff-input", type: "number", step: step || "1", value: s[key], onInput: (e) => { s[key] = +e.target.value; persist(); render(); } })]); }
    function render() {
      ctx.clear(out); const r = calc();
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-row" }, [f("Prix de la propriété", "price", "1000"), f("Mise de fonds", "down", "1000")]),
          el("div", { class: "ff-row" }, [f("Taux annuel (%)", "rate", "0.01"), f("Amortissement (ans)", "years")]),
          el("div", { class: "ff-field" }, [el("label", "Fréquence"), el("select", { class: "ff-select", onChange: (e) => { s.freq = e.target.value; persist(); render(); } }, Object.keys(FREQ).map((k) => el("option", { value: k, selected: s.freq === k }, FREQ[k][0])))])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Paiement " + FREQ[s.freq][0].toLowerCase()), el("div", { class: "big" }, fmt.money(r.pay))]),
          el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [
            el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.P)), el("div", { class: "k" }, "Montant emprunté")]),
            el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.interest)), el("div", { class: "k" }, "Intérêts totaux")]),
            el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.total)), el("div", { class: "k" }, "Coût total")])
          ]),
          el("div", { class: "ff-note" }, "Taux composé semestriellement (norme des prêts hypothécaires au Canada). Mise de fonds < 20 % exigerait une assurance SCHL (non incluse).")
        ])
      );
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
