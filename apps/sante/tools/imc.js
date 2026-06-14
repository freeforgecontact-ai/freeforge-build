/* Calculateur IMC & Métabolisme — IMC + Mifflin-St Jeor (BMR) + TDEE. */
FF.register({
  id: "imc", title: "IMC & Métabolisme", icon: "⚖️", tag: "Santé",
  desc: "Calcule ton IMC, ton métabolisme de base (Mifflin-St Jeor) et tes besoins caloriques.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("imc");
    let s = st.get("s", { sex: "h", age: 30, h: 175, w: 75, act: 1.55 });
    const ACT = [[1.2, "Sédentaire"], [1.375, "Léger (1-3 j/sem)"], [1.55, "Modéré (3-5 j)"], [1.725, "Actif (6-7 j)"], [1.9, "Très actif"]];
    function calc() {
      const bmi = s.w / Math.pow(s.h / 100, 2);
      const bmr = 10 * s.w + 6.25 * s.h - 5 * s.age + (s.sex === "h" ? 5 : -161);
      const tdee = bmr * s.act;
      const cat = bmi < 18.5 ? ["Insuffisant", "var(--pg-info)"] : bmi < 25 ? ["Normal", "var(--pg-ok)"] : bmi < 30 ? ["Surpoids", "var(--pg-yel2)"] : ["Obésité", "var(--pg-err)"];
      return { bmi: round2(bmi), bmr: Math.round(bmr), tdee: Math.round(tdee), cat };
    }
    const out = el("div");
    function f(label, key, step) { return el("div", { class: "ff-field ff-col" }, [el("label", label), el("input", { class: "ff-input", type: "number", step: step || "1", value: s[key], onInput: (e) => { s[key] = +e.target.value; persist(); render(); } })]); }
    function render() {
      ctx.clear(out); const r = calc();
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-field" }, [el("label", "Sexe"), el("div", { class: "ff-seg" }, [el("button", { class: s.sex === "h" ? "on" : "", onClick: () => { s.sex = "h"; persist(); render(); } }, "Homme"), el("button", { class: s.sex === "f" ? "on" : "", onClick: () => { s.sex = "f"; persist(); render(); } }, "Femme")])]),
          el("div", { class: "ff-row" }, [f("Âge", "age"), f("Taille (cm)", "h"), f("Poids (kg)", "w", "0.1")]),
          el("div", { class: "ff-field" }, [el("label", "Niveau d’activité"), el("select", { class: "ff-select", onChange: (e) => { s.act = +e.target.value; persist(); render(); } }, ACT.map(([v, l]) => el("option", { value: v, selected: s.act === v }, l)))])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Indice de masse corporelle"), el("div", { class: "big" }, fmt.num(r.bmi, 1)), el("div", { style: { color: "#fff", fontWeight: "800", marginTop: "4px" } }, r.cat[0])]),
          el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [
            el("div", { class: "ff-stat" }, [el("div", { class: "v" }, r.bmr + " kcal"), el("div", { class: "k" }, "Métabolisme de base")]),
            el("div", { class: "ff-stat" }, [el("div", { class: "v" }, r.tdee + " kcal"), el("div", { class: "k" }, "Besoin quotidien")]),
            el("div", { class: "ff-stat" }, [el("div", { class: "v" }, (r.tdee - 500) + " kcal"), el("div", { class: "k" }, "Perte ~0,5 kg/sem")])
          ])
        ])
      );
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
