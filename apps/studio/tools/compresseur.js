/* Compresseur d'Images — compression RÉELLE via Canvas, redimensionnement, JPEG/PNG/WebP */
FF.register({
  id: "compresseur", title: "Compresseur d'Images", icon: "🗜️", tag: "Image",
  desc: "Réencode une image en JPEG/PNG/WebP avec curseur de qualité et redimensionnement optionnel.",
  mount(root, ctx) {
    const { el, store, save, toast, clear } = ctx;
    const st = store("compresseur");
    let quality = st.get("quality", 80);
    let format = st.get("format", "image/jpeg");
    let maxW = st.get("maxW", 1920);
    let origFile = null;
    let origImg = null;

    const infoOrig = el("div", { class: "ff-stats" });
    const infoComp = el("div", { class: "ff-stats" });
    const preview = el("canvas", { style: "max-width:100%;border:3px solid var(--pg-navy);border-radius:14px;display:none" });
    const qualLabel = el("span", { text: quality + " %" });
    const maxWLabel = el("span", { text: maxW + " px" });

    function humanSize(bytes) {
      if (bytes < 1024) return bytes + " o";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
      return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
    }

    function stat(v, k) {
      return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]);
    }

    function compress() {
      if (!origImg) return;
      const ratio = Math.min(1, maxW / origImg.naturalWidth);
      const w = Math.round(origImg.naturalWidth * ratio);
      const h = Math.round(origImg.naturalHeight * ratio);
      preview.width = w; preview.height = h;
      const cctx = preview.getContext("2d");
      cctx.drawImage(origImg, 0, 0, w, h);
      preview.style.display = "block";
      preview.toBlob(function(blob) {
        if (!blob) return toast("Format non supporté", "err");
        const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
        clear(infoComp);
        infoComp.append(
          stat(w + " × " + h + " px", "Dimensions"),
          stat(humanSize(blob.size), "Taille compressée"),
          stat(origFile ? (100 - blob.size / origFile.size * 100).toFixed(1) + " %" : "—", "Réduction")
        );
        const dlBtn = root.querySelector("#dl-btn-comp");
        if (dlBtn) {
          dlBtn.onclick = () => save("image-compressée." + ext, blob, format);
        }
      }, format, quality / 100);
    }

    function loadFile(file) {
      if (!file || !file.type.startsWith("image/")) { toast("Fichier image requis", "err"); return; }
      origFile = file;
      clear(infoOrig);
      infoOrig.append(
        stat(humanSize(file.size), "Taille originale"),
        stat(file.name, "Fichier")
      );
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          origImg = img;
          clear(infoOrig);
          infoOrig.append(
            stat(img.naturalWidth + " × " + img.naturalHeight + " px", "Dimensions"),
            stat(humanSize(file.size), "Taille originale"),
            stat(file.name, "Fichier")
          );
          compress();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    const fileInput = el("input", {
      type: "file", accept: "image/*", class: "ff-input",
      onChange: function(e) { loadFile(e.target.files[0]); }
    });

    const qualitySlider = el("input", {
      type: "range", min: "1", max: "100", value: quality, class: "ff-input",
      onInput: function(e) {
        quality = +e.target.value;
        qualLabel.textContent = quality + " %";
        st.set("quality", quality);
        compress();
      }
    });

    const maxWSlider = el("input", {
      type: "range", min: "100", max: "4000", step: "100", value: maxW, class: "ff-input",
      onInput: function(e) {
        maxW = +e.target.value;
        maxWLabel.textContent = maxW + " px";
        st.set("maxW", maxW);
        compress();
      }
    });

    const fmtSeg = el("div", { class: "ff-seg" }, [
      ["image/jpeg", "JPEG"],
      ["image/png", "PNG"],
      ["image/webp", "WebP"]
    ].map(function(pair) {
      const btn = el("button", { class: format === pair[0] ? "on" : "", text: pair[1] });
      btn.onclick = function() {
        format = pair[0]; st.set("format", format);
        fmtSeg.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        btn.classList.add("on");
        compress();
      };
      return btn;
    }));

    const dlBtn = el("button", { id: "dl-btn-comp", class: "ff-btn primary" }, "⬇️ Télécharger");

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Image à compresser"), fileInput]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [
              el("label", ["Qualité : ", qualLabel]),
              qualitySlider
            ]),
            el("div", { class: "ff-field" }, [
              el("label", ["Largeur max : ", maxWLabel]),
              maxWSlider
            ]),
            el("div", { class: "ff-field" }, [el("label", "Format de sortie"), fmtSeg])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-note" }, "Original"),
            infoOrig,
            el("div", { class: "ff-note", style: "margin-top:12px" }, "Compressé"),
            infoComp
          ])
        ]),
        el("div", { class: "ff-btns" }, [dlBtn])
      ]),
      el("div", { class: "ff-panel" }, [
        el("h2", "Aperçu"),
        preview,
        el("div", { class: "ff-empty", id: "comp-placeholder" }, "Charge une image pour commencer")
      ])
    );
  }
});
