/* Calculateur Cote R & GPA — Cote R (CRC) par cours + GPA pondéré. */
FF.register({
  id: "cote-r", title: "Cote R & GPA", icon: "🎓", tag: "Cégep",
  desc: "Estime ta Cote R (CRC) par cours et ton GPA pondéré par crédits.",
  mount(root, ctx) {
    const { el, store, fmt, round2 } = ctx;
    const st = store("coter");
    let courses = st.get("courses", [{ name: "Calcul I", note: 82, moy: 72, et: 9, ifg: 1.0, cr: 3 }, { name: "Chimie", note: 88, moy: 75, et: 8, ifg: 1.1, cr: 3 }]);
    function crc(c) { if (!c.et) return 0; const z = (c.note - c.moy) / c.et; return round2((z + (+c.ifg || 0) + 5) * 5); }
    function gpa43(note) { return note >= 90 ? 4.3 : note >= 85 ? 4.0 : note >= 80 ? 3.7 : note >= 77 ? 3.3 : note >= 73 ? 3.0 : note >= 70 ? 2.7 : note >= 65 ? 2.3 : note >= 60 ? 2.0 : note >= 50 ? 1.0 : 0; }
    const out = el("div");
    function persist() { st.set("courses", courses); }
    function render() {
      ctx.clear(out);
      let wCRC = 0, wGPA = 0, cr = 0;
      courses.forEach((c) => { wCRC += crc(c) * (+c.cr || 0); wGPA += gpa43(c.note) * (+c.cr || 0); cr += (+c.cr || 0); });
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-stats" }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, cr ? (wCRC / cr).toFixed(2) : "—"), el("div", { class: "k" }, "Cote R moyenne")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, cr ? (wGPA / cr).toFixed(2) : "—"), el("div", { class: "k" }, "GPA (/4.3)")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(cr)), el("div", { class: "k" }, "Crédits")])
        ])]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Cours"), el("button", { class: "ff-btn sm primary", onClick: () => { courses.push({ name: "Cours", note: 80, moy: 72, et: 8, ifg: 1.0, cr: 3 }); persist(); render(); } }, "＋")]),
          el("div", { style: { overflowX: "auto" } }, el("table", { class: "ff-table" }, [
            el("tr", [el("th", "Cours"), el("th", { class: "num" }, "Note"), el("th", { class: "num" }, "Moy."), el("th", { class: "num" }, "Éc.type"), el("th", { class: "num" }, "IFG"), el("th", { class: "num" }, "Cr."), el("th", { class: "num" }, "Cote R"), el("th", "")]),
            ...courses.map((c, i) => el("tr", [
              el("td", el("input", { class: "ff-input", style: { minWidth: "100px" }, value: c.name, onInput: (e) => { c.name = e.target.value; persist(); } })),
              ...["note", "moy", "et", "ifg", "cr"].map((k) => el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", step: k === "ifg" ? "0.1" : "1", style: { width: "62px" }, value: c[k], onInput: (e) => { c[k] = +e.target.value; persist(); render(); } }))),
              el("td", { class: "num" }, el("b", crc(c).toFixed(2))),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { courses.splice(i, 1); persist(); render(); } }, "✕"))
            ]))
          ])),
          el("div", { class: "ff-note" }, "CRC = (Z + IFG + 5) × 5, où Z = (note − moyenne) ÷ écart-type. L’IFG (indicateur de force du groupe) est fourni par ton établissement (≈ 0,5 à 1,5). Estimation indicative." )
        ])
      );
    }
    root.append(out); render();
  }
});
