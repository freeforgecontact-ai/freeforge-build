/* Recipe Scaler & Converter — recette avec ingrédients qty+unité, mise à l'échelle, métrique/impérial. */
FF.register({
  id: "recipe-scaler", title: "Recipe Scaler & Converter", icon: "🍽️", tag: "Cuisine",
  desc: "Saisis une recette, redimensionne et convertis métrique ↔ impérial. Copie ou exporte.",
  mount(root, ctx) {
    const { el, store, toast, copy, save, fmt } = ctx;
    const st = store("recipe-scaler");
    const out = el("div");

    let recipeName = st.get("name", "Gâteau au chocolat");
    let portions = st.get("portions", 8);
    let targetPortions = st.get("target", 12);
    let unitSystem = st.get("unit", "metric"); // metric | imperial
    let ingredients = st.get("ingredients", [
      { qty: 2, unit: "tasse", name: "farine" },
      { qty: 1, unit: "tasse", name: "sucre" },
      { qty: 125, unit: "ml", name: "beurre fondu" },
      { qty: 3, unit: "", name: "oeufs" },
      { qty: 5, unit: "ml", name: "vanille" },
      { qty: 200, unit: "ml", name: "lait" }
    ]);

    const CONVERSIONS = {
      // volume metric → imperial
      "ml": { imperial: "oz liq.", factor: 1 / 29.5735 },
      "L": { imperial: "pintes", factor: 1.05669 },
      "tasse": { imperial: "tasse US", factor: 250 / 236.588 },
      "c.à soupe": { imperial: "tbsp", factor: 1 },
      "c.à thé": { imperial: "tsp", factor: 1 },
      // mass
      "g": { imperial: "oz", factor: 1 / 28.3495 },
      "kg": { imperial: "lb", factor: 2.20462 },
      // imperial → metric
      "oz liq.": { metric: "ml", factor: 29.5735 },
      "pintes": { metric: "L", factor: 0.946353 },
      "tasse US": { metric: "ml", factor: 236.588 },
      "tbsp": { metric: "c.à soupe", factor: 1 },
      "tsp": { metric: "c.à thé", factor: 1 },
      "oz": { metric: "g", factor: 28.3495 },
      "lb": { metric: "kg", factor: 0.453592 }
    };

    function persist() {
      st.set("name", recipeName);
      st.set("portions", portions);
      st.set("target", targetPortions);
      st.set("unit", unitSystem);
      st.set("ingredients", ingredients);
    }

    function convertUnit(qty, unit) {
      const conv = CONVERSIONS[unit];
      if (!conv) return { qty, unit };
      if (unitSystem === "imperial" && conv.imperial) {
        return { qty: Math.round(qty * conv.factor * 100) / 100, unit: conv.imperial };
      }
      if (unitSystem === "metric" && conv.metric) {
        return { qty: Math.round(qty * conv.factor * 100) / 100, unit: conv.metric };
      }
      return { qty, unit };
    }

    function scaleQty(qty) {
      const factor = targetPortions / portions;
      const raw = qty * factor;
      return Math.round(raw * 100) / 100;
    }

    function fmtQty(n) {
      if (n === Math.round(n)) return String(n);
      const fracs = [[1, 8], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4]];
      const int = Math.floor(n);
      const frac = n - int;
      for (const [a, b] of fracs) {
        if (Math.abs(frac - a / b) < 0.04) {
          return (int > 0 ? int + " " : "") + a + "/" + b;
        }
      }
      return String(n);
    }

    function render() {
      ctx.clear(out);
      const factor = targetPortions / portions;

      const scaledList = ingredients.map(ing => {
        const newQty = scaleQty(ing.qty);
        const converted = convertUnit(newQty, ing.unit);
        return { ...ing, scaledQty: converted.qty, scaledUnit: converted.unit };
      });

      const listText = recipeName + " (" + targetPortions + " portions)\n" +
        scaledList.map(i => fmtQty(i.scaledQty) + (i.scaledUnit ? " " + i.scaledUnit : "") + " " + i.name).join("\n");

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [
              el("label", "Nom de la recette"),
              el("input", { class: "ff-input", value: recipeName, onInput: e => { recipeName = e.target.value; persist(); } })
            ])]),
            el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [
              el("label", "Système d'unités"),
              el("select", { class: "ff-select", onChange: e => { unitSystem = e.target.value; persist(); render(); } }, [
                el("option", { value: "metric", selected: unitSystem === "metric" }, "Métrique (ml, g)"),
                el("option", { value: "imperial", selected: unitSystem === "imperial" }, "Impérial (oz, lb)")
              ])
            ])])
          ]),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [
              el("label", "Portions d'origine"),
              el("input", { class: "ff-input", type: "number", min: "1", value: portions, onInput: e => { portions = +e.target.value || 1; persist(); render(); } })
            ])]),
            el("div", { class: "ff-col", style: { display: "flex", alignItems: "center", justifyContent: "center" } }, [
              el("div", { style: { textAlign: "center", padding: "8px" } }, [
                el("div", { style: { fontSize: "22px" } }, "→"),
                el("div", { style: { fontWeight: "800", color: "var(--pg-org)" } }, "× " + (Math.round(factor * 100) / 100))
              ])
            ]),
            el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [
              el("label", "Portions cibles"),
              el("input", { class: "ff-input", type: "number", min: "1", value: targetPortions, onInput: e => { targetPortions = +e.target.value || 1; persist(); render(); } })
            ])])
          ])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, [
            el("h2", { style: { margin: 0 } }, "Ingrédients"),
            el("button", { class: "ff-btn sm primary", onClick: () => { ingredients.push({ qty: 1, unit: "tasse", name: "" }); persist(); render(); } }, "＋ Ajouter")
          ]),
          el("table", { class: "ff-table" }, [
            el("thead", el("tr", [
              el("th", "Qté"), el("th", "Unité"), el("th", "Ingrédient"), el("th", "")
            ])),
            el("tbody", ingredients.map((ing, i) => el("tr", [
              el("td", el("input", { class: "ff-input", type: "number", min: "0", step: "0.01", value: ing.qty, style: { width: "80px" }, onInput: e => { ing.qty = +e.target.value; persist(); render(); } })),
              el("td", el("input", { class: "ff-input", value: ing.unit, placeholder: "tasse, ml…", style: { width: "100px" }, onInput: e => { ing.unit = e.target.value; persist(); } })),
              el("td", el("input", { class: "ff-input", value: ing.name, placeholder: "farine…", onInput: e => { ing.name = e.target.value; persist(); } })),
              el("td", el("button", { class: "ff-btn sm ghost", onClick: () => { ingredients.splice(i, 1); persist(); render(); } }, "✕"))
            ])))
          ])
        ]),
        el("div", { class: "ff-panel", style: { background: "linear-gradient(135deg, #f0fdf4 0%, #fffbeb 100%)" } }, [
          el("h2", recipeName + " — " + targetPortions + " portions"),
          el("div", { style: { display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" } }, [
            el("table", { class: "ff-table", style: { flex: "1 1 auto" } }, [
              el("thead", el("tr", [
                el("th", "Qté originale"),
                el("th", "→ Ajustée (" + targetPortions + " p.)"),
                el("th", "Ingrédient")
              ])),
              el("tbody", scaledList.map(ing => el("tr", [
                el("td", { style: { color: "var(--pg-mut)" } }, fmtQty(ing.qty) + (ing.unit ? " " + ing.unit : "")),
                el("td", [
                  el("strong", fmtQty(ing.scaledQty)),
                  ing.scaledUnit ? " " + ing.scaledUnit : ""
                ]),
                el("td", ing.name)
              ])))
            ])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn ghost", onClick: () => { copy(listText); toast("Recette copiée", "ok"); } }, "📋 Copier"),
            el("button", { class: "ff-btn accent", onClick: () => {
              save("recette-" + recipeName.replace(/\s+/g, "-").toLowerCase() + ".txt", listText, "text/plain");
            }}, "⬇️ Exporter .txt")
          ])
        ])
      );
    }
    root.append(out);
    render();
  }
});
