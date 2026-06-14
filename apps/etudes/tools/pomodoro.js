/* Pomodoro Focus Engine — minuteur, bruit de fond Web Audio, compteur persisté. */
FF.register({
  id: "pomodoro", title: "Pomodoro Focus", icon: "🍅", tag: "Focus",
  desc: "Cycles travail/pause, bruit de fond optionnel et compteur de sessions conservé.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("pomodoro");
    let cfg = st.get("cfg", { work: 25, brk: 5 });
    let done = st.get("done", 0);
    let left = cfg.work * 60, phase = "work", running = false, timer = null;
    let actx = null, noiseNode = null, noiseOn = false;
    const out = el("div");
    function fmt(t) { return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); }
    function beep() { try { const a = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 660; g.gain.value = .2; o.start(); setTimeout(() => { o.stop(); }, 350); } catch (e) {} }
    function noise(on) {
      try {
        if (on) { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.25; const src = actx.createBufferSource(); src.buffer = buf; src.loop = true; const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 800; src.connect(f); f.connect(actx.destination); src.start(); noiseNode = src; }
        else if (noiseNode) { noiseNode.stop(); noiseNode = null; }
      } catch (e) {}
    }
    function tick() { if (left > 0) { left--; paint(); } else { beep(); if (phase === "work") { done++; st.set("done", done); phase = "brk"; left = cfg.brk * 60; toast("Pause !", "ok"); } else { phase = "work"; left = cfg.work * 60; toast("Au travail !", "ok"); } paint(); } }
    function start() { if (running) return; running = true; if (noiseOn) noise(true); timer = setInterval(tick, 1000); render(); }
    function pause() { running = false; clearInterval(timer); noise(false); render(); }
    function reset() { pause(); phase = "work"; left = cfg.work * 60; render(); }
    let dial;
    function paint() { if (dial) dial.textContent = fmt(left); }
    function render() {
      ctx.clear(out);
      dial = el("div", { class: "big", style: { fontSize: "4rem" } }, fmt(left));
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result", style: { background: phase === "work" ? "radial-gradient(120% 140% at 50% -20%,#14589b,#0a3559)" : "radial-gradient(120% 140% at 50% -20%,#1aa06d,#0a5a3c)" } }, [el("div", { class: "lbl" }, phase === "work" ? "Concentration" : "Pause"), dial]),
          el("div", { class: "ff-btns", style: { justifyContent: "center", marginTop: "14px" } }, [
            running ? el("button", { class: "ff-btn gold", onClick: pause }, "⏸ Pause") : el("button", { class: "ff-btn primary", onClick: start }, "▶ Démarrer"),
            el("button", { class: "ff-btn ghost", onClick: reset }, "↺ Réinitialiser"),
            el("button", { class: "ff-btn ghost", onClick: () => { noiseOn = !noiseOn; noise(running && noiseOn); render(); } }, (noiseOn ? "🔊" : "🔇") + " Bruit de fond")
          ]),
          el("div", { style: { textAlign: "center", marginTop: "10px" } }, ["Sessions complétées : ", el("b", String(done))])
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Durées"), el("div", { class: "ff-row" }, [
          el("div", { class: "ff-field ff-col" }, [el("label", "Travail (min)"), el("input", { class: "ff-input", type: "number", value: cfg.work, onInput: (e) => { cfg.work = +e.target.value; st.set("cfg", cfg); if (!running && phase === "work") { left = cfg.work * 60; paint(); } } })]),
          el("div", { class: "ff-field ff-col" }, [el("label", "Pause (min)"), el("input", { class: "ff-input", type: "number", value: cfg.brk, onInput: (e) => { cfg.brk = +e.target.value; st.set("cfg", cfg); } })])
        ])])
      );
    }
    root.append(out); render();
  }
});
