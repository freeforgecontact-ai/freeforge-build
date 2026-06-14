/* Planificateur de Retraite — REER, CELI, CELIAPP séparés. */
FF.register({
  id: "retraite", title: "Planificateur de Retraite", icon: "🌅", tag: "REER/CELI",
  desc: "Projette ta retraite par véhicule : REER, CELI et CELIAPP, avec rendement.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("retraite");
    let s = st.get("s", { age: 35, retire: 65, rate: 5,
      reer: { bal: 20000, yr: 6000 }, celi: { bal: 15000, yr: 7000 }, celiapp: { bal: 5000, yr: 8000 } });
    const VEH = { reer: ["REER", "#0f4c81"], celi: ["CELI", "#1aa06d"], celiapp: ["CELIAPP", "#f97316"] };
    function project(v) { let bal = +v.bal; const years = Math.max(0, s.retire - s.age); const r = s.rate / 100; for (let y = 0; y < years; y++) bal = bal * (1 + r) + (+v.yr); return round2(bal); }
    const out = el("div");
    function f(label, val, on, step) { return el("div", { class: "ff-field ff-col" }, [el("label", label), el("input", { class: "ff-input", type: "number", step: step || "1", value: val, onInput: (e) => { on(+e.target.value); persist(); render(); } })]); }
    function render() {
      ctx.clear(out);
      const totals = Object.keys(VEH).map((k) => ({ k, name: VEH[k][0], col: VEH[k][1], v: project(s[k]) }));
      const grand = round2(totals.reduce((a, t) => a + t.v, 0));
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-row" }, [f("Âge actuel", s.age, (v) => s.age = v), f("Âge de retraite", s.retire, (v) => s.retire = v), f("Rendement annuel (%)", s.rate, (v) => s.rate = v, "0.1")])]),
        ...Object.keys(VEH).map((k) => el("div", { class: "ff-panel" }, [el("h2", VEH[k][0]), el("div", { class: "ff-row" }, [f("Solde actuel", s[k].bal, (v) => s[k].bal = v, "100"), f("Cotisation annuelle", s[k].yr, (v) => s[k].yr = v, "100")]), el("div", { class: "ff-chip" }, "À la retraite : " + fmt.money(project(s[k])))])),
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Capital total à " + s.retire + " ans"), el("div", { class: "big" }, fmt.money(grand))]),
          el("div", { class: "ff-stats", style: { marginTop: "12px" } }, totals.map((t) => el("div", { class: "ff-stat" }, [el("div", { class: "v", style: { color: t.col } }, fmt.money(t.v)), el("div", { class: "k" }, t.name)]))),
          el("div", { class: "ff-note" }, "CELIAPP : plafond à vie 40 000 $ (8 000 $/an). REER/CELI selon tes droits de cotisation. Montants nominaux avant inflation.")])
      );
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
