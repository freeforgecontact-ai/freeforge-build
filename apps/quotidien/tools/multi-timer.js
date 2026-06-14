/* Multi-Timer de Cuisson — minuteurs nommés indépendants, alarme Web Audio, persistance. */
FF.register({
  id: "multi-timer", title: "Multi-Timer de Cuisson", icon: "⏱️", tag: "Cuisine",
  desc: "Plusieurs minuteurs nommés indépendants. Alarme sonore et toast quand ça sonne.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("multi-timer");
    const out = el("div");

    let defs = st.get("defs", [
      { id: 1, label: "Pâtes", minutes: 10 },
      { id: 2, label: "Sauce", minutes: 20 },
      { id: 3, label: "Pain", minutes: 30 }
    ]);
    let nextId = st.get("nextId", 4);

    // Timers state (en mémoire uniquement)
    const timers = {};

    function persistDefs() {
      st.set("defs", defs);
      st.set("nextId", nextId);
    }

    function playAlarm() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ac = new AudioContext();
        const freqs = [880, 1100, 880, 660, 880];
        let t = ac.currentTime;
        freqs.forEach(freq => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.connect(gain);
          gain.connect(ac.destination);
          osc.frequency.value = freq;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.start(t);
          osc.stop(t + 0.18);
          t += 0.22;
        });
      } catch (_) {}
    }

    function startTimer(id) {
      const def = defs.find(d => d.id === id);
      if (!def) return;
      if (timers[id] && timers[id].interval) clearInterval(timers[id].interval);
      const total = (def.minutes || 0) * 60;
      const startedAt = Date.now();
      timers[id] = { total, startedAt, remaining: total, running: true, finished: false };
      timers[id].interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        timers[id].remaining = Math.max(0, total - elapsed);
        if (timers[id].remaining <= 0) {
          clearInterval(timers[id].interval);
          timers[id].running = false;
          timers[id].finished = true;
          playAlarm();
          toast("⏰ " + def.label + " — TERMINÉ !", "ok");
        }
        renderTimerEl(id);
      }, 1000);
    }

    function pauseTimer(id) {
      if (!timers[id]) return;
      clearInterval(timers[id].interval);
      timers[id].running = false;
    }

    function resumeTimer(id) {
      const t = timers[id];
      if (!t || t.running || t.finished) return;
      const remaining = t.remaining;
      const startedAt = Date.now() - (t.total - remaining) * 1000;
      t.startedAt = startedAt;
      t.running = true;
      t.interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - t.startedAt) / 1000);
        t.remaining = Math.max(0, t.total - elapsed);
        if (t.remaining <= 0) {
          clearInterval(t.interval);
          t.running = false;
          t.finished = true;
          const def = defs.find(d => d.id === id);
          playAlarm();
          toast("⏰ " + (def ? def.label : "Timer") + " — TERMINÉ !", "ok");
        }
        renderTimerEl(id);
      }, 1000);
    }

    function resetTimer(id) {
      if (timers[id] && timers[id].interval) clearInterval(timers[id].interval);
      delete timers[id];
      renderTimerEl(id);
    }

    function fmtTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }

    function fmtPct(id) {
      const t = timers[id];
      if (!t) return 100;
      return Math.round((t.remaining / t.total) * 100);
    }

    const timerEls = {};

    function renderTimerEl(id) {
      const el2 = timerEls[id];
      if (!el2) return;
      const t = timers[id];
      const def = defs.find(d => d.id === id);
      if (!def) return;
      ctx.clear(el2);
      const remaining = t ? t.remaining : (def.minutes * 60);
      const pct = t ? fmtPct(id) : 100;
      const isRunning = t && t.running;
      const isFinished = t && t.finished;
      const isPaused = t && !t.running && !t.finished;

      const circleSize = 80;
      const r = 34;
      const circ = 2 * Math.PI * r;
      const dashOffset = circ * (1 - pct / 100);
      const color = isFinished ? "var(--pg-err)" : isRunning ? "var(--pg-ok)" : "var(--pg-blue)";

      el2.append(
        el("div", { style: { background: isFinished ? "#fee2e2" : "#fff", border: "3px solid " + color, borderRadius: "16px", padding: "16px 14px", textAlign: "center", position: "relative", transition: "all .3s" } }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" } }, [
            el("input", { class: "ff-input", value: def.label, style: { fontWeight: "800", border: "none", background: "transparent", padding: "0", fontSize: "1rem", color: "var(--pg-navy)", width: "120px" }, onInput: e => { def.label = e.target.value; persistDefs(); } }),
            el("button", { class: "ff-btn sm ghost", style: { padding: "2px 6px" }, onClick: () => {
              if (timers[id] && timers[id].interval) clearInterval(timers[id].interval);
              delete timers[id]; delete timerEls[id];
              defs = defs.filter(d => d.id !== id);
              persistDefs(); render();
            }}, "✕")
          ]),
          el("svg", { width: circleSize, height: circleSize, viewBox: "0 0 " + circleSize + " " + circleSize, style: { display: "block", margin: "0 auto 10px" } }, [
            el("circle", { cx: circleSize/2, cy: circleSize/2, r, fill: "none", stroke: "var(--pg-sky2)", "stroke-width": "6" }),
            el("circle", { cx: circleSize/2, cy: circleSize/2, r, fill: "none", stroke: color, "stroke-width": "6", "stroke-dasharray": circ, "stroke-dashoffset": dashOffset, "stroke-linecap": "round", transform: "rotate(-90 " + circleSize/2 + " " + circleSize/2 + ")", style: "transition: stroke-dashoffset .9s linear" }),
            el("text", { x: circleSize/2, y: circleSize/2 + 6, "text-anchor": "middle", "font-size": "16", "font-weight": "800", fill: color }, fmtTime(remaining))
          ]),
          el("div", { style: { display: "flex", gap: "4px", justifyContent: "center" } }, [
            !t || (!isRunning && !isPaused)
              ? el("button", { class: "ff-btn sm primary", onClick: () => startTimer(id) }, "▶ Start")
              : null,
            isRunning
              ? el("button", { class: "ff-btn sm gold", onClick: () => { pauseTimer(id); renderTimerEl(id); } }, "⏸ Pause")
              : null,
            isPaused
              ? el("button", { class: "ff-btn sm primary", onClick: () => { resumeTimer(id); renderTimerEl(id); } }, "▶ Reprendre")
              : null,
            t ? el("button", { class: "ff-btn sm ghost", onClick: () => { resetTimer(id); } }, "↺ Reset") : null
          ]),
          el("div", { class: "ff-field", style: { marginTop: "10px", marginBottom: "0", display: !t ? "block" : "none" } }, [
            el("label", { style: { fontSize: ".78rem" } }, "Minutes"),
            el("input", { class: "ff-input", type: "number", min: "1", max: "999", value: def.minutes, onInput: e => { def.minutes = Math.max(1, +e.target.value || 1); persistDefs(); }, style: { textAlign: "center" } })
          ])
        ])
      );
    }

    function render() {
      ctx.clear(out);
      const labelInp = el("input", { class: "ff-input", placeholder: "Nom du minuteur…", style: { maxWidth: "200px" } });
      const minsInp = el("input", { class: "ff-input", type: "number", min: "1", value: "5", style: { width: "80px" } });

      const timerGrid = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px", marginTop: "14px" } });

      defs.forEach(def => {
        const box = el("div");
        timerEls[def.id] = box;
        timerGrid.append(box);
        renderTimerEl(def.id);
      });

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" } }, [
            el("h2", { style: { margin: 0 } }, "Mes minuteurs"),
            el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } }, [
              labelInp,
              el("div", { style: { display: "flex", alignItems: "center", gap: "6px" } }, [minsInp, el("span", { style: { fontWeight: "700" } }, "min")]),
              el("button", { class: "ff-btn sm primary", onClick: () => {
                const label = labelInp.value.trim() || "Minuteur";
                const mins = Math.max(1, parseInt(minsInp.value) || 5);
                defs.push({ id: nextId, label, minutes: mins });
                nextId++;
                persistDefs();
                render();
              }}, "＋ Ajouter")
            ])
          ]),
          defs.length === 0 ? el("div", { class: "ff-empty" }, "Ajoute ton premier minuteur.") : timerGrid
        ])
      );
    }

    root.append(out);
    render();
  }
});
