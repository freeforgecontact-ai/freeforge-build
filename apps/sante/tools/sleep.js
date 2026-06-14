/* Sleep Cycle Calculator — cycles de 90 min, heures de coucher/réveil idéales. */
FF.register({
  id: "sleep", title: "Cycles de Sommeil", icon: "😴", tag: "Sommeil",
  desc: "Trouve les meilleures heures de coucher ou de réveil (cycles de 90 minutes).",
  mount(root, ctx) {
    const { el, store } = ctx;
    const st = store("sleep");
    let mode = st.get("mode", "wake"); // wake = je veux me réveiller à ; bed = je me couche à
    let time = st.get("time", "07:00");
    const FALL = 15;
    function fmtT(d) { return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }); }
    function compute() {
      const [h, m] = time.split(":").map(Number); const base = new Date(); base.setHours(h, m, 0, 0);
      const res = [];
      for (let c = 6; c >= 3; c--) {
        const d = new Date(base);
        if (mode === "wake") d.setMinutes(d.getMinutes() - (c * 90 + FALL));
        else d.setMinutes(d.getMinutes() + (c * 90 + FALL));
        res.push({ c, time: fmtT(d), hours: (c * 90 / 60) });
      }
      return res;
    }
    const out = el("div");
    function render() {
      ctx.clear(out); const res = compute();
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-field" }, [el("label", "Je veux…"), el("div", { class: "ff-seg" }, [el("button", { class: mode === "wake" ? "on" : "", onClick: () => { mode = "wake"; st.set("mode", mode); render(); } }, "me réveiller à"), el("button", { class: mode === "bed" ? "on" : "", onClick: () => { mode = "bed"; st.set("mode", mode); render(); } }, "me coucher à")])]),
          el("div", { class: "ff-field" }, [el("label", "Heure"), el("input", { class: "ff-input", type: "time", value: time, onInput: (e) => { time = e.target.value; st.set("time", time); render(); } })])
        ]),
        el("div", { class: "ff-panel" }, [el("h2", mode === "wake" ? "Couche-toi à l’une de ces heures" : "Réveille-toi à l’une de ces heures"),
          el("div", { class: "ff-stats" }, res.map((r) => el("div", { class: "ff-stat", style: r.c >= 5 ? { borderColor: "var(--pg-ok)", borderWidth: "3px" } : {} }, [el("div", { class: "v" }, r.time), el("div", { class: "k" }, r.c + " cycles · " + r.hours + " h")]))),
          el("div", { class: "ff-note" }, "Basé sur des cycles de 90 min + ~15 min pour s’endormir. Vise 5 à 6 cycles (7 h 30 à 9 h).")])
      );
    }
    root.append(out); render();
  }
});
