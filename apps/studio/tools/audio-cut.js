/* Découpeur Audio — decodeAudioData, segment PCM WAV réel */
FF.register({
  id: "audio-cut", title: "Découpeur Audio", icon: "✂️", tag: "Audio",
  desc: "Charge un audio, choisis début/fin en secondes, exporte le segment en WAV PCM.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("audio-cut");
    let audioBuffer = null;
    let duration = 0;
    let fileName = "audio";

    let startT = st.get("start", 0);
    let endT = st.get("end", 10);

    const durLabel = el("span", { text: "—" });
    const startInput = el("input", {
      type: "number", class: "ff-input", min: "0", step: "0.1", value: startT,
      onInput: function(e) { startT = +e.target.value; st.set("start", startT); }
    });
    const endInput = el("input", {
      type: "number", class: "ff-input", min: "0", step: "0.1", value: endT,
      onInput: function(e) { endT = +e.target.value; st.set("end", endT); }
    });

    function encodeWAV(buffer, start, end) {
      const sampleRate = buffer.sampleRate;
      const numChannels = buffer.numberOfChannels;
      const startSample = Math.floor(start * sampleRate);
      const endSample = Math.min(Math.floor(end * sampleRate), buffer.length);
      const length = Math.max(0, endSample - startSample);
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * bitsPerSample / 8;
      const blockAlign = numChannels * bitsPerSample / 8;
      const dataSize = length * numChannels * (bitsPerSample / 8);
      const wavBuf = new ArrayBuffer(44 + dataSize);
      const view = new DataView(wavBuf);

      function writeString(offset, str) {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      }

      writeString(0, "RIFF");
      view.setUint32(4, 36 + dataSize, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, "data");
      view.setUint32(40, dataSize, true);

      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          const sample = buffer.getChannelData(ch)[startSample + i];
          const clamped = Math.max(-1, Math.min(1, sample));
          const int16 = clamped < 0 ? clamped * 32768 : clamped * 32767;
          view.setInt16(offset, Math.round(int16), true);
          offset += 2;
        }
      }
      return wavBuf;
    }

    function doExport() {
      if (!audioBuffer) { toast("Charge un fichier audio d'abord", "err"); return; }
      const s = Math.max(0, startT);
      const e = Math.min(endT, duration);
      if (s >= e) { toast("Début doit être avant la fin", "err"); return; }
      const wav = encodeWAV(audioBuffer, s, e);
      const dur = (e - s).toFixed(2);
      save(fileName + "-segment-" + s + "s-" + e + "s.wav", new Blob([wav], { type: "audio/wav" }), "audio/wav");
      toast("Segment de " + dur + " s exporté en WAV", "ok");
    }

    const fileInput = el("input", {
      type: "file", accept: "audio/*", class: "ff-input",
      onChange: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        fileName = file.name.replace(/\.[^.]+$/, "");
        const reader = new FileReader();
        reader.onload = function(ev) {
          const actx = new (window.AudioContext || window.webkitAudioContext)();
          actx.decodeAudioData(ev.target.result).then(function(buf) {
            audioBuffer = buf;
            duration = buf.duration;
            durLabel.textContent = duration.toFixed(2) + " s";
            endInput.value = Math.min(endT, duration);
            endInput.max = duration.toFixed(2);
            startInput.max = duration.toFixed(2);
            toast("Audio chargé : " + duration.toFixed(1) + " s", "ok");
          }).catch(function() { toast("Format audio non supporté", "err"); });
        };
        reader.readAsArrayBuffer(file);
      }
    });

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Fichier audio"), fileInput]),
        el("div", { class: "ff-note" }, ["Durée totale : ", durLabel]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [el("label", "Début (secondes)"), startInput])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [el("label", "Fin (secondes)"), endInput])
          ])
        ]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: doExport }, "✂️ Exporter le segment WAV")
        ]),
        el("div", { class: "ff-note" }, "Encodage PCM 16-bit, stéréo/mono selon la source. Format WAV standard.")
      ])
    );
  }
});
