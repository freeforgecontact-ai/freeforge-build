/* Packing List Optimizer — catégories, cocher, progression, persistance. */
FF.register({
  id: "packing", title: "Packing List Optimizer", icon: "🎒", tag: "Bagages",
  desc: "Liste de bagages par catégories. Cochez les items, ajoutez vos propres catégories.",
  mount(root, ctx) {
    const { el, store, toast, save } = ctx;
    const st = store("packing");

    const DEF_CATS = [
      { id: "vetements", nom: "Vêtements", items: [
        { nom: "T-shirts", fait: false }, { nom: "Pantalons", fait: false }, { nom: "Sous-vêtements", fait: false },
        { nom: "Chaussettes", fait: false }, { nom: "Chaussures (marche)", fait: false }, { nom: "Veste / manteau", fait: false },
        { nom: "Pyjama", fait: false }, { nom: "Tenue de soirée", fait: false }
      ]},
      { id: "toilette", nom: "Toilette", items: [
        { nom: "Brosse à dents", fait: false }, { nom: "Dentifrice", fait: false }, { nom: "Déodorant", fait: false },
        { nom: "Shampoing", fait: false }, { nom: "Savon / gel douche", fait: false }, { nom: "Rasoir", fait: false },
        { nom: "Serviette", fait: false }, { nom: "Trousse de maquillage", fait: false }
      ]},
      { id: "electronique", nom: "Électronique", items: [
        { nom: "Téléphone", fait: false }, { nom: "Chargeur téléphone", fait: false }, { nom: "Power bank", fait: false },
        { nom: "Écouteurs", fait: false }, { nom: "Adaptateur de prise", fait: false }, { nom: "Appareil photo", fait: false }
      ]},
      { id: "documents", nom: "Documents", items: [
        { nom: "Passeport / CI", fait: false }, { nom: "Billet avion / train", fait: false },
        { nom: "Réservations hôtel", fait: false }, { nom: "Assurance voyage", fait: false },
        { nom: "Carte de crédit / débit", fait: false }, { nom: "Copie numérique des docs", fait: false }
      ]}
    ];

    let cats = st.get("cats", JSON.parse(JSON.stringify(DEF_CATS)));
    const out = el("div");

    function persist() { st.set("cats", cats); }

    function totalItems() { return cats.reduce((a, c) => a + c.items.length, 0); }
    function doneItems() { return cats.reduce((a, c) => a + c.items.filter(i => i.fait).length, 0); }
    function pct() { const t = totalItems(); return t ? Math.round(doneItems() / t * 100) : 0; }

    function render() {
      ctx.clear(out);
      const p = pct();
      const done = doneItems();
      const total = totalItems();

      out.append(
        // Barre de progression globale
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-row", style: { alignItems: "center" } }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-result" }, [
                el("div", { class: "lbl" }, "Progression"),
                el("div", { class: "big" }, p + " %"),
                el("div", { style: { color: "var(--pg-sky2)", fontSize: ".9rem", marginTop: "4px" } }, done + " / " + total + " items prêts")
              ])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-stats" }, cats.map(c => {
                const catDone = c.items.filter(i => i.fait).length;
                const catTotal = c.items.length;
                const catPct = catTotal ? Math.round(catDone / catTotal * 100) : 0;
                return el("div", { class: "ff-stat" }, [
                  el("div", { class: "v" }, catPct + "%"),
                  el("div", { class: "k" }, c.nom)
                ]);
              }))
            ])
          ]),
          el("div", { style: { background: "var(--pg-pale)", border: "2.5px solid var(--pg-navy)", borderRadius: "999px", height: "12px", marginTop: "12px", overflow: "hidden" } }, [
            el("div", { style: { width: p + "%", height: "100%", background: p === 100 ? "var(--pg-ok)" : "var(--pg-blue)", borderRadius: "999px", transition: "width .3s" } })
          ]),
          el("div", { class: "ff-btns", style: { marginTop: "12px" } }, [
            el("button", { class: "ff-btn ghost", onClick: () => {
              cats.forEach(c => c.items.forEach(i => i.fait = true));
              persist();
              render();
              toast("Tout coché !", "ok");
            } }, "✓ Tout cocher"),
            el("button", { class: "ff-btn ghost", onClick: () => {
              cats.forEach(c => c.items.forEach(i => i.fait = false));
              persist();
              render();
              toast("Réinitialisé", "ok");
            } }, "↺ Tout décocher"),
            el("button", { class: "ff-btn ghost", onClick: () => {
              const lignes = cats.map(c => {
                const itemLignes = c.items.map(i => (i.fait ? "[x] " : "[ ] ") + i.nom).join("\n");
                return c.nom + "\n" + itemLignes;
              }).join("\n\n");
              save("packing-list.txt", "FreeForge Voyage — Packing List\n\n" + lignes, "text/plain");
              toast("Exporté", "ok");
            } }, "⬇️ Exporter"),
            el("button", { class: "ff-btn ghost", onClick: () => {
              if (confirm("Remettre la liste à zéro (valeurs par défaut) ?")) {
                cats = JSON.parse(JSON.stringify(DEF_CATS));
                persist();
                render();
                toast("Liste remise à zéro", "ok");
              }
            } }, "🔄 Réinitialiser")
          ])
        ]),
        // Catégories
        ...cats.map((cat, ci) =>
          el("div", { class: "ff-panel" }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" } }, [
              el("h2", { style: { margin: 0 } }, cat.nom + " (" + cat.items.filter(i => i.fait).length + "/" + cat.items.length + ")"),
              el("div", {}, [
                el("button", { class: "ff-btn sm ghost", onClick: () => {
                  const nom = prompt("Nom de la nouvelle catégorie :");
                  if (!nom) return;
                  cats.push({ id: "cat-" + Date.now(), nom, items: [] });
                  persist();
                  render();
                  toast("Catégorie ajoutée", "ok");
                } }, ci === 0 ? "＋ Catégorie" : null),
                cats.length > 1 ? el("button", { class: "ff-btn sm ghost", style: { marginLeft: "4px" }, onClick: () => {
                  if (confirm("Supprimer la catégorie « " + cat.nom + " » ?")) {
                    cats.splice(ci, 1);
                    persist();
                    render();
                  }
                } }, "✕") : null
              ])
            ]),
            el("div", {}, cat.items.map((item, ii) =>
              el("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", borderBottom: "1px solid var(--pg-sky2)" } }, [
                el("input", { type: "checkbox", checked: item.fait, style: { width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--pg-blue)" },
                  onChange: (e) => { item.fait = e.target.checked; persist(); render(); } }),
                el("span", { style: { flex: 1, textDecoration: item.fait ? "line-through" : "none", color: item.fait ? "var(--pg-mut)" : "var(--pg-ink)" } }, item.nom),
                el("button", { class: "ff-btn sm ghost", style: { padding: "2px 8px" }, onClick: () => {
                  cat.items.splice(ii, 1);
                  persist();
                  render();
                } }, "✕")
              ])
            )),
            el("div", { style: { marginTop: "10px", display: "flex", gap: "8px" } }, [
              el("input", { class: "ff-input", id: "pack-new-" + ci, type: "text", placeholder: "Nouvel item...", style: { flex: 1 },
                onKeydown: (e) => {
                  if (e.key === "Enter") {
                    const inp = root.querySelector("#pack-new-" + ci);
                    const nom = inp ? inp.value.trim() : "";
                    if (!nom) return;
                    cat.items.push({ nom, fait: false });
                    persist();
                    render();
                  }
                }
              }),
              el("button", { class: "ff-btn sm primary", onClick: () => {
                const inp = root.querySelector("#pack-new-" + ci);
                const nom = inp ? inp.value.trim() : "";
                if (!nom) { toast("Entrez un item", "err"); return; }
                cat.items.push({ nom, fait: false });
                persist();
                render();
                toast("Item ajouté", "ok");
              } }, "＋")
            ])
          ])
        ),
        // Bouton ajouter catégorie en bas
        el("div", { style: { textAlign: "center" } }, [
          el("button", { class: "ff-btn primary", onClick: () => {
            const nom = prompt("Nom de la nouvelle catégorie :");
            if (!nom) return;
            cats.push({ id: "cat-" + Date.now(), nom, items: [] });
            persist();
            render();
            toast("Catégorie ajoutée", "ok");
          } }, "＋ Nouvelle catégorie")
        ])
      );
    }

    root.append(out);
    render();
  }
});
