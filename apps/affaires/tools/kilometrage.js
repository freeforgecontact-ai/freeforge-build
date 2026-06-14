/* Registre Kilométrique — déduction auto (taux ARC) + export CSV. */
FF.register({
  id: "kilometrage", title: "Registre kilométrique", icon: "🚗", tag: "Déduction",
  desc: "Journal de trajets d’affaires, déduction au taux ARC et export CSV.",
  mount(root, ctx) {
    const { el, store, fmt, round2, save, toast } = ctx;
    const st = store("kilo");
    let trips = st.get("trips", []);
    const RATE1 = 0.70, RATE2 = 0.64, SEUIL = 5000; // 2025: 0,70$ premiers 5000 km, 0,64$ ensuite
    function deduction(km) { return round2(km <= SEUIL ? km * RATE1 : SEUIL * RATE1 + (km - SEUIL) * RATE2); }
    const out = el("div"); root.append(out);
    function totals() { const km = trips.reduce((a, t) => a + (+t.km || 0), 0); return { km, ded: deduction(km) }; }
    function render() {
      ctx.clear(out); const t = totals();
      const f = { date: new Date().toISOString().slice(0, 10), km: "", from: "", to: "", reason: "" };
      const inputs = {};
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-stats" }, [
            stat(fmt.num(t.km, 0) + " km", "Distance d’affaires"),
            stat(fmt.money(t.ded), "Déduction estimée"),
            stat(String(trips.length), "Trajets")
          ])
        ]),
        el("div", { class: "ff-panel" }, [
          el("h2", "Ajouter un trajet"),
          el("div", { class: "ff-row" }, [
            field("Date", "date", "date", f.date), field("Distance (km)", "km", "number", ""),
            field("Départ", "from", "text", ""), field("Arrivée", "to", "text", "")
          ]),
          field("Motif", "reason", "text", "", true),
          el("div", { class: "ff-btns" }, [el("button", { class: "ff-btn primary", onClick: add }, "＋ Ajouter")])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Trajets"),
            trips.length ? el("button", { class: "ff-btn sm ghost", onClick: exportCsv }, "⬇️ CSV") : null]),
          trips.length ? el("table", { class: "ff-table" }, [
            el("tr", [el("th", "Date"), el("th", "Trajet"), el("th", "Motif"), el("th", { class: "num" }, "km"), el("th", "")]),
            ...trips.map((tr, i) => el("tr", [el("td", fmt.date(tr.date)), el("td", (tr.from || "") + " → " + (tr.to || "")), el("td", tr.reason || ""), el("td", { class: "num" }, fmt.num(+tr.km, 0)),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { trips.splice(i, 1); st.set("trips", trips); render(); } }, "✕"))]))
          ]) : el("div", { class: "ff-empty" }, "Aucun trajet.")
        ])
      );
      function field(label, key, type, val, full) { const i = el("input", { class: "ff-input", type, value: val }); inputs[key] = i; return el("div", { class: full ? "ff-field" : "ff-field ff-col" }, [el("label", label), i]); }
      function add() {
        const km = +inputs.km.value; if (!km) { toast("Distance requise", "err"); return; }
        trips.unshift({ date: inputs.date.value, km, from: inputs.from.value, to: inputs.to.value, reason: inputs.reason.value });
        st.set("trips", trips); render();
      }
      function stat(v, k) { return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]); }
    }
    function exportCsv() {
      const rows = [["Date", "Depart", "Arrivee", "Motif", "Km"], ...trips.map((t) => [t.date, t.from, t.to, t.reason, t.km])];
      save("registre-kilometrique.csv", rows.map((r) => r.map((c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",")).join("\n"), "text/csv");
    }
    render();
  }
});
