/* 8-Bit Retro Sound Generator — Web Audio, séquenceur de notes, presets SFX, export WAV */
FF.register({
  id: "retro-sound", title: "8-Bit Retro Sound Generator", icon: "🕹️", tag: "Audio",
  desc: "Génère des sons 8-bit (square/triangle/saw), séquenceur de notes, presets SFX, export WAV.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("retro-sound");

    const NOTE_FREQS = {
      "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23,
      "G4": 392.00, "A4": 440.00, "B4": 493.88, "C5": 523.25,
      "D5": 587.33, "E5": 659.25, "G5": 783.99, "REST": 0
    };
    const NOTE_NAMES = Object.keys(NOTE_FREQS);

    let waveType = st.get("wave", "square");
    let bpm = st.get("bpm", 120);
    let volume = st.get("volume", 0.5);
    let sequence = st.get("seq", ["C4", "E4", "G4", "C5", "G4", "E4", "C4", "REST"]);

    const PRESETS = {
      "Pièce (coin)": function() { return synthSFX("coin"); },
      "Saut": function() { return synthSFX("jump"); },
      "Laser": function() { return synthSFX("laser"); },
      "Power-Up": function() { return synthSFX("powerup"); },
      "Game Over": function() { return synthSFX("gameover"); }
    };

    function synthSFX(type) {
      const sampleRate = 44100;
      const duration = type === "gameover" ? 1.2 : 0.3;
      const len = Math.floor(sampleRate * duration);
      const data = new Float32Array(len);

      for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        let freq, amp;

        if (type === "coin") {
          freq = 988 + (i > len * 0.5 ? 200 : 0);
          amp = Math.max(0, 1 - progress * 1.5);
        } else if (type === "jump") {
          freq = 200 + progress * 600;
          amp = Math.max(0, 1 - progress);
        } else if (type === "laser") {
          freq = 800 - progress * 600;
          amp = Math.max(0, 1 - progress);
        } else if (type === "powerup") {
          freq = 200 + progress * 800 + Math.sin(progress * 40) * 50;
          amp = Math.max(0, 1 - progress * 0.5);
        } else if (type === "gameover") {
          const freqs = [392, 330, 294, 247];
          const fi = Math.min(3, Math.floor(progress * 4));
          freq = freqs[fi] * (1 - (progress % 0.25) * 0.1);
          amp = Math.max(0, 1 - progress);
        } else {
          freq = 440; amp = 1;
        }

        const phase = (i / sampleRate) * freq * 2 * Math.PI;
        let sample;
        if (waveType === "square") sample = Math.sin(phase) >= 0 ? 1 : -1;
        else if (waveType === "triangle") sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
        else sample = ((phase % (2 * Math.PI)) / Math.PI) - 1;

        data[i] = sample * amp * volume * 0.5;
      }
      return { data, sampleRate };
    }

    function synthSequence() {
      const sampleRate = 44100;
      const beatDuration = 60 / bpm / 2; // double croche
      const totalLen = sequence.length * Math.floor(sampleRate * beatDuration);
      const data = new Float32Array(totalLen);

      for (let n = 0; n < sequence.length; n++) {
        const note = sequence[n];
        const freq = NOTE_FREQS[note] || 0;
        const start = Math.floor(n * sampleRate * beatDuration);
        const noteLen = Math.floor(sampleRate * beatDuration * 0.85);
        for (let i = 0; i < noteLen; i++) {
          if (start + i >= totalLen) break;
          const t = i / sampleRate;
          const env = i < 100 ? i / 100 : Math.max(0, 1 - (i / noteLen));
          const phase = t * freq * 2 * Math.PI;
          let sample = 0;
          if (freq > 0) {
            if (waveType === "square") sample = Math.sin(phase) >= 0 ? 1 : -1;
            else if (waveType === "triangle") sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
            else sample = ((phase % (2 * Math.PI)) / Math.PI) - 1;
          }
          data[start + i] += sample * env * volume * 0.5;
        }
      }
      return { data, sampleRate };
    }

    function encodeWAV(floatData, sampleRate) {
      const len = floatData.length;
      const buf = new ArrayBuffer(44 + len * 2);
      const view = new DataView(buf);
      function ws(o, s) { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }
      ws(0, "RIFF"); view.setUint32(4, 36 + len * 2, true);
      ws(8, "WAVE"); ws(12, "fmt ");
      view.setUint32(16, 16, true); view.setUint16(20, 1, true);
      view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
      view.setUint16(34, 16, true); ws(36, "data"); view.setUint32(40, len * 2, true);
      for (let i = 0; i < len; i++) {
        const s = Math.max(-1, Math.min(1, floatData[i]));
        view.setInt16(44 + i * 2, Math.round(s * 32767), true);
      }
      return buf;
    }

    function playBuffer(audioData) {
      const actx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: audioData.sampleRate });
      const buf = actx.createBuffer(1, audioData.data.length, audioData.sampleRate);
      buf.copyToChannel(audioData.data, 0);
      const src = actx.createBufferSource();
      src.buffer = buf;
      src.connect(actx.destination);
      src.start();
      src.onended = function() { actx.close(); };
    }

    function exportWAV(audioData, name) {
      const wav = encodeWAV(audioData.data, audioData.sampleRate);
      save(name + ".wav", new Blob([wav], { type: "audio/wav" }), "audio/wav");
      toast("WAV exporté !", "ok");
    }

    const seqContainer = el("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-top:10px" });

    function renderSeq() {
      while (seqContainer.firstChild) seqContainer.removeChild(seqContainer.firstChild);
      sequence.forEach(function(note, i) {
        const sel = el("select", { class: "ff-select", style: "width:72px;padding:.3rem .4rem;font-size:.82rem" });
        NOTE_NAMES.forEach(function(n) {
          const opt = el("option", { value: n, text: n });
          if (n === note) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.onchange = function(e) { sequence[i] = e.target.value; st.set("seq", sequence); };
        const rm = el("button", {
          class: "ff-btn sm ghost", style: "margin-left:2px",
          onClick: function() { sequence.splice(i, 1); st.set("seq", sequence); renderSeq(); }
        }, "✕");
        seqContainer.append(el("div", { style: "display:flex;align-items:center;gap:2px" }, [sel, rm]));
      });
    }

    const waveSeg = el("div", { class: "ff-seg" }, [
      ["square", "Square ■"],
      ["triangle", "Triangle △"],
      ["sawtooth", "Saw ╱"]
    ].map(function(pair) {
      const btn = el("button", { class: waveType === pair[0] ? "on" : "", text: pair[1] });
      btn.onclick = function() {
        waveType = pair[0]; st.set("wave", waveType);
        waveSeg.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        btn.classList.add("on");
      };
      return btn;
    }));

    const bpmInput = el("input", {
      type: "range", min: "60", max: "220", step: "5", value: bpm, class: "ff-input",
      onInput: function(e) { bpm = +e.target.value; bpmLabel.textContent = bpm + " BPM"; st.set("bpm", bpm); }
    });
    const bpmLabel = el("span", { text: bpm + " BPM" });

    const volInput = el("input", {
      type: "range", min: "0.1", max: "1", step: "0.05", value: volume, class: "ff-input",
      onInput: function(e) { volume = +e.target.value; volLabel.textContent = Math.round(volume * 100) + " %"; st.set("volume", volume); }
    });
    const volLabel = el("span", { text: Math.round(volume * 100) + " %" });

    const presetBtns = el("div", { class: "ff-btns" }, Object.entries(PRESETS).map(function(pair) {
      const name = pair[0];
      const fn = pair[1];
      return el("button", { class: "ff-btn sm gold", onClick: function() {
        const audio = fn();
        playBuffer(audio);
      }}, "▶ " + name);
    }));

    const presetExportBtns = el("div", { class: "ff-btns" }, Object.entries(PRESETS).map(function(pair) {
      const name = pair[0];
      const fn = pair[1];
      return el("button", { class: "ff-btn sm ghost", onClick: function() {
        const audio = fn();
        exportWAV(audio, "sfx-" + name.toLowerCase().replace(/[^a-z0-9]/g, "-"));
      }}, "⬇️ " + name);
    }));

    renderSeq();

    root.append(
      el("div", { class: "ff-panel" }, [
        el("h2", "Forme d'onde"),
        el("div", { class: "ff-field" }, [el("label", "Type"), waveSeg]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [el("label", ["Tempo : ", bpmLabel]), bpmInput])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [el("label", ["Volume : ", volLabel]), volInput])
          ])
        ])
      ]),
      el("div", { class: "ff-panel" }, [
        el("h2", "Presets SFX"),
        presetBtns,
        el("div", { class: "ff-note", style: "margin-top:8px" }, "Exporter en WAV :"),
        presetExportBtns
      ]),
      el("div", { class: "ff-panel" }, [
        el("h2", "Séquenceur de notes"),
        seqContainer,
        el("div", { class: "ff-btns", style: "margin-top:12px" }, [
          el("button", { class: "ff-btn sm ghost", onClick: function() {
            sequence.push("C4"); st.set("seq", sequence); renderSeq();
          }}, "＋ Note"),
          el("button", { class: "ff-btn primary", onClick: function() {
            playBuffer(synthSequence());
          }}, "▶ Jouer la séquence"),
          el("button", { class: "ff-btn accent", onClick: function() {
            exportWAV(synthSequence(), "sequence-8bit");
          }}, "⬇️ Exporter WAV")
        ])
      ])
    );
  }
});
