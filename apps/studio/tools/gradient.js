/* CSS Gradient & Pattern Maker — linéaire/radial/conique + motifs CSS */
FF.register({
  id: "gradient", title: "CSS Gradient & Pattern Maker", icon: "🌈", tag: "CSS",
  desc: "Dégradés linéaire/radial/conique avec plusieurs arrêts + angle, motifs CSS, aperçu live, copier.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;
    const st = store("gradient");

    let mode = st.get("mode", "linear");
    let angle = st.get("angle", 135);
    let stops = st.get("stops", [
      { color: "#0f4c81", pos: 0 },
      { color: "#f97316", pos: 50 },
      { color: "#ffd23f", pos: 100 }
    ]);
    let pattern = st.get("pattern", "none");

    const PATTERNS = {
      "none": "",
      "Rayures H": "repeating-linear-gradient(0deg,rgba(0,0,0,.08) 0,rgba(0,0,0,.08) 2px,transparent 2px,transparent 20px)",
      "Rayures V": "repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0,rgba(0,0,0,.08) 2px,transparent 2px,transparent 20px)",
      "Grille": "repeating-linear-gradient(0deg,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 1px,transparent 1px,transparent 32px)",
      "Points": "radial-gradient(circle,rgba(0,0,0,.12) 1px,transparent 1px)",
      "Chevrons": "repeating-linear-gradient(45deg,rgba(0,0,0,.06) 0,rgba(0,0,0,.06) 4px,transparent 4px,transparent 14px)"
    };

    function persist() { st.set("mode", mode); st.set("angle", angle); st.set("stops", stops); st.set("pattern", pattern); }

    function genGradientCSS() {
      const stopStr = stops.map(function(s) { return s.color + " " + s.pos + "%"; }).join(", ");
      if (mode === "linear") return "linear-gradient(" + angle + "deg, " + stopStr + ")";
      if (mode === "radial") return "radial-gradient(circle, " + stopStr + ")";
      if (mode === "conic") return "conic-gradient(from " + angle + "deg, " + stopStr + ")";
      return "linear-gradient(" + angle + "deg, " + stopStr + ")";
    }

    function genFullCSS() {
      const grad = genGradientCSS();
      const pat = PATTERNS[pattern] || "";
      if (pat) return "background: " + grad + ";\n/* Superposition du motif: */\nbackground-image: " + grad + ", " + pat + ";";
      return "background: " + grad + ";";
    }

    const preview = el("div", {
      style: "height:200px;border:3px solid var(--pg-navy);border-radius:14px;transition:background .2s"
    });
    const cssOut = el("textarea", {
      class: "ff-input", style: "height:100px;font-family:monospace;font-size:.82rem", readOnly: true
    });

    function update() {
      const grad = genGradientCSS();
      const pat = PATTERNS[pattern] || "";
      if (pat) {
        preview.style.background = grad;
        preview.style.backgroundImage = grad + ", " + pat;
      } else {
        preview.style.background = grad;
        preview.style.backgroundImage = "";
      }
      cssOut.value = genFullCSS();
      persist();
    }

    const stopsContainer = el("div", { style: "display:flex;flex-direction:column;gap:8px" });

    function renderStops() {
      while (stopsContainer.firstChild) stopsContainer.removeChild(stopsContainer.firstChild);
      stops.forEach(function(stop, i) {
        const colorInp = el("input", {
          type: "color", value: stop.color, class: "ff-input", style: "height:40px;padding:4px;width:60px;flex:0 0 auto",
          onInput: function(e) { stop.color = e.target.value; update(); }
        });
        const posInp = el("input", {
          type: "number", min: "0", max: "100", value: stop.pos, class: "ff-input", style: "width:72px;flex:0 0 auto",
          onInput: function(e) { stop.pos = +e.target.value; update(); }
        });
        const rm = el("button", {
          class: "ff-btn sm ghost",
          onClick: function() {
            if (stops.length <= 2) { toast("Minimum 2 arrêts", "err"); return; }
            stops.splice(i, 1); renderStops(); update();
          }
        }, "✕");
        stopsContainer.append(el("div", { style: "display:flex;align-items:center;gap:8px" }, [
          colorInp,
          el("span", { text: "Arrêt " + (i + 1) + " à " }),
          posInp,
          el("span", { text: "%" }),
          rm
        ]));
      });
    }

    const modeSeg = el("div", { class: "ff-seg" }, [
      ["linear", "Linéaire"], ["radial", "Radial"], ["conic", "Conique"]
    ].map(function(pair) {
      const btn = el("button", { class: mode === pair[0] ? "on" : "", text: pair[1] });
      btn.onclick = function() {
        mode = pair[0]; modeSeg.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        btn.classList.add("on"); update();
      };
      return btn;
    }));

    const angleLabel = el("span", { text: angle + "°" });
    const angleSlider = el("input", {
      type: "range", min: "0", max: "360", value: angle, class: "ff-input",
      onInput: function(e) { angle = +e.target.value; angleLabel.textContent = angle + "°"; update(); }
    });

    const patternSel = el("select", { class: "ff-select", onChange: function(e) { pattern = e.target.value; update(); } });
    Object.keys(PATTERNS).forEach(function(name) {
      const opt = el("option", { value: name, text: name });
      if (name === pattern) opt.selected = true;
      patternSel.append(opt);
    });

    renderStops();
    update();

    root.append(
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Type de dégradé"),
            el("div", { class: "ff-field" }, [el("label", "Mode"), modeSeg]),
            el("div", { class: "ff-field" }, [el("label", ["Angle : ", angleLabel]), angleSlider]),
            el("div", { class: "ff-field" }, [el("label", "Motif superposé"), patternSel]),
            el("h2", "Arrêts de couleur"),
            stopsContainer,
            el("div", { class: "ff-btns", style: "margin-top:10px" }, [
              el("button", { class: "ff-btn sm gold", onClick: function() {
                stops.push({ color: "#ffffff", pos: 100 }); renderStops(); update();
              }}, "＋ Arrêt")
            ])
          ])
        ]),
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [el("h2", "Aperçu"), preview]),
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
