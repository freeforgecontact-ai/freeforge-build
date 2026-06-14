/* Checklist de Voyage Dynamique — quantités adaptées à la durée + climat + type. */
FF.register({
  id: "checklist-voyage", title: "Checklist de Voyage", icon: "📋", tag: "Planification",
  desc: "Génère une liste de bagages selon la durée, le climat et le type de voyage. Quantités adaptées.",
  mount(root, ctx) {
    const { el, store, fmt, toast, save } = ctx;
    const st = store("checklist-voyage");

    let config = st.get("config", { jours: 7, climat: "tempere", type: "affaires" });
    let customItems = st.get("customItems", []);
    let checked = st.get("checked", {});

    const CLIMATES = [["chaud", "Chaud"], ["froid", "Froid"], ["tempere", "Tempéré"], ["pluvieux", "Pluvieux"]];
    const TYPES = [["affaires", "Affaires"], ["plage", "Plage"], ["randonnee", "Randonnée"]];

    function genItems(jours, climat, type) {
      const j = Math.max(1, jours);
      const hauts = Math.min(j, 7);
      const bas = Math.ceil(j / 2);
      const sous = Math.min(j + 1, 10);
      const chaussettes = Math.min(j + 1, 10);
      const pyjamas = Math.ceil(j / 3);
      const items = [];

      // Vêtements de base
      items.push({ cat: "Vêtements", nom: "T-shirts / hauts", qte: hauts });
      items.push({ cat: "Vêtements", nom: "Sous-vêtements", qte: sous });
      items.push({ cat: "Vêtements", nom: "Chaussettes", qte: chaussettes });
      items.push({ cat: "Vêtements", nom: "Pantalons / bas", qte: bas });
      items.push({ cat: "Vêtements", nom: "Pyjamas", qte: pyjamas });

      // Par climat
      if (climat === "froid") {
        items.push({ cat: "Vêtements", nom: "Manteau chaud", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Chandails polaires", qte: Math.min(Math.ceil(j / 3), 3) });
        items.push({ cat: "Vêtements", nom: "Tuque", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Mitaines / gants", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Écharpe", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Sous-vêtements thermiques", qte: Math.min(Math.ceil(j / 2), 5) });
        items.push({ cat: "Vêtements", nom: "Bottes isolées", qte: 1 });
      } else if (climat === "chaud") {
        items.push({ cat: "Vêtements", nom: "Shorts", qte: Math.ceil(j / 2) });
        items.push({ cat: "Vêtements", nom: "Sandales", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Chapeau de soleil", qte: 1 });
        items.push({ cat: "Santé", nom: "Crème solaire", qte: j > 7 ? 2 : 1 });
      } else if (climat === "pluvieux") {
        items.push({ cat: "Vêtements", nom: "Imperméable / coupe-vent", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Parapluie", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Bottes de pluie", qte: 1 });
      } else {
        // tempéré
        items.push({ cat: "Vêtements", nom: "Veste légère", qte: 1 });
      }

      // Par type de voyage
      if (type === "affaires") {
        const chemises = Math.min(j, 5);
        items.push({ cat: "Vêtements", nom: "Chemises habillées", qte: chemises });
        items.push({ cat: "Vêtements", nom: "Veston / tailleur", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Souliers habillés", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Cravate / foulard", qte: Math.min(j, 3) });
        items.push({ cat: "Électronique", nom: "Ordinateur portable", qte: 1 });
        items.push({ cat: "Électronique", nom: "Chargeurs (ordi + téléphone)", qte: 1 });
        items.push({ cat: "Documents", nom: "Cartes d'affaires", qte: j > 5 ? 30 : 15 });
        items.push({ cat: "Documents", nom: "Documents de présentation", qte: 1 });
      } else if (type === "plage") {
        items.push({ cat: "Vêtements", nom: "Maillots de bain", qte: Math.min(Math.ceil(j / 3), 3) });
        items.push({ cat: "Vêtements", nom: "Robe / short de plage", qte: Math.ceil(j / 3) });
        items.push({ cat: "Accessoires", nom: "Serviette de plage", qte: j > 7 ? 2 : 1 });
        items.push({ cat: "Santé", nom: "Crème solaire FPS 50+", qte: j > 7 ? 2 : 1 });
        items.push({ cat: "Accessoires", nom: "Lunettes de soleil", qte: 1 });
        items.push({ cat: "Accessoires", nom: "Sac de plage / filet", qte: 1 });
        items.push({ cat: "Accessoires", nom: "Tongs", qte: 1 });
        if (j > 5) items.push({ cat: "Accessoires", nom: "Crème après-soleil", qte: 1 });
      } else if (type === "randonnee") {
        items.push({ cat: "Vêtements", nom: "Chaussures de randonnée", qte: 1 });
        items.push({ cat: "Vêtements", nom: "Bas de randonnée", qte: Math.min(j, 5) });
        items.push({ cat: "Vêtements", nom: "Vêtements imperméables", qte: 1 });
        items.push({ cat: "Accessoires", nom: "Sac à dos de randonnée", qte: 1 });
        items.push({ cat: "Accessoires", nom: "Bâtons de randonnée", qte: 1 });
        items.push({ cat: "Santé", nom: "Trousse de premiers soins", qte: 1 });
        items.push({ cat: "Accessoires", nom: "Lampe de poche / frontale", qte: 1 });
        items.push({ cat: "Accessoires", nom: "Carte / GPS", qte: 1 });
        items.push({ cat: "Accessoires", nom: "Bouteille d'eau (1L+)", qte: 1 });
        if (j > 3) items.push({ cat: "Accessoires", nom: "Tente (si camping)", qte: 1 });
        if (j > 3) items.push({ cat: "Accessoires", nom: "Sac de couchage", qte: 1 });
      }

      // Toilette (selon durée)
      items.push({ cat: "Toilette", nom: "Brosse à dents + dentifrice", qte: 1 });
      items.push({ cat: "Toilette", nom: "Déodorant", qte: j > 7 ? 2 : 1 });
      items.push({ cat: "Toilette", nom: "Shampoing / revitalisant", qte: j > 7 ? 2 : 1 });
      items.push({ cat: "Toilette", nom: "Savon / gel douche", qte: j > 7 ? 2 : 1 });
      items.push({ cat: "Toilette", nom: "Rasoir / crème à raser", qte: 1 });
      if (j > 5) items.push({ cat: "Toilette", nom: "Sèche-cheveux (ou adaptatif)", qte: 1 });

      // Électronique de base
      items.push({ cat: "Électronique", nom: "Téléphone + chargeur", qte: 1 });
      items.push({ cat: "Électronique", nom: "Adaptateur de voyage", qte: 1 });
      items.push({ cat: "Électronique", nom: "Banque d'alimentation (power bank)", qte: 1 });
      if (j > 5) items.push({ cat: "Électronique", nom: "Écouteurs / casque", qte: 1 });

      // Documents
      items.push({ cat: "Documents", nom: "Passeport / pièce d'identité", qte: 1 });
      items.push({ cat: "Documents", nom: "Assurance voyage", qte: 1 });
      items.push({ cat: "Documents", nom: "Billets (avion/train)", qte: 1 });
      items.push({ cat: "Documents", nom: "Réservations hôtel", qte: 1 });
      if (j > 7) items.push({ cat: "Documents", nom: "Visa / permis (si requis)", qte: 1 });

      // Santé
      items.push({ cat: "Santé", nom: "Médicaments habituels", qte: j });
      items.push({ cat: "Santé", nom: "Analgésiques (aspirine, ibuprofène)", qte: 1 });
      if (j > 5) items.push({ cat: "Santé", nom: "Anti-diarrhéiques", qte: 1 });

      return items;
    }

    function getKey(item) { return item.cat + ":" + item.nom; }

    const out = el("div");

    function render() {
      ctx.clear(out);
      const { jours, climat, type } = config;
      const items = genItems(jours, climat, type);
      const allItems = [...items, ...customItems.map(i => ({ cat: "Personnalisé", nom: i.nom, qte: i.qte || 1 }))];
      const total = allItems.length;
      const done = allItems.filter(i => checked[getKey(i)]).length;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;

      // Grouper par catégorie
      const cats = {};
      allItems.forEach(i => {
        if (!cats[i.cat]) cats[i.cat] = [];
        cats[i.cat].push(i);
      });

      const seg = (key, opts) => el("div", { class: "ff-seg" }, opts.map(([v, lbl]) =>
        el("button", { class: config[key] === v ? "on" : "", onClick: () => { config[key] = v; st.set("config", config); checked = {}; st.set("checked", checked); render(); } }, lbl)));

      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Paramètres du voyage"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Durée (jours)"),
                el("input", { class: "ff-input", type: "number", min: "1", max: "90", value: jours,
                  onInput: (e) => { config.jours = Math.max(1, +e.target.value || 1); st.set("config", config); checked = {}; st.set("checked", checked); render(); } })
              ]),
              el("div", { class: "ff-field" }, [el("label", "Climat"), seg("climat", CLIMATES)]),
              el("div", { class: "ff-field" }, [el("label", "Type de voyage"), seg("type", TYPES)])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-result" }, [
                el("div", { class: "lbl" }, "Progression"),
                el("div", { class: "big" }, pct + " %"),
                el("div", { style: { color: "var(--pg-sky2)", fontSize: ".9rem", marginTop: "4px" } }, done + " / " + total + " items")
              ]),
              el("div", { style: { background: "var(--pg-pale)", border: "2.5px solid var(--pg-navy)", borderRadius: "999px", height: "12px", marginTop: "10px", overflow: "hidden" } }, [
                el("div", { style: { width: pct + "%", height: "100%", background: pct === 100 ? "var(--pg-ok)" : "var(--pg-blue)", borderRadius: "999px", transition: "width .3s" } })
              ])
            ])
          ])
        ]),
        // Catégories
        ...Object.entries(cats).map(([cat, catItems]) =>
          el("div", { class: "ff-panel" }, [
            el("h2", cat),
            el("div", {}, catItems.map(item => {
              const key = getKey(item);
              const isChecked = !!checked[key];
              return el("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", borderBottom: "1px solid var(--pg-sky2)" } }, [
                el("input", { type: "checkbox", checked: isChecked, style: { width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--pg-blue)" },
                  onChange: (e) => { checked[key] = e.target.checked; st.set("checked", checked); render(); } }),
                el("span", { style: { flex: 1, textDecoration: isChecked ? "line-through" : "none", color: isChecked ? "var(--pg-mut)" : "var(--pg-ink)" } }, item.nom),
                item.qte > 1 ? el("span", { class: "ff-chip" }, "× " + item.qte) : null,
                cat === "Personnalisé" ? el("button", { class: "ff-btn sm ghost", onClick: () => { const idx = customItems.findIndex(c => c.nom === item.nom); if (idx >= 0) { customItems.splice(idx, 1); st.set("customItems", customItems); delete checked[key]; st.set("checked", checked); render(); } } }, "✕") : null
              ]);
            }))
          ])
        ),
        // Ajout personnalisé
        el("div", { class: "ff-panel" }, [
          el("h2", "Ajouter un item"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [el("input", { class: "ff-input", id: "cv-new-item", placeholder: "Ex : Adaptateur universel...", type: "text" })]),
            el("div", { class: "ff-col", style: { flex: "0 0 120px" } }, [el("input", { class: "ff-input", id: "cv-new-qte", type: "number", min: "1", value: "1", placeholder: "Qté" })])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: () => {
              const nomEl = root.querySelector("#cv-new-item");
              const qteEl = root.querySelector("#cv-new-qte");
              const nom = nomEl ? nomEl.value.trim() : "";
              const qte = qteEl ? Math.max(1, +qteEl.value || 1) : 1;
              if (!nom) { toast("Entrez un item", "err"); return; }
              customItems.push({ nom, qte });
              st.set("customItems", customItems);
              render();
              toast("Item ajouté", "ok");
            } }, "＋ Ajouter"),
            el("button", { class: "ff-btn ghost", onClick: () => {
              const lines = Object.entries(cats).map(([cat, catItems]) => {
                const catLines = catItems.map(i => (checked[getKey(i)] ? "[x] " : "[ ] ") + i.nom + (i.qte > 1 ? " x" + i.qte : "")).join("\n");
                return cat + "\n" + catLines;
              }).join("\n\n");
              const text = "FreeForge Voyage — Checklist de " + jours + " jours (" + climat + ", " + type + ")\n\n" + lines;
              save("checklist-voyage.txt", text, "text/plain");
              toast("Checklist exportée", "ok");
            } }, "⬇️ Exporter"),
            el("button", { class: "ff-btn ghost", onClick: () => {
              checked = {};
              st.set("checked", checked);
              render();
              toast("Checklist réinitialisée", "ok");
            } }, "↺ Réinitialiser")
          ])
        ])
      );
    }

    root.append(out);
    render();
  }
});
