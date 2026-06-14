/* BPM & Tap Tempo Metronome — Web Audio, TAP BPM, signature, premier temps accentué */
FF.register({
  id: "metronome", title: "BPM & Tap Tempo Metronome", icon: "🥁", tag: "Audio",
  desc: "Métronome précis Web Audio. Curseur BPM 40-240, TAP tempo, signature rythmique, premier temps accentué.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("metronome");

    let bpm = st.get("bpm", 120);
    let beatsPerMeasure = st.get("beats", 4);
    let isRunning = false;
    let currentBeat = 0;
    let audioCtx = null;
    let nextTime = 0;
    let scheduleId = null;
    let tapTimes = [];

    const BPM_MIN = 40, BPM_MAX = 240;

    function getAudioCtx() {
      if (!audioCtx || audioCtx.state === "closed") {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return audioCtx;
    }

    function click(time, accent) {
      const actx = getAudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.frequency.value = accent ? 1200 : 880;
      gain.gain.setValueAtTime(accent ? 0.8 : 0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.start(time);
      osc.stop(time + 0.1);
    }

    function schedule() {
      const actx = getAudioCtx();
      const lookAhead = 0.1;
      const scheduleAhead = 0.05;

      while (nextTime < actx.currentTime + lookAhead) {
        const accent = currentBeat === 0;
        click(nextTime, accent);
        // Mise à jour visuelle avec un délai approximatif
        (function(beat, when) {
          setTimeout(function() {
            if (isRunning) updateBeatDisplay(beat);
          }, Math.max(0, (when - actx.currentTime) * 1000));
        })(currentBeat, nextTime);

        currentBeat = (currentBeat + 1) % beatsPerMeasure;
        nextTime += 60 / bpm;
      }
      if (isRunning) scheduleId = setTimeout(schedule, scheduleAhead * 1000);
    }

    function start() {
      if (isRunning) return;
      isRunning = true;
      currentBeat = 0;
      const actx = getAudioCtx();
      nextTime = actx.currentTime + 0.1;
      schedule();
      startBtn.textContent = "⏹ Stop";
      startBtn.classList.add("primary");
      startBtn.classList.remove("gold");
    }

    function stop() {
      isRunning = false;
      clearTimeout(scheduleId);
      updateBeatDisplay(-1);
      startBtn.textContent = "▶ Start";
      startBtn.classList.remove("primary");
      startBtn.classList.add("gold");
    }

    function updateBeatDisplay(beat) {
      beatDots.forEach(function(dot, i) {
        dot.style.background = i === beat ? (i === 0 ? "var(--pg-org)" : "var(--pg-yel)") : "var(--pg-sky2)";
        dot.style.transform = i === beat ? "scale(1.3)" : "scale(1)";
      });
    }

    const bpmLabel = el("span", { text: bpm, style: "font-family:var(--pg-head);font-size:2.5rem;font-weight:700;color:var(--pg-navy)" });

    const bpmSlider = el("input", {
      type: "range", min: BPM_MIN, max: BPM_MAX, value: bpm, class: "ff-input",
      onInput: function(e) {
        bpm = +e.target.value;
        bpmLabel.textContent = bpm;
        tempoLabel.textContent = tempoName(bpm);
        st.set("bpm", bpm);
        if (isRunning) { stop(); start(); }
      }
    });

    function tempoName(b) {
      if (b < 60) return "Largo";
      if (b < 66) return "Larghetto";
      if (b < 76) return "Adagio";
      if (b < 108) return "Andante";
      if (b < 120) return "Moderato";
      if (b < 156) return "Allegro";
      if (b < 176) return "Vivace";
      if (b < 200) return "Presto";
      return "Prestissimo";
    }

    const tempoLabel = el("span", { class: "ff-chip", text: tempoName(bpm) });

    const startBtn = el("button", { class: "ff-btn gold", style: "font-size:1.3rem;padding:1rem 2rem", onClick: function() {
      if (isRunning) stop(); else start();
    }}, "▶ Start");

    const tapBtn = el("button", { class: "ff-btn accent", style: "font-size:1.1rem;padding:.9rem 1.6rem", onClick: function() {
      const now = Date.now();
      tapTimes.push(now);
      if (tapTimes.length > 5) tapTimes = tapTimes.slice(-5);
      if (tapTimes.length >= 2) {
        let totalInterval = 0;
        for (let i = 1; i < tapTimes.length; i++) totalInterval += tapTimes[i] - tapTimes[i - 1];
        const avgMs = totalInterval / (tapTimes.length - 1);
        bpm = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(60000 / avgMs)));
        bpmLabel.textContent = bpm;
        bpmSlider.value = bpm;
        tempoLabel.textContent = tempoName(bpm);
        st.set("bpm", bpm);
        if (isRunning) { stop(); start(); }
      }
      toast("TAP " + (tapTimes.length >= 2 ? "→ " + bpm + " BPM" : "(continue...)"), "ok");
    }}, "👆 TAP");

    const beatDots = [];
    const dotsWrap = el("div", { style: "display:flex;gap:12px;justify-content:center;align-items:center;margin:16px 0" });

    function buildDots() {
      while (dotsWrap.firstChild) dotsWrap.removeChild(dotsWrap.firstChild);
      beatDots.length = 0;
      for (let i = 0; i < beatsPerMeasure; i++) {
        const dot = el("div", {
          style: "width:" + (i === 0 ? "48px" : "38px") + ";height:" + (i === 0 ? "48px" : "38px") + ";border-radius:50%;background:var(--pg-sky2);border:3px solid var(--pg-navy);transition:all .08s"
        });
        beatDots.push(dot);
        dotsWrap.append(dot);
      }
    }

    const beatSig = el("div", { class: "ff-seg" }, [2, 3, 4, 5, 6, 7, 8].map(function(n) {
      const btn = el("button", { class: beatsPerMeasure === n ? "on" : "", text: n + "/4" });
      btn.onclick = function() {
        beatsPerMeasure = n; st.set("beats", n);
        beatSig.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        btn.classList.add("on");
        currentBeat = 0;
        buildDots();
        if (isRunning) { stop(); start(); }
      };
      return btn;
    }));

    buildDots();

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { style: "text-align:center;margin-bottom:16px" }, [
          el("div", { style: "display:flex;align-items:baseline;justify-content:center;gap:10px" }, [
            bpmLabel,
            el("span", { style: "color:var(--pg-mut);font-size:1rem" }, "BPM"),
            tempoLabel
          ]),
          bpmSlider
        ]),
        dotsWrap,
        el("div", { class: "ff-field" }, [el("label", "Signature rythmique"), beatSig]),
        el("div", { class: "ff-btns", style: "justify-content:center;gap:16px;margin-top:16px" }, [startBtn, tapBtn]),
        el("div", { class: "ff-note" }, "Tap au moins 2 fois pour calculer le BPM. Le premier temps (accent fort) s'affiche en orange.")
      ]),
      el("div", { class: "ff-panel" }, [
        el("h2", "Guide de tempos"),
        el("div", { class: "ff-stats" }, [
          ["Largo", "< 60"], ["Adagio", "66-76"], ["Andante", "76-108"],
          ["Moderato", "108-120"], ["Allegro", "120-156"], ["Presto", "168+"]
        ].map(function(pair) {
          return el("div", { class: "ff-stat", style: "cursor:pointer", onClick: function() {
            const mid = pair[1].includes("-") ? +pair[1].split("-")[0] + 8 : parseInt(pair[1]) + 8;
            bpm = Math.max(BPM_MIN, Math.min(BPM_MAX, mid));
            bpmLabel.textContent = bpm; bpmSlider.value = bpm;
            tempoLabel.textContent = tempoName(bpm); st.set("bpm", bpm);
            if (isRunning) { stop(); start(); }
          }}, [el("div", { class: "v" }, pair[0]), el("div", { class: "k" }, pair[1] + " BPM")]);
        }))
      ])
    );
  }
});
