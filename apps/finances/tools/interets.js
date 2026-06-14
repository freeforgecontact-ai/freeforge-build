/* Calculateur d'Intérêts Composés — capital + cotisations, projection annuelle. */
FF.register({
  id: "interets", title: "Intérêts Composés", icon: "📈", tag: "Épargne",
  desc: "Projette la croissance de ton épargne avec cotisations et intérêts composés.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("interets");
    let s = st.get("s", { principal: 5000, monthly: 200, rate: 6, years: 20 });
    function series() {
      const rows = []; let bal = +s.principal; const im = s.rate / 100 / 12; let contrib = +s.principal;
      for (let y = 1; y <= s.years; y++) {
        for (let m = 0; m < 12; m++) { bal = bal * (1 + im) + (+s.monthly); contrib += (+s.monthly); }
        rows.push({ y, bal: round2(bal), contrib: round2(contrib), interest: round2(bal - contrib) });
      }
      return rows;
    }
    const out = el("div");
    function f(label, key, step) { return el("div", { class: "ff-field ff-col" }, [el("label", label), el("input", { class: "ff-input", type: "number", step: step || "1", value: s[key], onInput: (e) => { s[key] = +e.target.value; persist(); render(); } })]); }
    function render() {
      ctx.clear(out); const rows = series(); const last = rows[rows.length - 1] || { bal: s.principal, contrib: s.principal, interest: 0 };
      const max = Math.max(...rows.map((r) => r.bal), 1);
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-row" }, [f("Capital de départ", "principal", "100"), f("Cotisation mensuelle", "monthly", "10")]), el("div", { class: "ff-row" }, [f("Rendement annuel (%)", "rate", "0.1"), f("Durée (ans)", "years")])]),
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Valeur après " + s.years + " ans"), el("div", { class: "big" }, fmt.money(last.bal))]),
          el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(last.contrib)), el("div", { class: "k" }, "Total cotisé")]), el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(last.interest)), el("div", { class: "k" }, "Intérêts gagnés")])]),
          el("div", { style: { display: "flex", alignItems: "flex-end", gap: "3px", height: "120px", marginTop: "14px" } }, rows.map((r) => el("div", { title: "An " + r.y + " : " + fmt.money(r.bal), style: { flex: "1", background: "linear-gradient(var(--pg-blue),var(--pg-navy))", borderRadius: "3px 3px 0 0", height: (r.bal / max * 100) + "%" } })))]),
        el("div", { class: "ff-panel" }, [el("h2", "Détail annuel"), el("table", { class: "ff-table" }, [el("tr", [el("th", "An"), el("th", { class: "num" }, "Solde"), el("th", { class: "num" }, "Cotisé"), el("th", { class: "num" }, "Intérêts")]), ...rows.filter((r) => r.y % Math.ceil(s.years / 12) === 0 || r.y === s.years).map((r) => el("tr", [el("td", String(r.y)), el("td", { class: "num" }, fmt.money(r.bal)), el("td", { class: "num" }, fmt.money(r.contrib)), el("td", { class: "num" }, fmt.money(r.interest))]))])])
      );
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
