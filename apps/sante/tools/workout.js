/* Workout Builder & Timer — circuit éditable, minuteur, annonces vocales fr-CA. */
FF.register({
  id: "workout", title: "Entraînement & Minuteur", icon: "🏋️", tag: "Forme",
  desc: "Crée ton circuit d’exercices et lance-le avec minuteur et voix.",
  mount(root, ctx) {
    const { el, store } = ctx;
    const st = store("workout");
    let ex = st.get("ex", [{ n: "Jumping jacks", w: 30, r: 10 }, { n: "Push-ups", w: 30, r: 15 }, { n: "Squats", w: 40, r: 15 }, { n: "Planche", w: 30, r: 20 }]);
    let rounds = st.get("rounds", 3), running = false, timer = null, state = null, dial, label;
    function speak(t) { try { const u = new SpeechSynthesisUtterance(t); u.lang = "fr-CA"; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }
    function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 760; g.gain.value = .2; o.start(); setTimeout(() => { o.stop(); a.close && a.close(); }, 220); } catch (e) {} }
    function start() { if (!ex.length) return; const seq = []; for (let r = 0; r < rounds; r++) ex.forEach((e) => { seq.push({ type: "work", n: e.n, t: +e.w || 1 }); if (+e.r > 0) seq.push({ type: "rest", n: "Repos", t: +e.r }); }); state = { seq, i: 0, left: seq[0].t }; running = true; beep(); speak("C’est parti. " + seq[0].n); timer = setInterval(tick, 1000); render(); }
    function tick() { if (!state) return; state.left--; if (state.left <= 0) { state.i++; if (state.i >= state.seq.length) { speak("Entraînement terminé. Bravo !"); stop(); return; } const s = state.seq[state.i]; state.left = s.t; beep(); speak(s.type === "work" ? s.n : "Repos"); } paint(); }
    function stop() { running = false; clearInterval(timer); state = null; render(); }
    function paint() { if (!state) return; const s = state.seq[state.i]; if (dial) dial.textContent = state.left; if (label) label.textContent = s.n; }
    const out = el("div"); root.append(out);
    function render() {
      ctx.clear(out);
      if (running && state) {
        const s = state.seq[state.i]; dial = el("div", { class: "big", style: { fontSize: "4rem" } }, String(state.left)); label = el("div", { style: { fontSize: "1.4rem", fontWeight: "800", color: "#fff", marginTop: "4px" } }, s.n);
        out.append(el("div", { class: "ff-panel" }, [el("div", { class: "ff-result", style: { background: s.type === "work" ? "radial-gradient(120% 140% at 50% -20%,#0f4c81,#0a3559)" : "radial-gradient(120% 140% at 50% -20%,#1aa06d,#0a5a3c)" } }, [el("div", { class: "lbl" }, s.type === "work" ? "Exercice (tour " + (Math.floor(state.i / (state.seq.length / rounds)) + 1) + "/" + rounds + ")" : "Repos"), dial, label]), el("div", { class: "ff-btns", style: { justifyContent: "center", marginTop: "12px" } }, [el("button", { class: "ff-btn gold", onClick: stop }, "⏹ Arrêter")])]));
        return;
      }
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-field" }, [el("label", "Nombre de tours"), el("input", { class: "ff-input", type: "number", min: "1", value: rounds, onInput: (e) => { rounds = Math.max(1, +e.target.value); st.set("rounds", rounds); } })]), el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [el("button", { class: "ff-btn primary", onClick: start }, "▶ Démarrer le circuit")])]),
        el("div", { class: "ff-panel" }, [el("h2", "Exercices"),
          el("table", { class: "ff-table" }, [el("tr", [el("th", "Exercice"), el("th", { class: "num" }, "Effort (s)"), el("th", { class: "num" }, "Repos (s)"), el("th", "")]),
            ...ex.map((e, i) => el("tr", [el("td", el("input", { class: "ff-input", value: e.n, onInput: (ev) => { e.n = ev.target.value; st.set("ex", ex); } })), el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "70px" }, value: e.w, onInput: (ev) => { e.w = +ev.target.value; st.set("ex", ex); } })), el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", style: { width: "70px" }, value: e.r, onInput: (ev) => { e.r = +ev.target.value; st.set("ex", ex); } })), el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { ex.splice(i, 1); st.set("ex", ex); render(); } }, "✕"))]))]),
          el("button", { class: "ff-btn sm ghost", style: { marginTop: "8px" }, onClick: () => { ex.push({ n: "Nouvel exercice", w: 30, r: 10 }); st.set("ex", ex); render(); } }, "＋ Exercice")])
      );
    }
    render();
  }
});
