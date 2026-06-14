/* Simulateur Hydro-Québec — Tarif D (paliers), facture estimée. */
FF.register({
  id: "hydro", title: "Simulateur Hydro-Québec", icon: "⚡", tag: "Québec",
  desc: "Estime ta facture (Tarif D) selon ta consommation : redevance + 2 paliers.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("hydro");
    // Tarif D (valeurs publiées ~2024, ajustées annuellement) : redevance/jour, palier 1 (≤40 kWh/j), palier 2
    let s = st.get("s", { kwh: 900, days: 60, access: 0.4064, p1: 0.06509, p2: 0.10041 });
    function calc() {
      const seuil = 40 * s.days; const e1 = Math.min(s.kwh, seuil), e2 = Math.max(0, s.kwh - seuil);
      const access = round2(s.days * s.access), c1 = round2(e1 * s.p1), c2 = round2(e2 * s.p2);
      const sub = round2(access + c1 + c2);
      const tps = round2(sub * 0.05), tvq = round2(sub * 0.09975);
      return { access, c1, c2, e1, e2, seuil, sub, tps, tvq, total: round2(sub + tps + tvq) };
    }
    const out = el("div");
    function f(label, key, step) { return el("div", { class: "ff-field ff-col" }, [el("label", label), el("input", { class: "ff-input", type: "number", step: step || "1", value: s[key], onInput: (e) => { s[key] = +e.target.value; st.set("s", s); render(); } })]); }
    function render() {
      ctx.clear(out); const r = calc();
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-row" }, [f("Consommation (kWh)", "kwh"), f("Période (jours)", "days")])]),
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Facture estimée (taxes incl.)"), el("div", { class: "big" }, fmt.money(r.total))]),
          el("table", { class: "ff-table", style: { marginTop: "12px" } }, [
            el("tr", [el("td", "Redevance (" + s.days + " j)"), el("td", { class: "num" }, fmt.money(r.access))]),
            el("tr", [el("td", "1er palier (" + fmt.num(r.e1, 0) + " kWh)"), el("td", { class: "num" }, fmt.money(r.c1))]),
            el("tr", [el("td", "2e palier (" + fmt.num(r.e2, 0) + " kWh)"), el("td", { class: "num" }, fmt.money(r.c2))]),
            el("tr", [el("td", "Sous-total"), el("td", { class: "num" }, fmt.money(r.sub))]),
            el("tr", [el("td", "TPS + TVQ"), el("td", { class: "num" }, fmt.money(round2(r.tps + r.tvq)))])
          ])]),
        el("div", { class: "ff-panel" }, [el("h2", "Taux (ajustables)"), el("div", { class: "ff-row" }, [f("Redevance $/jour", "access", "0.0001"), f("Palier 1 $/kWh", "p1", "0.00001"), f("Palier 2 $/kWh", "p2", "0.00001")]),
          el("div", { class: "ff-note" }, "Tarif D résidentiel. 1er palier ≤ 40 kWh/jour. Taux indexés au 1er avril — ajuste-les au besoin.")])
      );
    }
    root.append(out); render();
  }
});
