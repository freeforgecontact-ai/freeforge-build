/* RGB Light Sync Designer — visualiseur LED animé, effets, presets, export JSON. (Visualiseur uniquement — pas de pilotage matériel.) */
FF.register({
  id: "rgb", title: "RGB Light Sync Designer", icon: "🌈", tag: "RGB",
  desc: "Conçois ton motif RGB : effets, couleurs, vitesse. Aperçu LED animé. Export JSON. (Visualiseur — pas de pilotage matériel.)",
  mount(root, ctx) {
    const { el, store, save, toast, copy, clear } = ctx;
    const st = store("rgb");

    let cfg = st.get("cfg", {
      effect: "rainbow", color1: "#ff0000", color2: "#0000ff", speed: 3,
      ledCount: 16, brightness: 100, name: "Mon profil"
    });
    let presets = st.get("presets", [
      { name: "Arc-en-ciel", cfg: { effect: "rainbow", color1: "#ff0000", color2: "#00ff00", speed: 3, ledCount: 16, brightness: 100, name: "Arc-en-ciel" } },
      { name: "Respiration bleue", cfg: { effect: "breathe", color1: "#0080ff", color2: "#0000ff", speed: 2, ledCount: 16, brightness: 100, name: "Respiration bleue" } },
      { name: "Rouge statique", cfg: { effect: "static", color1: "#ff0000", color2: "#ff0000", speed: 1, ledCount: 16, brightness: 100, name: "Rouge statique" } }
    ]);

    let animFrame = null;
    let tick = 0;

    function persist() { st.set("cfg", cfg); st.set("presets", presets); }

    function hexToRgb(hex) {
      const m = hex.replace("#", "").match(/.{2}/g);
      if (!m) return [0, 0, 0];
      return m.map(function(h) { return parseInt(h, 16); });
    }

    function rgbToHex(r, g, b) {
      return "#" + [r, g, b].map(function(v) {
        return Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
      }).join("");
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function hslToRgb(h, s, l) {
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; }
      else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; }
      else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; }
      else { r = c; b = x; }
      return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    }

    function getLedColor(i, n, t, effect, c1, c2, brightness) {
      const b = brightness / 100;
      let r, g, bl;
      const rgb1 = hexToRgb(c1);
      const r1 = rgb1[0], g1 = rgb1[1], b1 = rgb1[2];
      const rgb2 = hexToRgb(c2);
      const r2 = rgb2[0], g2 = rgb2[1], b2 = rgb2[2];
      if (effect === "static") {
        r = r1; g = g1; bl = b1;
      } else if (effect === "breathe") {
        const wave = (Math.sin(t * 0.05 - i * 0.1) + 1) / 2;
        r = lerp(r1 * 0.1, r1, wave); g = lerp(g1 * 0.1, g1, wave); bl = lerp(b1 * 0.1, b1, wave);
      } else if (effect === "rainbow") {
        const hue = ((i / n + t * 0.01) % 1) * 360;
        const cv = hslToRgb(hue, 1, 0.5);
        r = cv[0]; g = cv[1]; bl = cv[2];
      } else if (effect === "wave") {
        const phase = (i / n + t * 0.015) % 1;
        const wv = Math.abs(Math.sin(phase * Math.PI));
        r = lerp(r1, r2, wv); g = lerp(g1, g2, wv); bl = lerp(b1, b2, wv);
      } else if (effect === "chase") {
        const pos = Math.floor(t * 0.2) % n;
        const dist = Math.min(Math.abs(i - pos), n - Math.abs(i - pos));
        const fade = Math.max(0, 1 - dist / 3);
        r = r1 * fade; g = g1 * fade; bl = b1 * fade;
      } else {
        r = r1; g = g1; bl = b1;
      }
      return rgbToHex(r * b, g * b, bl * b);
    }

    const canvas = el("canvas", { width: 640, height: 80, style: { width: "100%", maxWidth: "640px", borderRadius: "12px", border: "3px solid var(--pg-navy)", display: "block" } });

    function drawLeds() {
      const c = canvas.getContext ? canvas.getContext("2d") : null;
      if (!c) return;
      const W = canvas.width, H = canvas.height;
      c.fillStyle = "#111";
      c.fillRect(0, 0, W, H);
      const n = cfg.ledCount;
      const pad = 16;
      const ledW = (W - pad * 2) / n;
      const r = Math.min(ledW / 2 - 2, H / 2 - 8);
      for (let i = 0; i < n; i++) {
        const x = pad + i * ledW + ledW / 2;
        const y = H / 2;
        const color = getLedColor(i, n, tick, cfg.effect, cfg.color1, cfg.color2, cfg.brightness);
        const grad = c.createRadialGradient(x, y, 0, x, y, r * 1.5);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, color + "88");
        grad.addColorStop(1, "transparent");
        c.beginPath(); c.arc(x, y, r * 1.5, 0, Math.PI * 2); c.fillStyle = grad; c.fill();
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = color; c.fill();
      }
      tick += cfg.speed;
    }

    function startAnim() {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (!(canvas.getContext && canvas.getContext("2d"))) return;
      if (cfg.effect === "static") { drawLeds(); return; }
      function loop() { drawLeds(); animFrame = requestAnimationFrame(loop); }
      loop();
    }

    const EFFECTS = [
      ["static", "Statique"], ["breathe", "Respiration"], ["rainbow", "Arc-en-ciel"],
      ["wave", "Vague"], ["chase", "Poursuite"]
    ];

    const out = el("div");

    function render() {
      clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Presets"),
          el("div", { class: "ff-btns" }, presets.map(function(p, i) {
            return el("div", { style: { display: "flex", gap: "4px" } }, [
              el("button", { class: "ff-btn sm ghost", onClick: function() { cfg = Object.assign({}, p.cfg); persist(); render(); } }, p.name),
              el("button", { class: "ff-btn sm ghost", title: "Supprimer", onClick: function() { presets.splice(i, 1); persist(); render(); } }, "×")
            ]);
          }))
        ]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-panel" }, [
              el("h2", "Configuration"),
              el("div", { class: "ff-field" }, [
                el("label", "Nom du profil"),
                el("input", { class: "ff-input", value: cfg.name, onInput: function(e) { cfg.name = e.target.value; } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Effet"),
                el("select", { class: "ff-select", onChange: function(e) { cfg.effect = e.target.value; persist(); render(); } },
                  EFFECTS.map(function(ef) {
                    return el("option", { value: ef[0], selected: cfg.effect === ef[0] }, ef[1]);
                  })
                )
              ]),
              el("div", { class: "ff-row" }, [
                el("div", { class: "ff-col" }, [
                  el("div", { class: "ff-field" }, [
                    el("label", "Couleur principale"),
                    el("input", { type: "color", value: cfg.color1, style: { width: "80px", height: "44px", border: "2.5px solid var(--pg-navy)", borderRadius: "10px", cursor: "pointer" },
                      onInput: function(e) { cfg.color1 = e.target.value; persist(); } })
                  ])
                ]),
                cfg.effect !== "static" ? el("div", { class: "ff-col" }, [
                  el("div", { class: "ff-field" }, [
                    el("label", "Couleur secondaire"),
                    el("input", { type: "color", value: cfg.color2, style: { width: "80px", height: "44px", border: "2.5px solid var(--pg-navy)", borderRadius: "10px", cursor: "pointer" },
                      onInput: function(e) { cfg.color2 = e.target.value; persist(); } })
                  ])
                ]) : null
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Nombre de LEDs (" + cfg.ledCount + ")"),
                el("input", { class: "ff-input", type: "range", min: "4", max: "60", value: cfg.ledCount,
                  onInput: function(e) { cfg.ledCount = +e.target.value; persist(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Vitesse (" + cfg.speed + ")"),
                el("input", { class: "ff-input", type: "range", min: "1", max: "10", value: cfg.speed,
                  onInput: function(e) { cfg.speed = +e.target.value; persist(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Luminosité (" + cfg.brightness + "%)"),
                el("input", { class: "ff-input", type: "range", min: "10", max: "100", value: cfg.brightness,
                  onInput: function(e) { cfg.brightness = +e.target.value; persist(); } })
              ])
            ])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-panel" }, [
              el("h2", "Aperçu LED"),
              el("div", { class: "ff-note" }, "Visualiseur animé — pas de pilotage matériel."),
              canvas,
              el("div", { class: "ff-btns", style: { marginTop: "12px" } }, [
                el("button", { class: "ff-btn primary", onClick: function() {
                  var name = prompt("Nom du preset :", cfg.name);
                  if (!name) return;
                  presets.unshift({ name: name, cfg: Object.assign({}, cfg) });
                  presets = presets.slice(0, 20);
                  persist(); toast("Preset sauvegardé !", "ok"); render();
                } }, "💾 Sauver preset"),
                el("button", { class: "ff-btn ghost", onClick: function() {
                  const json = JSON.stringify({
                    name: cfg.name, effect: cfg.effect, color1: cfg.color1,
                    color2: cfg.color2, speed: cfg.speed, ledCount: cfg.ledCount, brightness: cfg.brightness
                  }, null, 2);
                  const fname = cfg.name.replace(/\s+/g, "-").toLowerCase() + "-rgb.json";
                  save(fname, json, "application/json");
                } }, "⬇️ Export JSON"),
                el("button", { class: "ff-btn ghost", onClick: function() {
                  const json = JSON.stringify(cfg);
                  copy(json); toast("JSON copié !", "ok");
                } }, "📋 Copier JSON")
              ])
            ])
          ])
        ])
      );
      startAnim();
    }

    root.append(out);
    render();
  }
});
