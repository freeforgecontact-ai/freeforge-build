/* Thumbnail Safe Area Visualizer — superpose zones de sécurité YouTube/vidéo */
FF.register({
  id: "thumbnail", title: "Thumbnail Safe Area Visualizer", icon: "🖼️", tag: "Image",
  desc: "Charge une image ou fond couleur, superpose cadre 1280×720 + zones de sécurité, exporte PNG.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("thumbnail");

    let bgColor = st.get("bg", "#0a3559");
    let showTitle = st.get("showTitle", true);
    let showDuration = st.get("showDuration", true);
    let showLogo = st.get("showLogo", true);
    let userImg = null;

    const W = 1280, H = 720;
    const canvas = el("canvas", { style: "max-width:100%;border:3px solid var(--pg-navy);border-radius:14px;display:block" });
    canvas.width = W; canvas.height = H;

    function persist() { st.set("bg", bgColor); st.set("showTitle", showTitle); st.set("showDuration", showDuration); st.set("showLogo", showLogo); }

    function draw() {
      const c = canvas.getContext("2d");
      if (!c) return;
      c.clearRect(0, 0, W, H);

      if (userImg) {
        // Couvrir le canvas en maintenant les proportions
        const scale = Math.max(W / userImg.naturalWidth, H / userImg.naturalHeight);
        const sw = userImg.naturalWidth * scale;
        const sh = userImg.naturalHeight * scale;
        c.drawImage(userImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
      } else {
        c.fillStyle = bgColor;
        c.fillRect(0, 0, W, H);
        // Texte de fond
        c.fillStyle = "rgba(255,255,255,0.07)";
        c.font = "bold 90px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("1280 × 720", W / 2, H / 2);
      }

      // Zone de sécurité principale (5% de marge)
      const mg = 36; // 2.8%
      c.strokeStyle = "rgba(255,255,255,0.35)";
      c.lineWidth = 2;
      c.setLineDash([12, 6]);
      c.strokeRect(mg, mg, W - mg * 2, H - mg * 2);
      c.setLineDash([]);

      // Zone titre (bande du bas, hauteur ≈ 18%)
      if (showTitle) {
        const th = Math.round(H * 0.18);
        c.fillStyle = "rgba(0,0,0,0.45)";
        c.fillRect(mg, H - mg - th, W - mg * 2, th);
        c.strokeStyle = "rgba(255,210,63,0.8)";
        c.lineWidth = 2;
        c.strokeRect(mg, H - mg - th, W - mg * 2, th);
        c.fillStyle = "#ffd23f";
        c.font = "bold 22px Arial";
        c.textAlign = "left";
        c.textBaseline = "middle";
        c.fillText("ZONE TITRE / TEXTE", mg + 16, H - mg - th / 2);
      }

      // Zone durée (coin bas-droite)
      if (showDuration) {
        const dw = 110, dh = 38;
        const dx = W - mg - dw - 8, dy = H - mg - dh - 8;
        c.fillStyle = "rgba(0,0,0,0.75)";
        c.fillRect(dx, dy, dw, dh);
        c.strokeStyle = "rgba(247,97,22,0.9)";
        c.lineWidth = 2;
        c.strokeRect(dx, dy, dw, dh);
        c.fillStyle = "#ffffff";
        c.font = "bold 18px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("0:00 DURÉE", dx + dw / 2, dy + dh / 2);
      }

      // Zone logo (coin haut-gauche)
      if (showLogo) {
        const lw = 80, lh = 80;
        const lx = mg + 12, ly = mg + 12;
        c.fillStyle = "rgba(15,76,129,0.55)";
        c.strokeStyle = "rgba(127,195,238,0.9)";
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(lx, ly, lw, lh, 12);
        c.fill();
        c.stroke();
        c.fillStyle = "#bfe3f9";
        c.font = "bold 13px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("LOGO", lx + lw / 2, ly + lh / 2);
      }

      // Cadre extérieur
      c.strokeStyle = "rgba(255,255,255,0.6)";
      c.lineWidth = 3;
      c.setLineDash([]);
      c.strokeRect(1.5, 1.5, W - 3, H - 3);

      // Dimensions
      c.fillStyle = "rgba(255,255,255,0.65)";
      c.font = "bold 14px Arial";
      c.textAlign = "right";
      c.textBaseline = "top";
      c.fillText("1280 × 720 px", W - mg - 4, mg + 4);
    }

    const fileInput = el("input", {
      type: "file", accept: "image/*", class: "ff-input",
      onChange: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
          const img = new Image();
          img.onload = function() { userImg = img; draw(); };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    const bgColorInput = el("input", {
      type: "color", value: bgColor, class: "ff-input", style: "height:40px;padding:4px",
      onInput: function(e) { bgColor = e.target.value; st.set("bg", bgColor); draw(); }
    });

    function checkbox(key, label, ref) {
      const inp = el("input", {
        type: "checkbox", checked: ref[key],
        onChange: function(e) { ref[key] = e.target.checked; persist(); draw(); }
      });
      return el("label", { style: "display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;color:var(--pg-navy)" }, [inp, label]);
    }

    draw();

    const zones = { showTitle: showTitle, showDuration: showDuration, showLogo: showLogo };

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [el("label", "Image de fond (optionnel)"), fileInput]),
            el("div", { class: "ff-field" }, [el("label", "Couleur de fond (sans image)"), bgColorInput])
          ]),
          el("div", { class: "ff-col" }, [
            el("h2", "Zones de sécurité"),
            el("div", { style: "display:flex;flex-direction:column;gap:10px" }, [
              (function() {
                const inp = el("input", { type: "checkbox", checked: showTitle });
                inp.onchange = function(e) { showTitle = e.target.checked; persist(); draw(); };
                return el("label", { style: "display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;color:var(--pg-navy)" }, [inp, "Zone titre (bande bas)"]);
              })(),
              (function() {
                const inp = el("input", { type: "checkbox", checked: showDuration });
                inp.onchange = function(e) { showDuration = e.target.checked; persist(); draw(); };
                return el("label", { style: "display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;color:var(--pg-navy)" }, [inp, "Coin durée (bas-droite)"]);
              })(),
              (function() {
                const inp = el("input", { type: "checkbox", checked: showLogo });
                inp.onchange = function(e) { showLogo = e.target.checked; persist(); draw(); };
                return el("label", { style: "display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;color:var(--pg-navy)" }, [inp, "Zone logo (haut-gauche)"]);
              })()
            ])
          ])
        ]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: function() {
            canvas.toBlob(function(blob) {
              save("thumbnail-safe-area.png", blob, "image/png");
              toast("PNG exporté !", "ok");
            }, "image/png");
          }}, "⬇️ Exporter PNG"),
          el("button", { class: "ff-btn ghost", onClick: function() { userImg = null; draw(); toast("Image retirée", "ok"); }}, "🗑 Enlever l'image")
        ])
      ]),
      el("div", { class: "ff-panel" }, [el("h2", "Aperçu 1280 × 720"), canvas])
    );
  }
});
