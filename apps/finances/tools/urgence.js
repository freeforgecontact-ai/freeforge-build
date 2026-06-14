/* Fonds d'Urgence — objectif (mois de dépenses), échéancier. */
FF.register({
  id: "urgence", title: "Fonds d’Urgence", icon: "🛟", tag: "Sécurité",
  desc: "Calcule ton coussin idéal (mois de dépenses) et le temps pour l’atteindre.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("urgence");
    let s = st.get("s", { expenses: 2500, months: 4, current: 3000, monthly: 300 });
    function calc() { const goal = round2(s.expenses * s.months); const gap = Math.max(0, round2(goal - s.current)); const m = s.monthly > 0 ? Math.ceil(gap / s.monthly) : Infinity; return { goal, gap, m, pct: goal ? Math.min(100, s.current / goal * 100) : 0 }; }
    const out = el("div");
    function f(label, key, step) { return el("div", { class: "ff-field ff-col" }, [el("label", label), el("input", { class: "ff-input", type: "number", step: step || "1", value: s[key], onInput: (e) => { s[key] = +e.target.value; persist(); render(); } })]); }
    function render() {
      ctx.clear(out); const r = calc();
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-row" }, [f("Dépenses mensuelles", "expenses", "50"), f("Mois de coussin visés", "months")]), el("div", { class: "ff-row" }, [f("Épargne actuelle", "current", "100"), f("Épargne mensuelle", "monthly", "25")])]),
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Objectif"), el("div", { class: "big" }, fmt.money(r.goal))]),
          el("div", { style: { height: "16px", background: "var(--pg-pale)", border: "2.5px solid var(--pg-navy)", borderRadius: "999px", overflow: "hidden", margin: "14px 0" } }, el("div", { style: { width: r.pct + "%", height: "100%", background: "linear-gradient(90deg,var(--pg-blue),var(--pg-ok))" } })),
          el("div", { class: "ff-stats" }, [el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(r.gap)), el("div", { class: "k" }, "Reste à épargner")]), el("div", { class: "ff-stat" }, [el("div", { class: "v" }, r.m === Infinity ? "—" : r.m + " mois"), el("div", { class: "k" }, "Pour atteindre l’objectif")]), el("div", { class: "ff-stat" }, [el("div", { class: "v" }, Math.round(r.pct) + " %"), el("div", { class: "k" }, "Atteint")])])
        ])
      );
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
