/* Crosshair Generator — dessin canvas, aperçu dynamique, export PNG. */
FF.register({
  id: "crosshair", title: "Crosshair Generator", icon: "🎯", tag: "Visée",
  desc: "Conçois ton viseur personnalisé : style, couleur, épaisseur, contour — aperçu instantané, export PNG.",
  mount(root, ctx) {
    const { el, store, toast, clear } = ctx;
    const st = store("crosshair");
    let cfg = st.get("cfg", {
      style: "cross", len: 10, thick: 2, gap: 4, outline: 1, outlineColor: "#000000",
      color: "#00ff00", dot: false, dotSize: 3, tShape: false, alpha: 1
    });

    function persist() { st.set("cfg", cfg); }

    const canvas = el("canvas", { width: 320, height: 320, style: { background: "#1a1a2e", borderRadius: "12px", border: "3px solid var(--pg-navy)", display: "block", maxWidth: "100%" } });

    function draw() {
      const c = canvas.getContext ? canvas.getContext("2d") : null;
      if (!c) return;
      const W = canvas.width, H = canvas.height;
      c.clearRect(0, 0, W, H);
      c.fillStyle = "#1a1a2e";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(255,255,255,0.03)";
      for (var i = 0; i < W; i += 32) { c.fillRect(i, 0, 1, H); }
      for (var j = 0; j < H; j += 32) { c.fillRect(0, j, W, 1); }
      var cx = W / 2, cy = H / 2;
      c.globalAlpha = cfg.alpha;
      function stroke(x1, y1, x2, y2) {
        if (cfg.outline > 0) {
          c.strokeStyle = cfg.outlineColor;
          c.lineWidth = cfg.thick + cfg.outline * 2;
          c.lineCap = "square";
          c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        }
        c.strokeStyle = cfg.color;
        c.lineWidth = cfg.thick;
        c.lineCap = "square";
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      }
      var g = cfg.gap, L = cfg.len;
      if (cfg.style === "cross") {
        stroke(cx - L - g, cy, cx - g, cy);
        stroke(cx + g, cy, cx + L + g, cy);
        if (!cfg.tShape) { stroke(cx, cy - L - g, cx, cy - g); }
        stroke(cx, cy + g, cx, cy + L + g);
      } else if (cfg.style === "dot") {
        // point seulement
      } else if (cfg.style === "circle") {
        if (cfg.outline > 0) {
          c.strokeStyle = cfg.outlineColor;
          c.lineWidth = cfg.thick + cfg.outline * 2;
          c.beginPath(); c.arc(cx, cy, L + g, 0, Math.PI * 2); c.stroke();
        }
        c.strokeStyle = cfg.color;
        c.lineWidth = cfg.thick;
        c.beginPath(); c.arc(cx, cy, L + g, 0, Math.PI * 2); c.stroke();
      } else if (cfg.style === "crosscircle") {
        stroke(cx - L - g, cy, cx - g, cy);
        stroke(cx + g, cy, cx + L + g, cy);
        if (!cfg.tShape) { stroke(cx, cy - L - g, cx, cy - g); }
        stroke(cx, cy + g, cx, cy + L + g);
        if (cfg.outline > 0) {
          c.strokeStyle = cfg.outlineColor;
          c.lineWidth = cfg.thick + cfg.outline * 2;
          c.beginPath(); c.arc(cx, cy, L + g, 0, Math.PI * 2); c.stroke();
        }
        c.strokeStyle = cfg.color;
        c.lineWidth = cfg.thick;
        c.beginPath(); c.arc(cx, cy, L + g, 0, Math.PI * 2); c.stroke();
      }
      if (cfg.dot || cfg.style === "dot") {
        var ds = cfg.dotSize;
        if (cfg.outline > 0) {
          c.fillStyle = cfg.outlineColor;
          c.beginPath(); c.arc(cx, cy, ds + cfg.outline, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = cfg.color;
        c.beginPath(); c.arc(cx, cy, ds, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    }

    var presets = [
      { name: "CS2 défaut", cfg: { style: "cross", len: 10, thick: 2, gap: 4, outline: 1, outlineColor: "#000000", color: "#00ff00", dot: false, dotSize: 3, tShape: false, alpha: 1 } },
      { name: "Valorant", cfg: { style: "cross", len: 8, thick: 2, gap: 5, outline: 1, outlineColor: "#000000", color: "#ffffff", dot: true, dotSize: 2, tShape: false, alpha: 1 } },
      { name: "Point rouge", cfg: { style: "dot", len: 0, thick: 0, gap: 0, outline: 1, outlineColor: "#000000", color: "#ff0000", dot: true, dotSize: 5, tShape: false, alpha: 1 } },
      { name: "Cercle", cfg: { style: "circle", len: 14, thick: 2, gap: 0, outline: 1, outlineColor: "#000000", color: "#00ffff", dot: false, dotSize: 3, tShape: false, alpha: 1 } },
      { name: "T-shape", cfg: { style: "cross", len: 10, thick: 2, gap: 4, outline: 1, outlineColor: "#000000", color: "#ffff00", dot: false, dotSize: 3, tShape: true, alpha: 1 } }
    ];

    var out = el("div");

    function rangeField(label, key, min, max, step) {
      return el("div", { class: "ff-field" }, [
        el("label", label + " (" + cfg[key] + ")"),
        el("input", {
          class: "ff-input", type: "range", min: String(min), max: String(max), step: String(step || 1), value: cfg[key],
          onInput: function(e) { cfg[key] = +e.target.value; persist(); render(); }
        })
      ]);
    }

    function checkField(label, key) {
      return el("div", { class: "ff-field", style: { display: "flex", alignItems: "center", gap: "10px" } }, [
        el("input", { type: "checkbox", id: "ch_" + key, checked: cfg[key], style: { width: "18px", height: "18px", cursor: "pointer" },
          onChange: function(e) { cfg[key] = e.target.checked; persist(); render(); } }),
        el("label", { for: "ch_" + key, style: { marginBottom: 0, cursor: "pointer" } }, label)
      ]);
    }

    function render() {
      clear(out);
      var styleOpts = [["cross", "Croix"], ["dot", "Point"], ["circle", "Cercle"], ["crosscircle", "Croix+Cercle"]];
      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Presets"),
          el("div", { class: "ff-btns" }, presets.map(function(p) {
            return el("button", { class: "ff-btn sm ghost", onClick: function() { cfg = Object.assign({}, p.cfg); persist(); render(); } }, p.name);
          }))
        ]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-panel" }, [
              el("h2", "Style"),
              el("div", { class: "ff-field" }, [
                el("label", "Type de viseur"),
                el("div", { class: "ff-seg" }, styleOpts.map(function(sv) {
                  return el("button", { class: cfg.style === sv[0] ? "on" : "", onClick: function() { cfg.style = sv[0]; persist(); render(); } }, sv[1]);
                }))
              ]),
              rangeField("Longueur", "len", 1, 30, 1),
              rangeField("Épaisseur", "thick", 1, 10, 1),
              rangeField("Écart central", "gap", 0, 20, 1),
              rangeField("Opacité", "alpha", 0.1, 1, 0.05),
              checkField("Forme en T (sans haut)", "tShape"),
              checkField("Point central", "dot"),
              cfg.dot ? rangeField("Taille du point", "dotSize", 1, 12, 1) : null
            ])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-panel" }, [
              el("h2", "Couleurs"),
              el("div", { class: "ff-field" }, [
                el("label", "Couleur du viseur"),
                el("input", { type: "color", value: cfg.color, style: { width: "80px", height: "44px", border: "2.5px solid var(--pg-navy)", borderRadius: "10px", cursor: "pointer" },
                  onInput: function(e) { cfg.color = e.target.value; persist(); render(); } })
              ]),
              rangeField("Épaisseur contour", "outline", 0, 5, 1),
              el("div", { class: "ff-field" }, [
                el("label", "Couleur du contour"),
                el("input", { type: "color", value: cfg.outlineColor, style: { width: "80px", height: "44px", border: "2.5px solid var(--pg-navy)", borderRadius: "10px", cursor: "pointer" },
                  onInput: function(e) { cfg.outlineColor = e.target.value; persist(); render(); } })
              ])
            ]),
            el("div", { class: "ff-panel" }, [
              el("h2", "Aperçu"),
              canvas,
              el("div", { class: "ff-btns", style: { marginTop: "12px" } }, [
                el("button", { class: "ff-btn primary", onClick: function() {
                  if (!canvas.toDataURL) { toast("Export non supporté ici", "err"); return; }
                  var url = canvas.toDataURL("image/png");
                  var a = document.createElement("a"); a.href = url; a.download = "crosshair.png";
                  document.body.appendChild(a); a.click(); a.remove();
                  toast("PNG exporté !", "ok");
                } }, "⬇️ Exporter PNG")
              ])
            ])
          ])
        ])
      );
      draw();
    }

    root.append(out);
    render();
  }
});
