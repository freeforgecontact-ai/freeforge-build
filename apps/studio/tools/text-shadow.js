/* Text Shadow Engine — empile plusieurs ombres, presets, aperçu, sortie CSS */
FF.register({
  id: "text-shadow", title: "Text Shadow Engine", icon: "🌑", tag: "CSS",
  desc: "Empile plusieurs ombres texte (x/y/flou/couleur/opacité), presets 3D/néon/long-shadow, copier CSS.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;
    const st = store("text-shadow");

    let shadows = st.get("shadows", [{ x: 4, y: 4, blur: 0, color: "#f97316", opacity: 1 }]);
    let previewText = st.get("text", "FreeForge");
    let textColor = st.get("textColor", "#0a3559");
    let fontSize = st.get("fontSize", 64);
    let bgColor = st.get("bgColor", "#ffffff");

    const PRESETS = {
      "3D": [
        { x: 1, y: 1, blur: 0, color: "#555555", opacity: 1 },
        { x: 2, y: 2, blur: 0, color: "#555555", opacity: 1 },
        { x: 3, y: 3, blur: 0, color: "#555555", opacity: 1 },
        { x: 4, y: 4, blur: 0, color: "#555555", opacity: 1 },
        { x: 5, y: 5, blur: 0, color: "#555555", opacity: 1 }
      ],
      "Long Shadow": (function() {
        const arr = [];
        for (let i = 1; i <= 20; i++) arr.push({ x: i, y: i, blur: 0, color: "#f97316", opacity: 1 - i * 0.04 });
        return arr;
      })(),
      "Néon": [
        { x: 0, y: 0, blur: 4, color: "#ffd23f", opacity: 1 },
        { x: 0, y: 0, blur: 10, color: "#ffd23f", opacity: 0.9 },
        { x: 0, y: 0, blur: 20, color: "#f97316", opacity: 0.8 },
        { x: 0, y: 0, blur: 40, color: "#f97316", opacity: 0.6 }
      ],
      "Retro": [
        { x: 3, y: 3, blur: 0, color: "#0f4c81", opacity: 1 },
        { x: 6, y: 6, blur: 0, color: "#0f4c81", opacity: 0.5 }
      ],
      "Glow blanc": [
        { x: 0, y: 0, blur: 6, color: "#ffffff", opacity: 1 },
        { x: 0, y: 0, blur: 14, color: "#bfe3f9", opacity: 0.8 }
      ]
    };

    function persist() {
      st.set("shadows", shadows); st.set("text", previewText);
      st.set("textColor", textColor); st.set("fontSize", fontSize); st.set("bgColor", bgColor);
    }

    function hexWithOpacity(hex, opacity) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
    }

    function genCSS() {
      if (!shadows.length) return "text-shadow: none;";
      const parts = shadows.map(function(s) {
        return s.x + "px " + s.y + "px " + s.blur + "px " + hexWithOpacity(s.color, s.opacity);
      });
      return "text-shadow: " + parts.join(",\n             ") + ";";
    }

    const preview = el("div", {
      style: "min-height:120px;display:flex;align-items:center;justify-content:center;border:3px solid var(--pg-navy);border-radius:14px;padding:20px;transition:background .2s"
    });
    const previewSpan = el("span", {
      style: "font-family:Georgia,serif;font-weight:700;transition:text-shadow .15s"
    });
    preview.append(previewSpan);

    const cssOut = el("textarea", { class: "ff-input", style: "height:100px;font-family:monospace;font-size:.82rem", readOnly: true });

    const shadowsContainer = el("div", { style: "display:flex;flex-direction:column;gap:10px" });

    function updatePreview() {
      previewSpan.textContent = previewText || "Texte";
      previewSpan.style.color = textColor;
      previewSpan.style.fontSize = fontSize + "px";
      previewSpan.style.textShadow = shadows.map(function(s) {
        return s.x + "px " + s.y + "px " + s.blur + "px " + hexWithOpacity(s.color, s.opacity);
      }).join(",");
      preview.style.background = bgColor;
      cssOut.value = genCSS();
    }

    function renderShadows() {
      while (shadowsContainer.firstChild) shadowsContainer.removeChild(shadowsContainer.firstChild);
      shadows.forEach(function(s, i) {
        function inp(key, label, min, max, step) {
          const lbl = el("span", { text: s[key], style: "font-size:.8rem;min-width:36px;text-align:right" });
          const input = el("input", {
            type: "range", min: String(min), max: String(max), step: String(step || 1), value: String(s[key]),
            style: "width:80px",
            onInput: function(e) { s[key] = +e.target.value; lbl.textContent = s[key]; persist(); updatePreview(); }
          });
          return el("div", { style: "display:flex;align-items:center;gap:4px" }, [
            el("span", { style: "font-size:.75rem;color:var(--pg-mut);min-width:28px" }, label),
            input, lbl
          ]);
        }
        const colorInp = el("input", {
          type: "color", value: s.color, style: "width:36px;height:36px;border:2px solid var(--pg-navy);border-radius:6px;padding:2px;cursor:pointer",
          onInput: function(e) { s.color = e.target.value; persist(); updatePreview(); }
        });
        const rmBtn = el("button", {
          class: "ff-btn sm ghost",
          onClick: function() { shadows.splice(i, 1); persist(); renderShadows(); updatePreview(); }
        }, "✕");
        shadowsContainer.append(
          el("div", { style: "background:var(--pg-pale);border:2px solid var(--pg-navy);border-radius:10px;padding:10px;display:flex;flex-wrap:wrap;align-items:center;gap:8px" }, [
            el("span", { style: "font-weight:900;color:var(--pg-navy);font-size:.8rem;min-width:60px" }, "Ombre " + (i + 1)),
            colorInp,
            inp("x", "X", -40, 40),
            inp("y", "Y", -40, 40),
            inp("blur", "Flou", 0, 60),
            inp("opacity", "Opac.", 0, 1, 0.05),
            rmBtn
          ])
        );
      });
    }

    const presetBtns = el("div", { class: "ff-btns" }, Object.keys(PRESETS).map(function(name) {
      return el("button", { class: "ff-btn sm gold", onClick: function() {
        shadows = PRESETS[name].map(function(s) { return Object.assign({}, s); });
        persist(); renderShadows(); updatePreview();
      }}, name);
    }));

    renderShadows();
    updatePreview();

    const textInput = el("input", { class: "ff-input", type: "text", value: previewText,
      onInput: function(e) { previewText = e.target.value; persist(); updatePreview(); }
    });
    const fsInput = el("input", { type: "range", min: "20", max: "120", value: fontSize, class: "ff-input",
      onInput: function(e) { fontSize = +e.target.value; fsLabel.textContent = fontSize + "px"; persist(); updatePreview(); }
    });
    const fsLabel = el("span", { text: fontSize + "px" });
    const tcInput = el("input", { type: "color", value: textColor, class: "ff-input", style: "height:40px;padding:4px",
      onInput: function(e) { textColor = e.target.value; persist(); updatePreview(); }
    });
    const bgInput = el("input", { type: "color", value: bgColor, class: "ff-input", style: "height:40px;padding:4px",
      onInput: function(e) { bgColor = e.target.value; persist(); updatePreview(); }
    });

    root.append(
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Presets"),
            presetBtns
          ]),
          el("div", { class: "ff-panel" }, [
            el("h2", "Ombres empilées"),
            shadowsContainer,
            el("div", { class: "ff-btns", style: "margin-top:8px" }, [
              el("button", { class: "ff-btn sm primary", onClick: function() {
                shadows.push({ x: 2, y: 2, blur: 4, color: "#000000", opacity: 0.5 });
                persist(); renderShadows(); updatePreview();
              }}, "＋ Ombre")
            ])
          ])
        ]),
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Aperçu"),
            preview,
            el("div", { class: "ff-row", style: "margin-top:12px" }, [
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [el("label", "Texte"), textInput]),
                el("div", { class: "ff-field" }, [el("label", ["Taille : ", fsLabel]), fsInput])
              ]),
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [el("label", "Couleur texte"), tcInput]),
                el("div", { class: "ff-field" }, [el("label", "Fond"), bgInput])
              ])
            ])
          ]),
          el("div", { class: "ff-panel" }, [
            el("h2", "CSS généré"),
            cssOut,
            el("div", { class: "ff-btns" }, [
              el("button", { class: "ff-btn primary", onClick: function() { copy(cssOut.value); toast("CSS copié !", "ok"); }}, "📋 Copier le CSS")
            ])
          ])
        ])
      ])
    );
  }
});
