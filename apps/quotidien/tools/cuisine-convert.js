/* Convertisseur de Cuisine — unités + redimensionnement de portions. */
FF.register({
  id: "cuisine-convert", title: "Convertisseur de Cuisine", icon: "🥄", tag: "Cuisine",
  desc: "Convertis tasse↔ml↔c.à soupe↔g et redimensionne les portions d'une recette.",
  mount(root, ctx) {
    const { el, store, toast, copy, round2 } = ctx;
    const st = store("cuisine-convert");
    const out = el("div");

    /* ---- Facteurs de conversion vers ml ---- */
    const UNITS = {
      "tasse": 250, "c.à soupe": 15, "c.à thé": 5, "ml": 1, "L": 1000,
      "oz liq.": 29.5735, "tasse US": 236.588
    };
    const WEIGHT = {
      "g": 1, "kg": 1000, "lb": 453.592, "oz": 28.3495
    };
    const APPROX = {
      "farine": 125, "sucre": 200, "beurre": 227, "sel": 288, "riz": 185,
      "fécule": 160, "cacao": 85, "chapelure": 115, "sucre glace": 120
    };

    let tab = st.get("tab", "unit");
    let recipe = st.get("recipe", "2 tasses de farine\n1 tasse de sucre\n3 oeufs\n125 ml de beurre fondu\n5 ml de vanille\n1 c.à thé de poudre à pâte");
    let portionsFrom = st.get("portionsFrom", 4);
    let portionsTo = st.get("portionsTo", 6);
    let unitFrom = st.get("unitFrom", "tasse");
    let unitTo = st.get("unitTo", "ml");
    let amount = st.get("amount", 1);
    let ingredient = st.get("ingredient", "farine");

    function persist() {
      st.set("tab", tab);
      st.set("recipe", recipe);
      st.set("portionsFrom", portionsFrom);
      st.set("portionsTo", portionsTo);
      st.set("unitFrom", unitFrom);
      st.set("unitTo", unitTo);
      st.set("amount", amount);
      st.set("ingredient", ingredient);
    }

    function convertUnit(val, from, to) {
      if (from === to) return val;
      const fromMl = UNITS[from];
      const toMl = UNITS[to];
      if (fromMl && toMl) return round2(val * fromMl / toMl);
      const fromG = WEIGHT[from];
      const toG = WEIGHT[to];
      if (fromG && toG) return round2(val * fromG / toG);
      // Volume → poids approximatif
      if (fromMl && WEIGHT[to]) {
        const density = APPROX[ingredient] || 200;
        return round2(val * fromMl * density / 1000 / WEIGHT[to]);
      }
      // Poids → volume
      if (fromG && UNITS[to]) {
        const density = APPROX[ingredient] || 200;
        return round2(val * fromG * 1000 / density / UNITS[to]);
      }
      return null;
    }

    function parseRecipeLine(line) {
      const m = line.match(/^(\d+[\d.,/]*)\s*(tasse|c\.à soupe|c\.à thé|c\.à\.thé|c\.à\.soupe|ml|L|oz liq\.|g|kg|lb|oz)?\s*(.*)$/i);
      if (!m) return null;
      let qty = m[1];
      if (qty.includes("/")) {
        const parts = qty.split("/");
        qty = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else {
        qty = parseFloat(qty.replace(",", "."));
      }
      return { qty, unit: m[2] || "", desc: m[3] || "" };
    }

    function scaleQty(qty, factor) {
      const result = round2(qty * factor);
      if (result === Math.round(result)) return String(result);
      // Try nice fractions
      const frac = result % 1;
      const int = Math.floor(result);
      const fracs = [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4]];
      for (const [n, d] of fracs) {
        if (Math.abs(frac - n / d) < 0.04) {
          return (int > 0 ? int + " " : "") + n + "/" + d;
        }
      }
      return String(result);
    }

    function render() {
      ctx.clear(out);
      const segUnit = el("button", { class: "ff-seg" + (tab === "unit" ? " on" : ""), onClick: () => { tab = "unit"; persist(); render(); } }, "🔄 Unités");
      const segPortion = el("button", { class: "ff-seg" + (tab === "portion" ? " on" : ""), onClick: () => { tab = "portion"; persist(); render(); } }, "📏 Portions");
      const seg = el("div", { class: "ff-seg", style: { marginBottom: "16px" } }, [segUnit, segPortion]);

      if (tab === "unit") {
        const allUnits = [...Object.keys(UNITS), ...Object.keys(WEIGHT)];
        const resultVal = convertUnit(+amount, unitFrom, unitTo);
        const resultEl = el("div", { class: "ff-result", style: { marginTop: "16px" } }, [
          el("div", { class: "lbl" }, amount + " " + unitFrom + (ingredient ? " de " + ingredient : "") + " ="),
          el("div", { class: "big" }, resultVal !== null ? resultVal + " " + unitTo : "Conversion non supportée"),
          el("div", { style: { marginTop: "8px", color: "var(--pg-sky2)", fontSize: ".85rem" } }, resultVal !== null ? "" : "Combinez volume↔volume ou masse↔masse (ou précisez l'ingrédient pour volume↔masse)")
        ]);

        out.append(
          el("div", { class: "ff-panel" }, [
            seg,
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [el("label", "Quantité"), el("input", { class: "ff-input", type: "number", min: "0", step: "0.01", value: amount, onInput: e => { amount = e.target.value; persist(); render(); } })]),
                el("div", { class: "ff-field" }, [el("label", "Unité source"), el("select", { class: "ff-select", onChange: e => { unitFrom = e.target.value; persist(); render(); } }, allUnits.map(u => el("option", { selected: u === unitFrom, value: u }, u)))])
              ]),
              el("div", { class: "ff-col", style: { display: "flex", alignItems: "center", justifyContent: "center", padding: "8px" } }, el("div", { style: { fontSize: "28px" } }, "→")),
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [el("label", "Unité cible"), el("select", { class: "ff-select", onChange: e => { unitTo = e.target.value; persist(); render(); } }, allUnits.map(u => el("option", { selected: u === unitTo, value: u }, u)))])
              ])
            ]),
            el("div", { class: "ff-field" }, [
              el("label", "Ingrédient (pour volume↔masse)"),
              el("select", { class: "ff-select", onChange: e => { ingredient = e.target.value; persist(); render(); } }, [
                el("option", { value: "", selected: ingredient === "" }, "— Choisir —"),
                ...Object.keys(APPROX).map(k => el("option", { value: k, selected: k === ingredient }, k + " (~" + APPROX[k] + "g/L)"))
              ])
            ]),
            resultEl,
            el("div", { class: "ff-panel", style: { marginTop: "16px" } }, [
              el("h2", "Table de référence rapide"),
              el("table", { class: "ff-table" }, [
                el("thead", el("tr", [el("th", "Mesure"), el("th", "ml"), el("th", "c.à soupe")])),
                el("tbody", [
                  ["1 tasse", "250 ml", "16 c.à soupe"],
                  ["3/4 tasse", "180 ml", "12 c.à soupe"],
                  ["1/2 tasse", "125 ml", "8 c.à soupe"],
                  ["1/4 tasse", "60 ml", "4 c.à soupe"],
                  ["1 c.à soupe", "15 ml", "3 c.à thé"],
                  ["1 c.à thé", "5 ml", "—"]
                ].map(([m, ml, cs]) => el("tr", [el("td", m), el("td", ml), el("td", cs)])))
              ])
            ])
          ])
        );
      } else {
        const factor = portionsTo / portionsFrom;
        const lines = recipe.split("\n");
        const scaled = lines.map(line => {
          const parsed = parseRecipeLine(line.trim());
          if (!parsed) return line;
          const newQty = scaleQty(parsed.qty, factor);
          return newQty + (parsed.unit ? " " + parsed.unit : "") + (parsed.desc ? " " + parsed.desc : "");
        });
        const scaledText = scaled.join("\n");

        out.append(
          el("div", { class: "ff-panel" }, [
            seg,
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [
                  el("label", "Portions originales"),
                  el("input", { class: "ff-input", type: "number", min: "1", step: "1", value: portionsFrom, onInput: e => { portionsFrom = +e.target.value || 1; persist(); render(); } })
                ])
              ]),
              el("div", { class: "ff-col", style: { display: "flex", alignItems: "center", justifyContent: "center" } }, [
                el("div", { style: { textAlign: "center" } }, [
                  el("div", { style: { fontSize: "24px" } }, "→"),
                  el("div", { style: { fontSize: ".85rem", fontWeight: "800", color: "var(--pg-org)" } }, "× " + round2(factor))
                ])
              ]),
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [
                  el("label", "Portions cibles"),
                  el("input", { class: "ff-input", type: "number", min: "1", step: "1", value: portionsTo, onInput: e => { portionsTo = +e.target.value || 1; persist(); render(); } })
                ])
              ])
            ]),
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [
                  el("label", "Ingrédients (format : quantité unité description)"),
                  el("textarea", { class: "ff-input", rows: 8, value: recipe, onInput: e => { recipe = e.target.value; persist(); render(); }, placeholder: "2 tasses de farine\n1 c.à soupe de beurre\n3 oeufs\n125 ml de lait" })
                ])
              ]),
              el("div", { class: "ff-col" }, [
                el("div", { class: "ff-field" }, [
                  el("label", "Recette redimensionnée (" + portionsTo + " portions)"),
                  el("div", { style: { background: "var(--pg-pale)", border: "2.5px solid var(--pg-navy)", borderRadius: "14px", padding: "14px", minHeight: "140px", fontWeight: "700", whiteSpace: "pre-wrap", lineHeight: "1.8" } }, scaledText)
                ]),
                el("div", { class: "ff-btns" }, [
                  el("button", { class: "ff-btn ghost", onClick: () => { copy(scaledText); toast("Recette copiée", "ok"); } }, "📋 Copier")
                ])
              ])
            ])
          ])
        );
      }
    }
    root.append(out);
    render();
  }
});
