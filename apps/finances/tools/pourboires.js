/* Calculateur de Pourboires — % sur avant ou après taxes, partage. */
FF.register({
  id: "pourboires", title: "Calculateur de Pourboires", icon: "🍽️", tag: "Resto",
  desc: "Calcule le pourboire (avant ou après taxes) et partage l’addition.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("tip");
    let s = st.get("s", { bill: 60, pct: 18, people: 2, onPreTax: true });
    function calc() {
      const base = s.onPreTax ? s.bill / 1.14975 : s.bill;
      const tip = round2(base * s.pct / 100);
      const total = round2(s.bill + tip);
      return { tip, total, per: round2(total / Math.max(1, s.people)) };
    }
    const out = el("div");
    function render() {
      ctx.clear(out); const r = calc();
      out.append(el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Montant de l’addition (taxes incl.)"), el("input", { class: "ff-input", type: "number", step: "0.01", value: s.bill, onInput: (e) => { s.bill = +e.target.value; persist(); render(); } })]),
        el("div", { class: "ff-field" }, [el("label", "Pourboire : " + s.pct + " %"), el("input", { type: "range", min: "0", max: "30", value: s.pct, style: { width: "100%" }, onInput: (e) => { s.pct = +e.target.value; persist(); render(); } }),
          el("div", {}, [10, 15, 18, 20, 25].map((p) => el("button", { class: "ff-chip", style: { cursor: "pointer" }, onClick: () => { s.pct = p; persist(); render(); } }, p + " %")))]),
        el("label", { class: "ff-field", style: { display: "flex", gap: "8px", alignItems: "center", fontWeight: "800" } }, [el("input", { type: "checkbox", checked: s.onPreTax, onChange: (e) => { s.onPreTax = e.target.checked; persist(); render(); } }), "Calculer sur le montant avant taxes"]),
        el("div", { class: "ff-field" }, [el("label", "Partager entre"), el("input", { class: "ff-input", type: "number", min: "1", value: s.people, onInput: (e) => { s.people = Math.max(1, +e.target.value); persist(); render(); } })]),
        el("div", { class: "ff-stats" }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.tip)), el("div", { class: "k" }, "Pourboire")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.total)), el("div", { class: "k" }, "Total")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.per)), el("div", { class: "k" }, "Par personne")])
        ])
      ]));
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
