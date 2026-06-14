/* Typography Pairer — paires de polices web-safe, aperçu texte, font-family CSS */
FF.register({
  id: "typography", title: "Typography Pairer", icon: "✍️", tag: "Typographie",
  desc: "Paires de polices web-safe (titre + corps), aperçu de texte, font-family CSS. 100% hors-ligne.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;
    const st = store("typography");

    const PAIRS = [
      { name: "Classique élégant", title: "Georgia, 'Times New Roman', serif", body: "Verdana, Geneva, Tahoma, sans-serif", titleSample: "Titre principal", bodySample: "Le texte de votre article va ici. Cette paire offre un contraste classique entre le serif et le sans-serif, idéale pour les sites éditoriaux et les blogs." },
      { name: "Tech moderne", title: "'Trebuchet MS', Helvetica, Arial, sans-serif", body: "'Courier New', Courier, monospace", titleSample: "Interface Système", bodySample: "Code propre, interface nette. Cette paire convient parfaitement aux projets techniques et aux documentations de développement." },
      { name: "Chaleureux", title: "'Palatino Linotype', Palatino, Book Antiqua, serif", body: "Optima, Candara, Calibri, Geneva, Verdana, sans-serif", titleSample: "Accueil & Bienvenue", bodySample: "Cette combinaison chaleureuse et humaniste convient aux marques axées sur la confiance, la santé ou l'artisanat." },
      { name: "Minimaliste", title: "Helvetica Neue, Helvetica, Arial, sans-serif", body: "Helvetica Neue, Helvetica, Arial, sans-serif", titleSample: "Simplicité", bodySample: "Le minimalisme absolu. Même police pour le titre et le corps avec des variations de poids et de taille. Idéal pour les interfaces modernes." },
      { name: "Luxueux", title: "Garamond, Cormorant, 'EB Garamond', Georgia, serif", body: "'Century Gothic', Futura, Verdana, Geneva, sans-serif", titleSample: "Prestige & Raffinement", bodySample: "La sérénité du Garamond paired avec la géométrie contemporaine. Parfait pour les marques de luxe et les portfolios créatifs." },
      { name: "Impact éditorial", title: "'Impact', 'Anton', Arial Black, Haettenschweiler, sans-serif", body: "Georgia, 'Times New Roman', serif", titleSample: "BREAKING NEWS", bodySample: "Contraste fort entre l'impactant et le lisible. Cette paire attire l'attention immédiatement et guide ensuite vers un contenu confortable." },
      { name: "Humain & doux", title: "Verdana, Geneva, sans-serif", body: "'Book Antiqua', Palatino, Georgia, serif", titleSample: "Bienveillance", bodySample: "La rondeur de Verdana adoucit le côté formel du serif en corps. Idéal pour les secteurs de la santé, du bien-être et de l'éducation." },
      { name: "Numérique classique", title: "'Lucida Console', Monaco, 'Courier New', monospace", body: "Tahoma, Verdana, Geneva, sans-serif", titleSample: "DataStream_v2", bodySample: "L'esthétique terminal pour les titres, avec un sans-serif lisible pour le contenu. Parfait pour les outils, dashboards et projets tech." }
    ];

    let selectedIdx = st.get("sel", 0);
    let sampleText = st.get("sample", "Portez ce vieux whisky au juge blond qui fume.");
    let titleSize = st.get("titleSize", 36);
    let bodySize = st.get("bodySize", 16);

    function persist() { st.set("sel", selectedIdx); st.set("sample", sampleText); st.set("titleSize", titleSize); st.set("bodySize", bodySize); }

    const preview = el("div", { class: "ff-panel", style: "min-height:140px" });

    function renderPreview() {
      while (preview.firstChild) preview.removeChild(preview.firstChild);
      const pair = PAIRS[selectedIdx];
      if (!pair) return;
      preview.append(
        el("div", { style: "font-family:" + pair.title + ";font-size:" + titleSize + "px;font-weight:700;line-height:1.2;margin-bottom:14px;color:var(--pg-navy)" }, pair.titleSample),
        el("div", { style: "font-family:" + pair.body + ";font-size:" + bodySize + "px;line-height:1.65;color:var(--pg-ink);margin-bottom:12px" }, pair.bodySample),
        el("div", { style: "font-family:" + pair.body + ";font-size:" + bodySize + "px;line-height:1.65;color:var(--pg-mut);font-style:italic" }, sampleText),
        el("div", { style: "margin-top:14px;display:flex;gap:10px;flex-wrap:wrap" }, [
          el("div", { class: "ff-chip" }, ["Titre : ", el("code", { style: "font-family:monospace" }, pair.title.split(",")[0].replace(/'/g, ""))]),
          el("div", { class: "ff-chip" }, ["Corps : ", el("code", { style: "font-family:monospace" }, pair.body.split(",")[0].replace(/'/g, ""))])
        ])
      );
    }

    const cssForPair = function(pair) {
      return ".titre {\n  font-family: " + pair.title + ";\n  font-weight: 700;\n  font-size: " + titleSize + "px;\n}\n\n.corps {\n  font-family: " + pair.body + ";\n  font-size: " + bodySize + "px;\n  line-height: 1.65;\n}";
    };

    const pairList = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
    function renderPairList() {
      while (pairList.firstChild) pairList.removeChild(pairList.firstChild);
      PAIRS.forEach(function(pair, i) {
        const card = el("button", {
          class: "ff-btn" + (i === selectedIdx ? " primary" : " ghost"),
          style: "text-align:left;justify-content:space-between;width:100%",
          onClick: function() { selectedIdx = i; persist(); renderPairList(); renderPreview(); }
        }, [
          el("span", { style: "font-family:" + pair.title + ";font-weight:700" }, pair.name),
          el("span", { class: "ff-chip", style: "font-size:.7rem" }, pair.title.split(",")[0].replace(/'/g, "").trim())
        ]);
        pairList.append(card);
      });
    }

    const sampleInput = el("input", {
      class: "ff-input", type: "text", value: sampleText,
      onInput: function(e) { sampleText = e.target.value; persist(); renderPreview(); }
    });

    const titleSizeInp = el("input", {
      type: "range", min: "18", max: "80", value: titleSize, class: "ff-input",
      onInput: function(e) { titleSize = +e.target.value; tSizeLabel.textContent = titleSize + "px"; persist(); renderPreview(); }
    });
    const tSizeLabel = el("span", { text: titleSize + "px" });

    const bodySizeInp = el("input", {
      type: "range", min: "12", max: "28", value: bodySize, class: "ff-input",
      onInput: function(e) { bodySize = +e.target.value; bSizeLabel.textContent = bodySize + "px"; persist(); renderPreview(); }
    });
    const bSizeLabel = el("span", { text: bodySize + "px" });

    renderPairList();
    renderPreview();

    root.append(
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Paires de polices"),
            pairList
          ])
        ]),
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Options"),
            el("div", { class: "ff-field" }, [el("label", "Texte de test"), sampleInput]),
            el("div", { class: "ff-field" }, [el("label", ["Taille titre : ", tSizeLabel]), titleSizeInp]),
            el("div", { class: "ff-field" }, [el("label", ["Taille corps : ", bSizeLabel]), bodySizeInp]),
            el("div", { class: "ff-btns" }, [
              el("button", { class: "ff-btn primary", onClick: function() {
                const pair = PAIRS[selectedIdx];
                if (!pair) return;
                copy(cssForPair(pair));
                toast("CSS copié !", "ok");
              }}, "📋 Copier le CSS")
            ])
          ]),
          el("div", { class: "ff-panel" }, [el("h2", "Aperçu"), preview])
        ])
      ])
    );
  }
});
