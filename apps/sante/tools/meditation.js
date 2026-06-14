/* Meditation Soundscape — ambiances apaisantes + minuterie d'arrêt automatique. */
FF.register({
  id: "meditation", title: "Méditation", icon: "🧘", tag: "Calme",
  desc: "Drone apaisant, océan et pluie à doser, avec minuterie d’arrêt en douceur.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("meditation");
    let vols = st.get("vols", { drone: 40, ocean: 35, pluie: 0 });
    let minutes = st.get("minutes", 10);
    let actx = null, nodes = {}, playing = false, stopTimer = null, endAt = 0, tick = null;
    function noise(a, brown) { const b = a.createBuffer(1, a.sampleRate * 3, a.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return b; }
    function start() {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      // drone : deux oscillateurs légèrement désaccordés (La grave)
      const dg = actx.createGain(); dg.gain.value = vols.drone / 100 * 0.25; dg.connect(actx.destination);
      [110, 110.6, 165].forEach((fq) => { const o = actx.createOscillator(); o.type = "sine"; o.frequency.value = fq; o.connect(dg); o.start(); });
      nodes.drone = dg;
      // océan : bruit brun + LFO d'amplitude
      const og = actx.createGain(); og.gain.value = 0; og.connect(actx.destination); const os = actx.createBufferSource(); os.buffer = noise(actx, true); os.loop = true; const of = actx.createBiquadFilter(); of.type = "lowpass"; of.frequency.value = 380; os.connect(of); of.connect(og); os.start();
      const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 0.1; lg.gain.value = vols.ocean / 100 * 0.4; lfo.connect(lg); lg.connect(og.gain); lfo.start(); nodes.ocean = lg; nodes.oceanBase = og;
      // pluie : bruit blanc + highpass
      const pg = actx.createGain(); pg.gain.value = vols.pluie / 100 * 0.4; pg.connect(actx.destination); const ps = actx.createBufferSource(); ps.buffer = noise(actx, false); ps.loop = true; const pf = actx.createBiquadFilter(); pf.type = "highpass"; pf.frequency.value = 1200; ps.connect(pf); pf.connect(pg); ps.start(); nodes.pluie = pg;
      playing = true;
      if (minutes > 0) { endAt = Date.now() + minutes * 60000; stopTimer = setTimeout(stop, minutes * 60000); tick = setInterval(() => render(), 1000); }
      render();
    }
    function stop() { clearTimeout(stopTimer); clearInterval(tick); if (actx) { actx.close(); actx = null; nodes = {}; } playing = false; render(); }
    function setVol(k, v) { vols[k] = v; st.set("vols", vols); if (!playing) return; if (k === "drone" && nodes.drone) nodes.drone.gain.value = v / 100 * 0.25; if (k === "ocean" && nodes.ocean) nodes.ocean.gain.value = v / 100 * 0.4; if (k === "pluie" && nodes.pluie) nodes.pluie.gain.value = v / 100 * 0.4; }
    const out = el("div");
    function render() {
      ctx.clear(out);
      const remain = playing && endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : 0;
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, playing ? "En cours" : "Prêt"), el("div", { class: "big" }, playing && minutes > 0 ? Math.floor(remain / 60) + ":" + String(remain % 60).padStart(2, "0") : "🧘")]),
          el("div", { class: "ff-field", style: { marginTop: "12px" } }, [el("label", "Minuterie d’arrêt"), el("div", {}, [0, 5, 10, 15, 30].map((m) => el("button", { class: "ff-chip", style: { cursor: "pointer", background: minutes === m ? "var(--pg-yel)" : "var(--pg-pale)" }, onClick: () => { minutes = m; st.set("minutes", m); render(); } }, m === 0 ? "∞" : m + " min")))]),
          el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [playing ? el("button", { class: "ff-btn gold", onClick: stop }, "⏹ Arrêter") : el("button", { class: "ff-btn primary", onClick: start }, "▶ Commencer")])
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Ambiances"), ...[["drone", "Drone apaisant", "🎵"], ["ocean", "Océan", "🌊"], ["pluie", "Pluie", "🌧️"]].map(([k, name, ic]) => el("div", { style: { display: "flex", alignItems: "center", gap: "12px", margin: "10px 0" } }, [
          el("div", { style: { fontSize: "1.5rem", width: "34px" } }, ic), el("div", { style: { width: "120px", fontWeight: "800" } }, name),
          el("input", { type: "range", min: "0", max: "100", value: vols[k] || 0, style: { flex: "1" }, onInput: (e) => setVol(k, +e.target.value) })
        ]))])
      );
    }
    root.append(out); render();
  }
});
