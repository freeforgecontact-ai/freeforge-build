/* Générateur Waveform Vidéo — anime barres sur Canvas, enregistre WebM via MediaRecorder */
FF.register({
  id: "waveform", title: "Générateur Waveform Vidéo", icon: "📊", tag: "Vidéo/WebM",
  desc: "Charge un audio, visualise la waveform animée sur Canvas, enregistre en WebM et télécharge.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("waveform");
    let audioCtx = null;
    let analyser = null;
    let source = null;
    let animFrame = null;
    let recorder = null;
    let audioBuffer = null;
    let isRecording = false;
    let fileName = "waveform";

    let barColor = st.get("barColor", "#ffd23f");
    let bgColor = st.get("bgColor", "#0a3559");
    let barCount = st.get("barCount", 64);

    const canvas = el("canvas", {
      style: "width:100%;border:3px solid var(--pg-navy);border-radius:14px;display:block;background:#0a3559"
    });
    canvas.width = 640; canvas.height = 200;

    const statusEl = el("span", { class: "ff-chip", text: "En attente" });

    function drawBars(dataArray) {
      const cctx = canvas.getContext("2d");
      if (!cctx) return;
      cctx.fillStyle = bgColor;
      cctx.fillRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / barCount - 2;
      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i] / 255;
        const h = val * canvas.height;
        cctx.fillStyle = barColor;
        cctx.fillRect(i * (barW + 2) + 1, canvas.height - h, barW, h);
      }
    }

    function drawIdle() {
      const cctx = canvas.getContext("2d");
      if (!cctx) return;
      cctx.fillStyle = bgColor;
      cctx.fillRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / barCount - 2;
      for (let i = 0; i < barCount; i++) {
        const h = 4;
        cctx.fillStyle = barColor;
        cctx.fillRect(i * (barW + 2) + 1, canvas.height / 2 - 2, barW, h);
      }
    }

    function animate() {
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      drawBars(data);
      animFrame = requestAnimationFrame(animate);
    }

    function startRecording() {
      if (!audioBuffer) { toast("Charge un fichier audio d'abord", "err"); return; }
      if (isRecording) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = barCount * 2;
      source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      const stream = canvas.captureStream(30);
      recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
      const chunks = [];
      recorder.ondataavailable = function(e) { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = function() {
        const blob = new Blob(chunks, { type: "video/webm" });
        save(fileName + "-waveform.webm", blob, "video/webm");
        statusEl.textContent = "Terminé";
        isRecording = false;
        toast("Vidéo WebM enregistrée !", "ok");
      };
      recorder.start();
      source.start();
      source.onended = function() {
        cancelAnimationFrame(animFrame);
        recorder.stop();
        audioCtx.close();
      };
      animate();
      isRecording = true;
      statusEl.textContent = "Enregistrement en cours…";
      toast("Enregistrement lancé…", "ok");
    }

    function stopRecording() {
      if (!isRecording) return;
      cancelAnimationFrame(animFrame);
      if (recorder && recorder.state !== "inactive") recorder.stop();
      if (source) { try { source.stop(); } catch(e) {} }
      if (audioCtx) audioCtx.close();
      isRecording = false;
      statusEl.textContent = "Arrêté";
    }

    const fileInput = el("input", {
      type: "file", accept: "audio/*", class: "ff-input",
      onChange: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        fileName = file.name.replace(/\.[^.]+$/, "");
        const reader = new FileReader();
        reader.onload = function(ev) {
          const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
          tmpCtx.decodeAudioData(ev.target.result).then(function(buf) {
            audioBuffer = buf;
            tmpCtx.close();
            drawIdle();
            toast("Audio chargé : " + buf.duration.toFixed(1) + " s", "ok");
          }).catch(function() { toast("Format non supporté", "err"); });
        };
        reader.readAsArrayBuffer(file);
      }
    });

    const barColorInput = el("input", {
      type: "color", value: barColor, class: "ff-input", style: "height:40px;padding:4px",
      onInput: function(e) { barColor = e.target.value; st.set("barColor", barColor); drawIdle(); }
    });
    const bgColorInput = el("input", {
      type: "color", value: bgColor, class: "ff-input", style: "height:40px;padding:4px",
      onInput: function(e) { bgColor = e.target.value; st.set("bgColor", bgColor); drawIdle(); }
    });
    const barCountInput = el("input", {
      type: "range", min: "16", max: "128", step: "8", value: barCount, class: "ff-input",
      onInput: function(e) { barCount = +e.target.value; st.set("barCount", barCount); drawIdle(); }
    });

    drawIdle();

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Fichier audio"), fileInput]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [el("label", "Couleur des barres"), barColorInput]),
            el("div", { class: "ff-field" }, [el("label", "Couleur de fond"), bgColorInput]),
            el("div", { class: "ff-field" }, [el("label", "Nombre de barres"), barCountInput])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-note" }, ["Statut : ", statusEl]),
            el("div", { class: "ff-note" }, "La vidéo est enregistrée en WebM (VP8). Compatibilité : Chrome, Firefox, Edge.")
          ])
        ]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: startRecording }, "🎬 Enregistrer WebM"),
          el("button", { class: "ff-btn ghost", onClick: stopRecording }, "⏹ Arrêter")
        ])
      ]),
      el("div", { class: "ff-panel" }, [el("h2", "Aperçu Canvas"), canvas])
    );
  }
});
