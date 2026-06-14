/* Générateur Glassmorphism — aperçu live, sortie CSS, copier */
FF.register({
  id: "glassmorphism", title: "Générateur Glassmorphism", icon: "🪟", tag: "CSS",
  desc: "Curseurs pour le flou, la transparence, la saturation, le rayon et la bordure. Copie le CSS.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;
    const st = store("glassmorphism");
    let s = st.get("state", {
      blur: 12, opacity: 0.2, saturation: 180, radius: 16, border: 1,
      color: "#ffffff", bg1: "#667eea", bg2: "#764ba2"
    });

    function persist() { st.set("state", s); }

    function genCSS() {
      const rgba = hexToRgba(s.color, s.opacity);
      return [
        "background: " + rgba + ";",
        "backdrop-filter: blur(" + s.blur + "px) saturate(" + s.saturation + "%);",
        "-webkit-backdrop-filter: blur(" + s.blur + "px) saturate(" + s.saturation + "%);",
        "border-radius: " + s.radius + "px;",
        "border: " + s.border + "px solid rgba(255, 255, 255, 0.18);"
      ].join("\n");
    }

    function hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }

    const previewWrap = el("div", {
      style: "position:relative;border-radius:24px;overflow:hidden;min-height:260px;display:flex;align-items:center;justify-content:center;padding:32px"
    });
    const bgDiv = el("div", {
      style: "position:absolute;inset:0;border-radius:24px"
    });
    const card = el("div", {
      style: "position:relative;padding:32px 40px;min-width:280px;text-align:center"
    }, [
      el("div", { style: "font-size:2rem;margin-bottom:12px" }, "🪟"),
      el("div", { style: "font-family:var(--pg-head);font-size:1.4rem;font-weight:700;color:#fff;margin-bottom:8px" }, "Glassmorphism"),
      el("div", { style: "color:rgba(255,255,255,0.8);font-size:.95rem" }, "Effet verre givré moderne")
    ]);
    previewWrap.append(bgDiv, card);

    const cssOut = el("textarea", { class: "ff-input", style: "height:120px;font-family:monospace;font-size:.85rem", readOnly: true });

    function update() {
      bgDiv.style.background = "linear-gradient(135deg, " + s.bg1 + ", " + s.bg2 + ")";
      const rgba = hexToRgba(s.color, s.opacity);
      card.style.background = rgba;
      card.style.backdropFilter = "blur(" + s.blur + "px) saturate(" + s.saturation + "%)";
      card.style.webkitBackdropFilter = "blur(" + s.blur + "px) saturate(" + s.saturation + "%)";
      card.style.borderRadius = s.radius + "px";
      card.style.border = s.border + "px solid rgba(255,255,255,0.18)";
      card.style.boxShadow = "0 8px 32px 0 rgba(31,38,135,0.37)";
      cssOut.value = genCSS();
      persist();
    }

    function slider(key, label, min, max, step) {
      const lbl = el("span", { text: s[key] });
      const inp = el("input", {
        type: "range", class: "ff-input", min: String(min), max: String(max), step: String(step || 1), value: String(s[key]),
        onInput: function(e) { s[key] = +e.target.value; lbl.textContent = s[key]; update(); }
      });
      return el("div", { class: "ff-field" }, [el("label", [label + " : ", lbl]), inp]);
    }

    function colorPicker(key, label) {
      const inp = el("input", {
        type: "color", value: s[key], class: "ff-input", style: "height:44px;padding:4px;cursor:pointer",
        onInput: function(e) { s[key] = e.target.value; update(); }
      });
      return el("div", { class: "ff-field" }, [el("label", label), inp]);
    }

    root.append(
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Paramètres"),
            slider("blur", "Flou (px)", 0, 40, 1),
            slider("opacity", "Transparence", 0.05, 0.95, 0.05),
            slider("saturation", "Saturation (%)", 100, 300, 10),
            slider("radius", "Rayon (px)", 0, 48, 2),
            slider("border", "Bordure (px)", 0, 4, 1),
            colorPicker("color", "Couleur du verre"),
            colorPicker("bg1", "Fond couleur 1"),
            colorPicker("bg2", "Fond couleur 2")
          ])
        ]),
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Aperçu"),
            previewWrap
          ]),
          el("div", { class: "ff-panel" }, [
            el("h2", "CSS généré"),
            cssOut,
            el("div", { class: "ff-btns" }, [
              el("button", { class: "ff-btn primary", onClick: function() { copy(cssOut.value); toast("CSS copié !", "ok"); } }, "📋 Copier le CSS")
            ])
          ])
        ])
      ])
    );
    update();
  }
});
