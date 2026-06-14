/* Class & Schedule Planner — horaire hebdo visuel des cours. */
FF.register({
  id: "horaire-cours", title: "Horaire de Cours", icon: "🗓️", tag: "Études",
  desc: "Planifie tes cours de la semaine dans une grille visuelle.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("horaireCours");
    const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
    const COLORS = ["#0f4c81", "#f97316", "#1aa06d", "#9333ea", "#e11d48", "#0891b2"];
    let courses = st.get("courses", [{ name: "Maths", day: 0, start: 9, end: 11, room: "B-204", c: 0 }, { name: "Français", day: 2, start: 13, end: 15, room: "A-110", c: 1 }]);
    const out = el("div");
    function persist() { st.set("courses", courses); }
    function render() {
      ctx.clear(out);
      const H0 = 8, H1 = 18, rowH = 26;
      const grid = el("div", { style: { display: "grid", gridTemplateColumns: "44px repeat(5,1fr)", border: "2.5px solid var(--pg-navy)", borderRadius: "12px", overflow: "hidden", position: "relative", background: "#fff" } });
      grid.append(el("div", { style: { background: "var(--pg-navy)" } }));
      JOURS.forEach((j) => grid.append(el("div", { style: { background: "var(--pg-navy)", color: "#fff", textAlign: "center", fontWeight: "800", padding: "6px 0", fontFamily: "var(--pg-head)" } }, j)));
      for (let h = H0; h < H1; h++) {
        grid.append(el("div", { style: { fontSize: ".72rem", color: "var(--pg-mut)", textAlign: "right", paddingRight: "4px", borderTop: "1px solid var(--pg-sky2)", height: rowH + "px" } }, h + "h"));
        for (let d = 0; d < 5; d++) grid.append(el("div", { style: { borderTop: "1px solid var(--pg-sky2)", borderLeft: "1px solid #eef4f8", height: rowH + "px", position: "relative" } }));
      }
      // place courses absolutely over the grid columns
      const wrap = el("div", { style: { position: "relative" } }, grid);
      const overlay = el("div", { style: { position: "absolute", inset: "0", pointerEvents: "none" } });
      courses.forEach((c) => {
        const colPct = (d) => `calc(44px + (100% - 44px) * ${d} / 5)`;
        const top = 33 + (c.start - H0) * rowH; const height = (c.end - c.start) * rowH - 3;
        overlay.append(el("div", { style: { position: "absolute", left: colPct(c.day), width: `calc((100% - 44px)/5 - 4px)`, top: top + "px", height: height + "px", background: COLORS[c.c % COLORS.length], color: "#fff", borderRadius: "8px", padding: "4px 6px", fontSize: ".72rem", fontWeight: "800", boxSizing: "border-box", overflow: "hidden", marginLeft: "2px" } }, [c.name, el("div", { style: { fontWeight: "600", opacity: .85 } }, c.room || "")]));
      });
      const inp = {};
      out.append(
        el("div", { class: "ff-panel" }, [el("h2", "Ma semaine"), el("div", { style: { position: "relative" } }, [wrap, overlay])]),
        el("div", { class: "ff-panel" }, [el("h2", "Ajouter un cours"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-field ff-col" }, [el("label", "Cours"), inp.name = el("input", { class: "ff-input", value: "" })]),
            el("div", { class: "ff-field ff-col" }, [el("label", "Local"), inp.room = el("input", { class: "ff-input", value: "" })]),
            el("div", { class: "ff-field", style: { flex: "0 0 90px" } }, [el("label", "Jour"), inp.day = el("select", { class: "ff-select" }, JOURS.map((j, i) => el("option", { value: i }, j)))]),
            el("div", { class: "ff-field", style: { flex: "0 0 80px" } }, [el("label", "Début"), inp.start = el("input", { class: "ff-input", type: "number", min: "8", max: "17", value: "9" })]),
            el("div", { class: "ff-field", style: { flex: "0 0 80px" } }, [el("label", "Fin"), inp.end = el("input", { class: "ff-input", type: "number", min: "9", max: "18", value: "11" })])
          ]),
          el("button", { class: "ff-btn primary", onClick: () => { if (!inp.name.value) return toast("Nom requis", "err"); courses.push({ name: inp.name.value, room: inp.room.value, day: +inp.day.value, start: +inp.start.value, end: Math.max(+inp.start.value + 1, +inp.end.value), c: courses.length }); persist(); render(); } }, "＋ Ajouter")]),
        courses.length ? el("div", { class: "ff-panel" }, [el("h2", "Cours"), el("table", { class: "ff-table" }, courses.map((c, i) => el("tr", [el("td", c.name), el("td", JOURS[c.day] + " " + c.start + "h-" + c.end + "h"), el("td", c.room || ""), el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { courses.splice(i, 1); persist(); render(); } }, "✕"))])))]) : null
      );
    }
    root.append(out); render();
  }
});
