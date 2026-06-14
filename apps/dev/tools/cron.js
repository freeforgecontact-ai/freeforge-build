/* Cron Builder & Visualizer — explique une expression cron et liste les prochaines executions. */
FF.register({
  id: "cron", title: "Cron Builder & Visualizer", icon: "⏱️", tag: "Dev",
  desc: "Comprends une expression cron (5 champs) et vois ses prochaines exécutions.",
  mount(root, ctx) {
    const { el, store, copy } = ctx;
    const st = store("cron");
    let expr = st.get("expr", "*/15 9-17 * * 1-5");
    const NAMES = ["minute (0-59)", "heure (0-23)", "jour du mois (1-31)", "mois (1-12)", "jour sem. (0-6, dim=0)"];
    const RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
    const PRESETS = { "Chaque minute": "* * * * *", "Toutes les 15 min, 9h-17h, lun-ven": "*/15 9-17 * * 1-5", "Chaque jour à 6h": "0 6 * * *", "Chaque lundi 8h": "0 8 * * 1", "1er du mois minuit": "0 0 1 * *" };
    function parseField(f, lo, hi) {
      const set = new Set();
      for (const part of f.split(",")) {
        let step = 1, range = part;
        if (part.includes("/")) { const sp = part.split("/"); range = sp[0]; step = +sp[1]; }
        let a = lo, b = hi;
        if (range !== "*") { if (range.includes("-")) { const r = range.split("-"); a = +r[0]; b = +r[1]; } else { a = b = +range; } }
        for (let i = a; i <= b; i += step) if (i >= lo && i <= hi) set.add(i);
      }
      return set;
    }
    function parse(e) {
      const f = e.trim().split(/\s+/);
      if (f.length !== 5) return { err: "Il faut exactement 5 champs (min heure jour mois jour-sem)." };
      try { return { fields: f.map((x, i) => parseField(x, RANGES[i][0], RANGES[i][1])), raw: f }; }
      catch (x) { return { err: "Champ invalide." }; }
    }
    function nextRuns(p, n) {
      const res = []; const d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
      let guard = 0;
      while (res.length < n && guard++ < 800000) {
        if (p.fields[0].has(d.getMinutes()) && p.fields[1].has(d.getHours()) && p.fields[2].has(d.getDate()) && p.fields[3].has(d.getMonth() + 1) && p.fields[4].has(d.getDay())) res.push(new Date(d));
        d.setMinutes(d.getMinutes() + 1);
      }
      return res;
    }
    const out = el("div");
    function render() {
      ctx.clear(out);
      const p = parse(expr);
      const presetChips = Object.keys(PRESETS).map((k) => el("button", { class: "ff-chip", style: { cursor: "pointer" }, onClick: () => { expr = PRESETS[k]; st.set("expr", expr); render(); } }, k));
      out.append(el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Expression cron"), el("input", { class: "ff-input", value: expr, spellcheck: false, style: { fontFamily: "ui-monospace,monospace", fontSize: "1.1rem" }, onInput: (e) => { expr = e.target.value; st.set("expr", expr); render(); } })]),
        el("div", {}, presetChips)
      ]));
      if (p.err) { out.append(el("div", { class: "ff-note", style: { color: "var(--pg-err)", borderColor: "var(--pg-err)" } }, "✗ " + p.err)); return; }
      const readRows = p.raw.map((v, i) => {
        const arr = Array.from(p.fields[i]);
        const vals = arr.slice(0, 12).join(", ") + (arr.length > 12 ? "…" : "");
        return el("tr", [el("td", NAMES[i]), el("td", el("code", v)), el("td", vals)]);
      });
      const runRows = nextRuns(p, 8).map((d) => {
        const txt = d.toLocaleString("fr-CA", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        return el("tr", [el("td", txt)]);
      });
      out.append(
        el("div", { class: "ff-panel" }, [el("h2", "Lecture"), el("p", "Champs : minute · heure · jour du mois · mois · jour de semaine."),
          el("table", { class: "ff-table" }, readRows),
          el("button", { class: "ff-btn ghost", onClick: () => copy(expr) }, "📋 Copier l’expression")]),
        el("div", { class: "ff-panel" }, [el("h2", "Prochaines exécutions"), el("table", { class: "ff-table" }, runRows)])
      );
    }
    root.append(out); render();
  }
});
