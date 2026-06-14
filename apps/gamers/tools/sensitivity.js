/* Aim Sensitivity Converter — cm/360, eDPI, conversion inter-jeux. */
FF.register({
  id: "sensitivity", title: "Aim Sensitivity Converter", icon: "🖱️", tag: "Visée",
  desc: "Convertis ta sensibilité entre CS2, Valorant, Apex, Overwatch et Fortnite via cm/360 et eDPI.",
  mount(root, ctx) {
    const { el, store, fmt, round2, copy, toast, clear } = ctx;
    const st = store("sensitivity");

    // Constantes yaw (degrés par unité de sensibilité in-game par pouce)
    const GAMES = {
      cs2:       { name: "CS2",            yaw: 0.022,   label: "Sens in-game" },
      valorant:  { name: "Valorant",       yaw: 0.07,    label: "Sens in-game" },
      apex:      { name: "Apex Legends",   yaw: 0.022,   label: "Sens in-game" },
      overwatch: { name: "Overwatch 2",    yaw: 0.0066,  label: "Sens in-game" },
      fortnite:  { name: "Fortnite",       yaw: 0.5625,  label: "Sens X (0-100)" }
    };

    let s = st.get("state", { fromGame: "cs2", toGame: "valorant", dpi: 800, fromSens: 2.0 });

    function persist() { st.set("state", s); }

    // cm/360 = 360 / (DPI * sens_in_game * yaw * 2.54)
    // sens_in_game = 360 / (DPI * yaw * cm360 * 2.54) ... mais on travaille en inches :
    // cm/360 = (360 / (DPI * yaw * sens)) * 2.54
    function getCm360(dpi, sens, gameKey) {
      const g = GAMES[gameKey];
      if (!g) return 0;
      return (360 / (dpi * g.yaw * sens)) * 2.54;
    }
    function sensFromCm360(cm360, dpi, gameKey) {
      const g = GAMES[gameKey];
      if (!g || cm360 <= 0 || dpi <= 0) return 0;
      return (360 / (dpi * g.yaw * (cm360 / 2.54)));
    }

    const out = el("div");
    function render() {
      clear(out);
      const dpi = +s.dpi || 800;
      const fromSens = +s.fromSens || 1;
      const cm360 = getCm360(dpi, fromSens, s.fromGame);
      const eDPI = dpi * fromSens;
      const toSens = sensFromCm360(cm360, dpi, s.toGame);

      function gameSelect(key, label, val, onChange) {
        return el("div", { class: "ff-field" }, [
          el("label", label),
          el("select", {
            class: "ff-select",
            onChange(e) { onChange(e.target.value); persist(); render(); }
          }, Object.entries(GAMES).map(([k, g]) =>
            el("option", { value: k, selected: val === k }, g.name)
          ))
        ]);
      }

      const presets = [
        { name: "CS2 low", fromGame: "cs2", dpi: 400, fromSens: 1.0 },
        { name: "CS2 standard", fromGame: "cs2", dpi: 800, fromSens: 2.0 },
        { name: "Valorant std", fromGame: "valorant", dpi: 800, fromSens: 0.4 },
        { name: "Apex std", fromGame: "apex", dpi: 800, fromSens: 1.5 },
        { name: "Fortnite std", fromGame: "fortnite", dpi: 800, fromSens: 8 }
      ];

      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Presets rapides"),
          el("div", { class: "ff-btns" }, presets.map(p =>
            el("button", { class: "ff-btn sm ghost", onClick() {
              s.fromGame = p.fromGame; s.dpi = p.dpi; s.fromSens = p.fromSens;
              persist(); render();
            } }, p.name)
          ))
        ]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-panel" }, [
              el("h2", "Source"),
              gameSelect("fromGame", "Jeu source", s.fromGame, v => { s.fromGame = v; }),
              el("div", { class: "ff-field" }, [
                el("label", "DPI de la souris"),
                el("input", { class: "ff-input", type: "number", min: "100", max: "32000", step: "100", value: s.dpi,
                  onInput(e) { s.dpi = +e.target.value; persist(); render(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", GAMES[s.fromGame].label + " (jeu source)"),
                el("input", { class: "ff-input", type: "number", min: "0.01", step: "0.01", value: s.fromSens,
                  onInput(e) { s.fromSens = +e.target.value; persist(); render(); } })
              ])
            ])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-panel" }, [
              el("h2", "Destination"),
              gameSelect("toGame", "Jeu cible", s.toGame, v => { s.toGame = v; }),
              el("div", { class: "ff-result", style: { marginTop: "16px" } }, [
                el("div", { class: "lbl" }, "Sensibilité équivalente — " + GAMES[s.toGame].name),
                el("div", { class: "big" }, isFinite(toSens) ? toSens.toFixed(4) : "—")
              ]),
              el("div", { class: "ff-btns", style: { marginTop: "8px" } }, [
                el("button", { class: "ff-btn sm ghost", onClick() { copy(toSens.toFixed(4)); toast("Copié !", "ok"); } }, "📋 Copier")
              ])
            ])
          ])
        ]),
        el("div", { class: "ff-stats", style: { marginBottom: "18px" } }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, cm360.toFixed(1) + " cm"), el("div", { class: "k" }, "cm / 360°")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, Math.round(eDPI).toString()), el("div", { class: "k" }, "eDPI")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, dpi.toString()), el("div", { class: "k" }, "DPI")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fromSens.toString()), el("div", { class: "k" }, "Sens source")])
        ]),
        el("div", { class: "ff-panel" }, [
          el("h2", "Tableau de conversion complet"),
          el("table", { class: "ff-table" }, [
            el("tr", [el("th", "Jeu"), el("th", { class: "num" }, "Sensibilité"), el("th", { class: "num" }, "eDPI")]),
            ...Object.entries(GAMES).map(([k, g]) => {
              const ts = sensFromCm360(cm360, dpi, k);
              return el("tr", { style: k === s.toGame ? { background: "var(--pg-pale)" } : {} }, [
                el("td", g.name),
                el("td", { class: "num" }, ts.toFixed(4)),
                el("td", { class: "num" }, Math.round(dpi * ts).toString())
              ]);
            })
          ]),
          el("div", { class: "ff-note" }, "cm/360 = distance physique pour faire un tour complet. Yaw : CS2/Apex=0,022 | Valorant=0,07 | OW2=0,0066 | Fortnite=0,5625.")
        ])
      );
    }
    root.append(out); render();
  }
});
