/* Scanner de Frigo & Recettes — ingrédients chips, 12 recettes locales, suggestions. */
FF.register({
  id: "frigo", title: "Scanner de Frigo & Recettes", icon: "🧊", tag: "Cuisine",
  desc: "Saisis tes ingrédients, découvre ce que tu peux cuisiner avec ce que tu as.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("frigo");
    let ingredients = st.get("ingredients", ["oeufs", "fromage", "tomates", "ail"]);
    const out = el("div");

    const RECIPES = [
      { name: "Omelette au fromage", icon: "🍳", req: ["oeufs", "fromage"], opt: ["champignons", "oignons", "poivrons"], steps: "Battre les oeufs, ajouter le fromage râpé. Cuire à feu moyen dans une poêle beurrée." },
      { name: "Spaghetti tomate-ail", icon: "🍝", req: ["pâtes", "tomates", "ail"], opt: ["basilic", "oignons", "parmesan"], steps: "Faire revenir l'ail dans l'huile, ajouter les tomates concassées, assaisonner. Servir sur pâtes." },
      { name: "Quesadillas au fromage", icon: "🌮", req: ["tortillas", "fromage"], opt: ["poivrons", "oignons", "jalapeños"], steps: "Placer le fromage sur une tortilla, couvrir d'une autre, cuire à la poêle 3 min chaque côté." },
      { name: "Salade César maison", icon: "🥗", req: ["laitue", "parmesan", "pain"], opt: ["poulet", "anchois", "citron"], steps: "Couper la laitue, croûtons de pain grillé, vinaigrette César, copeaux de parmesan." },
      { name: "Soupe à l'ail rôti", icon: "🍲", req: ["ail", "bouillon", "pain"], opt: ["oignons", "thym", "fromage"], steps: "Rôtir l'ail au four 40 min, presser dans le bouillon chaud, servir avec pain grillé." },
      { name: "Riz frit aux légumes", icon: "🍚", req: ["riz", "oeufs", "soja"], opt: ["carottes", "pois", "oignons", "ail"], steps: "Cuire le riz à l'avance. Sauter les légumes à feu vif, ajouter le riz froid puis les oeufs battus." },
      { name: "Grilled cheese tomate", icon: "🥪", req: ["pain", "fromage", "tomates"], opt: ["moutarde", "oignons"], steps: "Beurrer le pain, ajouter fromage et rondelles de tomates, griller à la poêle 3 min chaque côté." },
      { name: "Frittata de légumes", icon: "🍳", req: ["oeufs", "courgettes", "fromage"], opt: ["poivrons", "oignons", "champignons"], steps: "Faire sauter les légumes, ajouter les oeufs battus, couvrir et cuire 8 min puis finir sous le gril." },
      { name: "Pasta primavera", icon: "🍝", req: ["pâtes", "courgettes", "tomates"], opt: ["parmesan", "basilic", "ail"], steps: "Cuire les pâtes, sauter les légumes à l'huile d'olive, mélanger, terminer avec parmesan et basilic." },
      { name: "Bruschetta maison", icon: "🍞", req: ["pain", "tomates", "ail"], opt: ["basilic", "huile d'olive", "parmesan"], steps: "Griller le pain, frotter d'ail, garnir de tomates en dés, basilic, huile d'olive et sel." },
      { name: "Oeuf cocotte au four", icon: "🥚", req: ["oeufs", "crème", "fromage"], opt: ["lardons", "herbes", "champignons"], steps: "Beurrer des ramequins, verser crème, casser un oeuf, fromage râpé, cuire au bain-marie 12 min." },
      { name: "Salade de pâtes froides", icon: "🥗", req: ["pâtes", "tomates", "olives"], opt: ["mozzarella", "basilic", "poivrons", "oignons"], steps: "Cuire et refroidir les pâtes, mélanger avec tomates, olives, vinaigrette à l'huile d'olive." }
    ];

    function normalize(s) { return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

    function matchScore(recipe) {
      const have = ingredients.map(normalize);
      const reqMatch = recipe.req.filter(r => have.some(h => h.includes(normalize(r)) || normalize(r).includes(h))).length;
      const optMatch = recipe.opt.filter(r => have.some(h => h.includes(normalize(r)) || normalize(r).includes(h))).length;
      const missing = recipe.req.filter(r => !have.some(h => h.includes(normalize(r)) || normalize(r).includes(h))).length;
      return { reqMatch, optMatch, missing, total: reqMatch * 3 + optMatch };
    }

    function render() {
      ctx.clear(out);
      const scored = RECIPES.map(r => ({ ...r, score: matchScore(r) })).sort((a, b) => b.score.total - a.score.total || a.score.missing - b.score.missing);
      const canMake = scored.filter(r => r.score.missing === 0);
      const almost = scored.filter(r => r.score.missing >= 1 && r.score.missing <= 2);

      const ingInp = el("input", { class: "ff-input", placeholder: "Ajouter un ingrédient…", style: { maxWidth: "280px" } });
      ingInp.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const v = ingInp.value.trim().toLowerCase();
          if (!v) return;
          if (!ingredients.includes(v)) { ingredients.push(v); st.set("ingredients", ingredients); render(); }
          else toast("Déjà dans ta liste", "err");
        }
      });

      function recipeCard(r, highlight) {
        const score = r.score;
        return el("div", { class: "ff-panel", style: { marginBottom: "12px", borderColor: highlight ? "var(--pg-ok)" : "var(--pg-navy)", background: highlight ? "#f0fdf4" : "#fff" } }, [
          el("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px" } }, [
            el("div", { style: { fontSize: "32px", lineHeight: "1" } }, r.icon),
            el("div", { style: { flex: 1 } }, [
              el("div", { style: { fontWeight: "800", fontSize: "1.1rem", color: "var(--pg-navy)", marginBottom: "4px" } }, r.name),
              el("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" } }, [
                ...r.req.map(ing => {
                  const have = ingredients.some(h => normalize(h).includes(normalize(ing)) || normalize(ing).includes(normalize(h)));
                  return el("span", { class: "ff-chip", style: { background: have ? "#dcfce7" : "#fee2e2", borderColor: have ? "var(--pg-ok)" : "var(--pg-err)", color: have ? "var(--pg-ok)" : "var(--pg-err)" } }, (have ? "✓ " : "✗ ") + ing);
                }),
                ...r.opt.slice(0, 3).map(ing => {
                  const have = ingredients.some(h => normalize(h).includes(normalize(ing)) || normalize(ing).includes(normalize(h)));
                  return el("span", { class: "ff-chip", style: { opacity: ".7" } }, (have ? "✓ " : "+ ") + ing);
                })
              ]),
              el("details", [
                el("summary", { style: { cursor: "pointer", color: "var(--pg-blue)", fontWeight: "700" } }, "Voir les étapes"),
                el("p", { style: { marginTop: "8px", color: "var(--pg-mut)" } }, r.steps)
              ])
            ])
          ])
        ]);
      }

      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Mon frigo 🧊"),
          el("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" } }, [
            ingInp,
            el("button", { class: "ff-btn sm primary", onClick: () => {
              const v = ingInp.value.trim().toLowerCase();
              if (!v) return;
              if (!ingredients.includes(v)) { ingredients.push(v); st.set("ingredients", ingredients); ingInp.value = ""; render(); }
            }}, "＋")
          ]),
          ingredients.length === 0
            ? el("div", { class: "ff-empty" }, "Aucun ingrédient. Ajoutes-en un ci-dessus.")
            : el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } },
              ingredients.map(ing => el("span", { class: "ff-chip", style: { cursor: "pointer", background: "var(--pg-pale)" } }, [
                ing + " ",
                el("span", { style: { marginLeft: "4px", color: "var(--pg-err)", fontWeight: "900", cursor: "pointer" }, onClick: () => {
                  ingredients = ingredients.filter(x => x !== ing);
                  st.set("ingredients", ingredients);
                  render();
                }}, "✕")
              ]))
            )
        ]),
        el("div", { class: "ff-panel", style: { background: "#f0fdf4", borderColor: "var(--pg-ok)" } }, [
          el("h2", { style: { color: "var(--pg-ok)" } }, "✅ Tu peux cuisiner (" + canMake.length + ")"),
          canMake.length === 0
            ? el("div", { class: "ff-empty" }, "Ajoute plus d'ingrédients pour des suggestions.")
            : el("div", canMake.map(r => recipeCard(r, true)))
        ]),
        el("div", { class: "ff-panel" }, [
          el("h2", "⚡ Presque prêt (1-2 ingrédients manquants)"),
          almost.length === 0
            ? el("div", { class: "ff-empty" }, "Rien à moins de 2 ingrédients près.")
            : el("div", almost.map(r => recipeCard(r, false)))
        ])
      );
    }
    root.append(out);
    render();
  }
});
