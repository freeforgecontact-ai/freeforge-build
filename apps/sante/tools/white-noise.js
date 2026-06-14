/* White Noise Soundscape Mixer — console multi-canaux (Web Audio). */
FF.register({
  id: "white-noise", title: "Mixeur de Bruits", icon: "🌧️", tag: "Ambiance",
  desc: "Mélange pluie, vent, vagues, feu, café et bruit brun à volumes indépendants.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("whitenoise");
    const CH = [
      { id: "pluie", name: "Pluie", icon: "🌧️", type: "highpass", freq: 1200, lfo: 0 },
      { id: "vent", name: "Vent", icon: "💨", type: "lowpass", freq: 500, lfo: 0.08 },
      { id: "vagues", name: "Vagues", icon: "🌊", type: "lowpass", freq: 420, lfo: 0.12, amp: true },
      { id: "feu", name: "Feu", icon: "🔥", type: "bandpass", freq: 180, lfo: 0 },
      { id: "cafe", name: "Café", icon: "☕", type: "lowpass", freq: 900, lfo: 0 },
      { id: "brun", name: "Bruit brun", icon: "🟤", type: "lowpass", freq: 300, lfo: 0 }
    ];
    let vols = st.get("vols", { pluie: 50, vagues: 30 });
    let actx = null, nodes = {}, playing = false;
    function noiseBuffer(a, brown) {
      const buf = a.createBuffer(1, a.sampleRate * 3, a.sampleRate), d = buf.getChannelData(0); let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
      return buf;
    }
    function start() {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const white = noiseBuffer(actx, false), brown = noiseBuffer(actx, true);
      CH.forEach((c) => {
        const src = actx.createBufferSource(); src.buffer = c.id === "pluie" ? white : brown; src.loop = true;
        const filt = actx.createBiquadFilter(); filt.type = c.type; filt.frequency.value = c.freq; if (c.type === "bandpass") filt.Q.value = 2;
        const g = actx.createGain(); g.gain.value = (vols[c.id] || 0) / 100 * 0.6;
        src.connect(filt); filt.connect(g); g.connect(actx.destination); src.start();
        if (c.lfo) { const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = c.lfo; lg.gain.value = c.amp ? (vols[c.id] || 0) / 100 * 0.3 : 150; lfo.connect(lg); lg.connect(c.amp ? g.gain : filt.frequency); lfo.start(); }
        nodes[c.id] = g;
      });
      playing = true; render();
    }
    function stop() { if (actx) { actx.close(); actx = null; nodes = {}; } playing = false; render(); }
    const out = el("div");
    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [
          playing ? el("button", { class: "ff-btn gold", onClick: stop }, "⏹ Arrêter") : el("button", { class: "ff-btn primary", onClick: start }, "▶ Démarrer le mix")
        ])]),
        el("div", { class: "ff-panel" }, [el("h2", "Canaux"), ...CH.map((c) => el("div", { style: { display: "flex", alignItems: "center", gap: "12px", margin: "10px 0" } }, [
          el("div", { style: { fontSize: "1.6rem", width: "34px" } }, c.icon),
          el("div", { style: { width: "90px", fontWeight: "800" } }, c.name),
          el("input", { type: "range", min: "0", max: "100", value: vols[c.id] || 0, style: { flex: "1" }, onInput: (e) => { vols[c.id] = +e.target.value; st.set("vols", vols); if (nodes[c.id]) nodes[c.id].gain.value = vols[c.id] / 100 * 0.6; } }),
          el("div", { style: { width: "36px", textAlign: "right", color: "var(--pg-mut)" } }, (vols[c.id] || 0) + "")
        ]))]),
        el("div", { class: "ff-note" }, "Monte plusieurs canaux ensemble pour créer ton ambiance. Tout est généré sur l’appareil (aucun fichier audio).")
      );
    }
    root.append(out); render();
  }
});
