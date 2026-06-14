/* Meal Prep Menu Planner — menu hebdo + liste d'épicerie. */
FF.register({
  id: "meal-prep", title: "Planificateur de Repas", icon: "🍱", tag: "Cuisine",
  desc: "Planifie tes repas de la semaine et bâtis ta liste d’épicerie.",
  mount(root, ctx) {
    const { el, store, save } = ctx;
    const st = store("mealprep");
    const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], REPAS = ["Déjeuner", "Dîner", "Souper"];
    let plan = st.get("plan", {}), groceries = st.get("groceries", []);
    const out = el("div"); root.append(out);
    function persist() { st.set("plan", plan); st.set("groceries", groceries); }
    function render() {
      ctx.clear(out); const inp = {};
      out.append(
        el("div", { class: "ff-panel" }, [el("h2", "Menu de la semaine"), el("div", { style: { overflowX: "auto" } }, el("table", { class: "ff-table" }, [
          el("tr", [el("th", ""), ...REPAS.map((r) => el("th", r))]),
          ...JOURS.map((j) => el("tr", [el("td", { style: { fontWeight: "800", color: "var(--pg-navy)" } }, j), ...REPAS.map((r) => { const key = j + "|" + r; return el("td", el("input", { class: "ff-input", style: { minWidth: "130px" }, value: plan[key] || "", placeholder: "—", onInput: (e) => { plan[key] = e.target.value; persist(); } })); })]))
        ]))]),
        el("div", { class: "ff-panel" }, [el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Liste d’épicerie"), el("button", { class: "ff-btn sm ghost", onClick: () => save("epicerie.txt", groceries.map((g) => "- " + g).join("\n"), "text/plain") }, "⬇️ Exporter")]),
          el("div", { class: "ff-row" }, [el("div", { class: "ff-field ff-col" }, [el("label", "Ajouter un article"), inp.g = el("input", { class: "ff-input", placeholder: "ex. Poulet, riz, brocoli…", onKeydown: (e) => { if (e.key === "Enter" && inp.g.value) { groceries.push(inp.g.value); inp.g.value = ""; persist(); render(); } } })]), el("button", { class: "ff-btn primary", style: { marginTop: "26px" }, onClick: () => { if (inp.g.value) { groceries.push(inp.g.value); persist(); render(); } } }, "＋")]),
          groceries.length ? el("div", {}, groceries.map((g, i) => el("div", { style: { display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--pg-sky2)", padding: "7px 0" } }, [el("span", g), el("button", { class: "ff-btn sm ghost", onClick: () => { groceries.splice(i, 1); persist(); render(); } }, "✕")]))) : el("div", { class: "ff-empty" }, "Liste vide — ajoute tes articles.")])
      );
    }
    render();
  }
});
