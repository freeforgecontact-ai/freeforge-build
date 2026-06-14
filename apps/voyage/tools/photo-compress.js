/* Photo Compress for Social — Canvas compression + recadrage ratios sociaux. */
FF.register({
  id: "photo-compress", title: "Photo Compress", icon: "📸", tag: "Photo",
  desc: "Compressez et recadrez vos photos pour les réseaux sociaux. Canvas natif, 100% local.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("photo-compress");

    const RATIOS = [
      { id: "original", label: "Original", w: 0, h: 0 },
      { id: "1x1", label: "1:1 (Carré)", w: 1, h: 1 },
      { id: "4x5", label: "4:5 (Portrait IG)", w: 4, h: 5 },
      { id: "9x16", label: "9:16 (Stories)", w: 9, h: 16 },
      { id: "16x9", label: "16:9 (YouTube)", w: 16, h: 9 },
      { id: "3x2", label: "3:2 (Photo std)", w: 3, h: 2 },
      { id: "2x3", label: "2:3 (Pinterest)", w: 2, h: 3 }
    ];

    let qualite = st.get("qualite", 82);
    let ratioId = st.get("ratio", "original");
    let format = st.get("format", "jpeg");
    let srcImg = null;
    let srcNom = "";
    let srcTaille = 0;

    function persist() { st.set("qualite", qualite); st.set("ratio", ratioId); st.set("format", format); }

    function fmtSize(bytes) {
      if (bytes < 1024) return bytes + " o";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
      return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
    }

    const out = el("div");
    let previewCanvas = null;
    let resultBlob = null;

    function compress() {
      if (!srcImg) return;
      var ratio = RATIOS.find(function(r) { return r.id === ratioId; }) || RATIOS[0];
      var canvas = document.createElement("canvas");
      var ctx2 = canvas.getContext("2d");

      var sw = srcImg.naturalWidth || srcImg.width;
      var sh = srcImg.naturalHeight || srcImg.height;

      var cw, ch, sx, sy, sW, sH;

      if (ratio.id === "original" || ratio.w === 0) {
        cw = sw; ch = sh; sx = 0; sy = 0; sW = sw; sH = sh;
      } else {
        var targetRatio = ratio.w / ratio.h;
        var srcRatio = sw / sh;

        if (srcRatio > targetRatio) {
          // Couper sur les côtés
          sH = sh;
          sW = Math.round(sh * targetRatio);
          sx = Math.round((sw - sW) / 2);
          sy = 0;
        } else {
          // Couper en haut/bas
          sW = sw;
          sH = Math.round(sw / targetRatio);
          sx = 0;
          sy = Math.round((sh - sH) / 2);
        }

        // Taille de sortie max 2048px
        var maxDim = 2048;
        if (sW > sH) {
          cw = Math.min(sW, maxDim);
          ch = Math.round(cw / targetRatio);
        } else {
          ch = Math.min(sH, maxDim);
          cw = Math.round(ch * targetRatio);
        }
      }

      canvas.width = cw;
      canvas.height = ch;
      ctx2.drawImage(srcImg, sx, sy, sW, sH, 0, 0, cw, ch);

      var mime = format === "webp" ? "image/webp" : "image/jpeg";
      var q = Math.max(0.01, Math.min(1, qualite / 100));

      canvas.toBlob(function(blob) {
        if (!blob) { toast("Erreur de compression", "err"); return; }
        resultBlob = blob;
        var url = URL.createObjectURL(blob);

        // Aperçu
        var previewEl = root.querySelector("#pc-preview");
        if (previewEl) {
          ctx.clear(previewEl);
          var img = new Image();
          img.src = url;
          img.style.maxWidth = "100%";
          img.style.maxHeight = "300px";
          img.style.border = "3px solid var(--pg-navy)";
          img.style.borderRadius = "14px";
          previewEl.appendChild(img);
        }

        // Stats
        var statsEl = root.querySelector("#pc-stats");
        if (statsEl) {
          ctx.clear(statsEl);
          var reduction = srcTaille > 0 ? Math.round((1 - blob.size / srcTaille) * 100) : 0;
          statsEl.append(
            el("div", { class: "ff-stats" }, [
              el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmtSize(srcTaille)), el("div", { class: "k" }, "Taille originale")]),
              el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmtSize(blob.size)), el("div", { class: "k" }, "Taille compressée")]),
              el("div", { class: "ff-stat" }, [el("div", { class: "v" }, (reduction >= 0 ? "-" : "+") + Math.abs(reduction) + "%"), el("div", { class: "k" }, "Réduction")]),
              el("div", { class: "ff-stat" }, [el("div", { class: "v" }, cw + "×" + ch), el("div", { class: "k" }, "Dimensions px")])
            ])
          );
        }

        toast("Compression effectuée — " + fmtSize(blob.size), "ok");
      }, mime, q);
    }

    function render() {
      ctx.clear(out);

      out.append(
        // Zone de chargement
        el("div", { class: "ff-panel" }, [
          el("h2", "Charger une photo"),
          el("div", { style: { border: "3px dashed var(--pg-navy)", borderRadius: "14px", padding: "30px", textAlign: "center", background: "var(--pg-pale)", cursor: "pointer" },
            onClick: function() {
              var inp = root.querySelector("#pc-file-input");
              if (inp) inp.click();
            }
          }, [
            el("div", { style: { fontSize: "3rem" } }, "📁"),
            el("div", { style: { fontWeight: 700, color: "var(--pg-navy)", marginTop: "8px" } }, "Cliquez pour choisir une photo"),
            el("div", { style: { color: "var(--pg-mut)", fontSize: ".85rem" } }, "JPEG, PNG, WebP, GIF • Traitement 100% local")
          ]),
          el("input", { type: "file", accept: "image/*", id: "pc-file-input", style: { display: "none" },
            onChange: function(e) {
              var file = e.target.files && e.target.files[0];
              if (!file) return;
              srcNom = file.name.replace(/\.[^.]+$/, "");
              srcTaille = file.size;
              var reader = new FileReader();
              reader.onload = function(ev) {
                var img = new Image();
                img.onload = function() {
                  srcImg = img;
                  compress();
                };
                img.src = ev.target.result;
              };
              reader.readAsDataURL(file);
            }
          })
        ]),

        // Contrôles
        el("div", { class: "ff-panel" }, [
          el("h2", "Paramètres"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Ratio / recadrage"),
                el("div", { class: "ff-seg" },
                  RATIOS.map(function(r) {
                    return el("button", { class: ratioId === r.id ? "on" : "", onClick: function() { ratioId = r.id; persist(); compress(); } }, r.label);
                  })
                )
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Format de sortie"),
                el("div", { class: "ff-seg" }, [
                  el("button", { class: format === "jpeg" ? "on" : "", onClick: function() { format = "jpeg"; persist(); compress(); } }, "JPEG"),
                  el("button", { class: format === "webp" ? "on" : "", onClick: function() { format = "webp"; persist(); compress(); } }, "WebP")
                ])
              ])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Qualité : " + qualite + "%"),
                el("input", { type: "range", min: "10", max: "100", step: "1", value: qualite, style: { width: "100%", accentColor: "var(--pg-blue)" },
                  onInput: function(e) { qualite = +e.target.value; persist(); root.querySelector("#pc-q-label") && (root.querySelector("#pc-q-label").textContent = qualite + "%"); },
                  onChange: function(e) { qualite = +e.target.value; persist(); compress(); }
                }),
                el("div", { style: { display: "flex", justifyContent: "space-between", fontSize: ".8rem", color: "var(--pg-mut)" } }, [
                  el("span", "Petit fichier"),
                  el("span", "Haute qualité")
                ])
              ])
            ])
          ])
        ]),

        // Aperçu et stats
        el("div", { class: "ff-panel" }, [
          el("h2", "Aperçu et résultat"),
          el("div", { id: "pc-stats" }),
          el("div", { id: "pc-preview", style: { textAlign: "center", padding: "10px 0" } },
            srcImg ? null : el("div", { class: "ff-empty" }, "Chargez une photo pour voir l'aperçu.")
          ),
          el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [
            el("button", { class: "ff-btn primary", onClick: function() {
              if (!resultBlob) { toast("Chargez une photo d'abord", "err"); return; }
              var ext = format === "webp" ? ".webp" : ".jpg";
              save((srcNom || "photo") + "-compressed" + ext, resultBlob, resultBlob.type);
            } }, "⬇️ Télécharger"),
            el("button", { class: "ff-btn ghost", onClick: function() {
              if (!srcImg) { toast("Chargez une photo d'abord", "err"); return; }
              compress();
            } }, "🔄 Recompresser")
          ])
        ])
      );
    }

    root.append(out);
    render();
  }
});
