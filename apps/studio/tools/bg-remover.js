/* Background Remover (Chroma) — chroma-key pixel par pixel RÉEL, damier, export PNG */
FF.register({
  id: "bg-remover", title: "Background Remover (Chroma)", icon: "✂️", tag: "Image",
  desc: "Charge une image, clique pour choisir la couleur cible (pipette), applique le chroma-key, exporte PNG.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("bg-remover");

    let tolerance = st.get("tol", 40);
    let targetColor = st.get("color", [255, 255, 255]);
    let origImageData = null;

    const canvas = el("canvas", {
      style: "max-width:100%;border:3px solid var(--pg-navy);border-radius:14px;display:block;cursor:crosshair"
    });
    const outputCanvas = el("canvas", {
      style: "max-width:100%;border:3px solid var(--pg-navy);border-radius:14px;display:block"
    });

    // Damier de fond pour le canvas de sortie
    const checkerStyle = "background-image:repeating-linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),repeating-linear-gradient(45deg,#ccc 25%,#fff 25%,#fff 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,8px 8px;";

    const colorPreview = el("div", {
      style: "width:40px;height:40px;border:3px solid var(--pg-navy);border-radius:8px;display:inline-block;background:rgb(" + targetColor.join(",") + ")"
    });
    const tolLabel = el("span", { text: tolerance });

    function colorDist(r1, g1, b1, r2, g2, b2) {
      return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    }

    function applyChroma() {
      if (!origImageData) { toast("Charge une image d'abord", "err"); return; }
      const src = new ImageData(new Uint8ClampedArray(origImageData.data), origImageData.width, origImageData.height);
      const [tr, tg, tb] = targetColor;
      const tol = tolerance * 2.2; // scale de 0-100 à distance euclidienne
      for (let i = 0; i < src.data.length; i += 4) {
        const r = src.data[i], g = src.data[i+1], b = src.data[i+2];
        const dist = colorDist(r, g, b, tr, tg, tb);
        if (dist < tol) {
          // Doux: plus proche = plus transparent
          const alpha = Math.min(255, Math.round((dist / tol) * 255));
          src.data[i + 3] = alpha;
        }
      }
      outputCanvas.width = src.width;
      outputCanvas.height = src.height;
      const oc = outputCanvas.getContext("2d");
      oc.putImageData(src, 0, 0);
      toast("Chroma-key appliqué !", "ok");
    }

    function loadFile(file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const c = canvas.getContext("2d");
          c.drawImage(img, 0, 0);
          origImageData = c.getImageData(0, 0, canvas.width, canvas.height);
          outputCanvas.width = canvas.width;
          outputCanvas.height = canvas.height;
          const oc = outputCanvas.getContext("2d");
          oc.putImageData(origImageData, 0, 0);
          toast("Image chargée — clique pour choisir la couleur à effacer", "ok");
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    canvas.addEventListener("click", function(e) {
      if (!origImageData) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.round((e.clientX - rect.left) * scaleX);
      const y = Math.round((e.clientY - rect.top) * scaleY);
      const c = canvas.getContext("2d");
      const px = c.getImageData(x, y, 1, 1).data;
      targetColor = [px[0], px[1], px[2]];
      st.set("color", targetColor);
      colorPreview.style.background = "rgb(" + targetColor.join(",") + ")";
      toast("Couleur cible : rgb(" + targetColor.join(",") + ")", "ok");
    });

    const tolSlider = el("input", {
      type: "range", min: "1", max: "100", value: tolerance, class: "ff-input",
      onInput: function(e) { tolerance = +e.target.value; tolLabel.textContent = tolerance; st.set("tol", tolerance); }
    });

    const fileInput = el("input", {
      type: "file", accept: "image/*", class: "ff-input",
      onChange: function(e) { const f = e.target.files[0]; if (f) loadFile(f); }
    });

    const wrapOut = el("div", { style: checkerStyle + "border-radius:14px;padding:4px" }, outputCanvas);

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Image source"), fileInput]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [
              el("label", ["Tolérance : ", tolLabel]),
              tolSlider
            ]),
            el("div", { class: "ff-field" }, [
              el("label", "Couleur cible (clique sur l'image)"),
              el("div", { style: "display:flex;align-items:center;gap:12px" }, [
                colorPreview,
                el("span", { class: "ff-chip", style: "font-family:monospace" }, "rgb(" + targetColor.join(",") + ")")
              ])
            ])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-note" }, "1. Charge l'image."),
            el("div", { class: "ff-note" }, "2. Clique sur la couleur à effacer dans l'aperçu."),
            el("div", { class: "ff-note" }, "3. Ajuste la tolérance."),
            el("div", { class: "ff-note" }, "4. Applique puis exporte le PNG transparent.")
          ])
        ]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: applyChroma }, "🎨 Appliquer Chroma-Key"),
          el("button", { class: "ff-btn accent", onClick: function() {
            if (!outputCanvas.width) { toast("Applique d'abord le chroma-key", "err"); return; }
            outputCanvas.toBlob(function(blob) {
              save("image-sans-fond.png", blob, "image/png");
            }, "image/png");
          }}, "⬇️ Exporter PNG transparent")
        ])
      ]),
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [el("h2", "Image source (cliquer = pipette)"), canvas])
        ]),
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [el("h2", "Résultat (fond damier = transparent)"), wrapOut])
        ])
      ])
    );
  }
});
