/* Horaires d'Employés — quarts hebdo, heures et coût de main-d'œuvre. */
FF.register({
  id: "horaires", title: "Horaires d’employés", icon: "📅", tag: "Paie",
  desc: "Planifie les quarts de la semaine, calcule heures et coût de main-d’œuvre.",
  mount(root, ctx) {
    const { el, store, fmt, round2, save, toast } = ctx;
    const st = store("horaires");
    const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    let emp = st.get("emp", []); // {name, rate, shifts:{Lun:[start,end],...}}
    const out = el("div"); root.append(out);
    function hours(sh) { if (!sh || !sh[0] || !sh[1]) return 0; const [a, b] = sh.map((x) => { const [h, m] = x.split(":").map(Number); return h + (m || 0) / 60; }); return Math.max(0, round2(b - a)); }
    function empHours(e) { return round2(JOURS.reduce((a, j) => a + hours(e.shifts[j]), 0)); }
    function render() {
      ctx.clear(out);
      const totH = round2(emp.reduce((a, e) => a + empHours(e), 0));
      const totC = round2(emp.reduce((a, e) => a + empHours(e) * (+e.rate || 0), 0));
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-stats" }, [
          stat(String(emp.length), "Employés"), stat(fmt.num(totH, 1) + " h", "Heures/semaine"), stat(fmt.money(totC), "Coût/semaine")
        ])]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" } }, [
            el("h2", { style: { margin: 0 } }, "Équipe"),
            el("div", {}, [el("button", { class: "ff-btn sm ghost", onClick: () => { emp.push({ name: "Employé " + (emp.length + 1), rate: 18, shifts: {} }); st.set("emp", emp); render(); } }, "＋ Employé"),
              emp.length ? el("button", { class: "ff-btn sm ghost", style: { marginLeft: "6px" }, onClick: exportCsv }, "⬇️ CSV") : null])
          ]),
          emp.length ? el("div", { style: { overflowX: "auto" } }, [el("table", { class: "ff-table" }, [
            el("tr", [el("th", "Employé"), el("th", "Taux/h"), ...JOURS.map((j) => el("th", j)), el("th", { class: "num" }, "Hrs"), el("th", "")]),
            ...emp.map((e, i) => el("tr", [
              el("td", el("input", { class: "ff-input", style: { minWidth: "110px" }, value: e.name, onInput: (ev) => { e.name = ev.target.value; persist(); } })),
              el("td", el("input", { class: "ff-input", type: "number", style: { width: "70px" }, value: e.rate, onInput: (ev) => { e.rate = ev.target.value; persist(); render(); } })),
              ...JOURS.map((j) => el("td", el("div", { style: { display: "flex", gap: "2px", minWidth: "120px" } }, [
                el("input", { class: "ff-input", type: "time", style: { padding: "4px" }, value: (e.shifts[j] || [])[0] || "", onChange: (ev) => { e.shifts[j] = [ev.target.value, (e.shifts[j] || [])[1] || ""]; persist(); render(); } }),
                el("input", { class: "ff-input", type: "time", style: { padding: "4px" }, value: (e.shifts[j] || [])[1] || "", onChange: (ev) => { e.shifts[j] = [(e.shifts[j] || [])[0] || "", ev.target.value]; persist(); render(); } })
              ]))),
              el("td", { class: "num" }, fmt.num(empHours(e), 1)),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { emp.splice(i, 1); persist(); render(); } }, "✕"))
            ]))
          ])]) : el("div", { class: "ff-empty" }, "Ajoute ton premier employé.")
        ])
      );
      function stat(v, k) { return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]); }
    }
    function persist() { st.set("emp", emp); }
    function exportCsv() {
      const rows = [["Employe", "Taux", ...JOURS, "Heures", "Cout"], ...emp.map((e) => [e.name, e.rate, ...JOURS.map((j) => (e.shifts[j] || []).join("-")), empHours(e), round2(empHours(e) * (+e.rate || 0))])];
      save("horaires.csv", rows.map((r) => r.join(",")).join("\n"), "text/csv"); toast("CSV exporté", "ok");
    }
    render();
  }
});
