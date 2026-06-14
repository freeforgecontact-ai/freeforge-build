/* Water Intake Log — objectif, journal, rappels (son + notification). */
FF.register({
  id: "water", title: "Hydratation", icon: "💧", tag: "Santé",
  desc: "Suis ta consommation d’eau, avec objectif quotidien et rappels.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("water");
    const today = new Date().toISOString().slice(0, 10);
    let goal = st.get("goal", 2000), log = st.get("log:" + today, 0), interval = st.get("interval", 0), timer = null;
    function add(ml) { log = Math.max(0, log + ml); st.set("log:" + today, log); render(); }
    function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = .2; o.start(); setTimeout(() => { o.stop(); a.close && a.close(); }, 280); } catch (e) {} }
    function setReminder(min) { interval = min; st.set("interval", min); clearInterval(timer); if (min > 0) timer = setInterval(() => { beep(); if (window.Notification && Notification.permission === "granted") new Notification("💧 Bois de l’eau !"); toast("💧 Pause hydratation !"); }, min * 60000); }
    const out = el("div"); root.append(out);
    function render() {
      ctx.clear(out); const pct = Math.min(100, goal ? log / goal * 100 : 0);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Aujourd’hui"), el("div", { class: "big" }, log + " / " + goal + " ml")]),
          el("div", { style: { height: "18px", background: "var(--pg-pale)", border: "2.5px solid var(--pg-navy)", borderRadius: "999px", overflow: "hidden", margin: "14px 0" } }, el("div", { style: { width: pct + "%", height: "100%", background: "linear-gradient(90deg,#7ec3ee,#0f4c81)" } })),
          el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [200, 330, 500].map((ml) => el("button", { class: "ff-btn primary", onClick: () => add(ml) }, "+" + ml + " ml"))),
          el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [el("button", { class: "ff-btn ghost", onClick: () => add(-200) }, "−200 ml"), el("button", { class: "ff-btn ghost", onClick: () => { log = 0; st.set("log:" + today, 0); render(); } }, "↺ Remettre à 0")])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-field" }, [el("label", "Objectif (ml)"), el("input", { class: "ff-input", type: "number", value: goal, onInput: (e) => { goal = +e.target.value; st.set("goal", goal); render(); } })]),
          el("div", { class: "ff-field" }, [el("label", "Rappel automatique"), el("div", {}, [0, 30, 60, 90].map((m) => el("button", { class: "ff-chip", style: { cursor: "pointer", background: interval === m ? "var(--pg-yel)" : "var(--pg-pale)" }, onClick: () => { if (m > 0 && window.Notification && Notification.permission === "default") Notification.requestPermission(); setReminder(m); render(); } }, m === 0 ? "Off" : "Aux " + m + " min")))])
        ])
      );
    }
    render();
  }
});
