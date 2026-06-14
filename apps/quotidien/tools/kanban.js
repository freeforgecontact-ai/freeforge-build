/* Kanban Task Board — colonnes éditables, drag-and-drop HTML5 + flèches, persistance. */
FF.register({
  id: "kanban", title: "Kanban Task Board", icon: "📋", tag: "Tâches",
  desc: "Colonnes éditables, cartes glissables entre colonnes ou déplaçables avec flèches.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("kanban");
    let cols = st.get("cols", [
      { id: 1, name: "À faire", color: "#ef4444" },
      { id: 2, name: "En cours", color: "#f97316" },
      { id: 3, name: "Fait", color: "#22c55e" }
    ]);
    let cards = st.get("cards", [
      { id: 1, col: 1, text: "Créer un plan de projet", note: "" },
      { id: 2, col: 2, text: "Réviser le rapport mensuel", note: "" },
      { id: 3, col: 3, text: "Mettre à jour le CV", note: "" }
    ]);
    let nextColId = st.get("nextColId", 4);
    let nextCardId = st.get("nextCardId", 4);
    let dragCardId = null;
    const out = el("div");

    function persist() {
      st.set("cols", cols);
      st.set("cards", cards);
      st.set("nextColId", nextColId);
      st.set("nextCardId", nextCardId);
    }

    function editModal(card) {
      const overlay = el("div", { style: { position: "fixed", inset: "0", background: "rgba(10,53,89,.7)", zIndex: "100", display: "flex", alignItems: "center", justifyContent: "center" } });
      const textInp = el("textarea", { class: "ff-input", rows: 3, value: card.text, style: { marginBottom: "8px" } });
      const noteInp = el("textarea", { class: "ff-input", rows: 2, value: card.note || "", placeholder: "Note optionnelle…" });
      const modal = el("div", { style: { background: "#fff", border: "3px solid var(--pg-navy)", borderRadius: "16px", padding: "24px", width: "340px", boxShadow: "6px 7px 0 rgba(10,53,89,.85)" } }, [
        el("h3", { style: { margin: "0 0 12px", color: "var(--pg-navy)" } }, "Modifier la carte"),
        el("div", { class: "ff-field" }, [el("label", "Texte"), textInp]),
        el("div", { class: "ff-field" }, [el("label", "Note"), noteInp]),
        el("div", { style: { display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "12px" } }, [
          el("button", { class: "ff-btn sm ghost", onClick: () => overlay.remove() }, "Annuler"),
          el("button", { class: "ff-btn sm", style: { background: "var(--pg-err)", border: "none", color: "#fff" }, onClick: () => {
            cards = cards.filter(c => c.id !== card.id);
            persist(); render(); overlay.remove();
          }}, "🗑 Supprimer"),
          el("button", { class: "ff-btn sm primary", onClick: () => {
            card.text = textInp.value.trim() || card.text;
            card.note = noteInp.value.trim();
            persist(); render(); overlay.remove();
          }}, "💾 Enregistrer")
        ])
      ]);
      overlay.append(modal);
      document.body.append(overlay);
    }

    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel", style: { marginBottom: "0" } }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" } }, [
            el("h2", { style: { margin: 0 } }, "Tableau Kanban"),
            el("div", { class: "ff-btns", style: { margin: 0 } }, [
              el("button", { class: "ff-btn sm primary", onClick: () => {
                const name = prompt("Nom de la colonne :");
                if (!name) return;
                cols.push({ id: nextColId, name, color: "#0f4c81" });
                nextColId++;
                persist(); render();
              }}, "＋ Colonne")
            ])
          ])
        ]),
        el("div", { style: { display: "flex", gap: "14px", overflowX: "auto", paddingTop: "14px", paddingBottom: "10px", alignItems: "flex-start" } },
          cols.map((col, ci) => {
            const colCards = cards.filter(c => c.col === col.id);
            const addInp = el("input", { class: "ff-input", placeholder: "Nouvelle carte…", style: { marginBottom: "8px" } });
            addInp.addEventListener("keydown", e => {
              if (e.key === "Enter" && addInp.value.trim()) {
                cards.push({ id: nextCardId, col: col.id, text: addInp.value.trim(), note: "" });
                nextCardId++;
                persist(); render();
              }
            });

            const colEl = el("div", {
              style: { minWidth: "240px", maxWidth: "280px", background: "#fff", border: "3px solid var(--pg-navy)", borderRadius: "14px", padding: "12px", boxShadow: "4px 5px 0 rgba(10,53,89,.7)", flexShrink: "0" },
              draggable: false
            });

            colEl.addEventListener("dragover", e => { e.preventDefault(); colEl.style.outline = "3px dashed var(--pg-yel)"; });
            colEl.addEventListener("dragleave", () => { colEl.style.outline = ""; });
            colEl.addEventListener("drop", e => {
              e.preventDefault();
              colEl.style.outline = "";
              if (dragCardId !== null) {
                const card = cards.find(c => c.id === dragCardId);
                if (card) { card.col = col.id; persist(); render(); }
              }
            });

            const cardEls = colCards.map((card, idx) => {
              const cardEl = el("div", {
                draggable: true,
                style: { background: "var(--pg-pale)", border: "2px solid var(--pg-navy)", borderRadius: "10px", padding: "10px 10px 8px", marginBottom: "8px", cursor: "grab", position: "relative" }
              }, [
                el("div", { style: { fontWeight: "700", fontSize: ".95rem", marginBottom: "4px" } }, card.text),
                card.note ? el("div", { style: { fontSize: ".8rem", color: "var(--pg-mut)" } }, card.note) : null,
                el("div", { style: { display: "flex", gap: "4px", marginTop: "6px", justifyContent: "space-between", alignItems: "center" } }, [
                  el("div", { style: { display: "flex", gap: "4px" } }, [
                    ci > 0 ? el("button", { class: "ff-btn sm ghost", title: "Déplacer à gauche", onClick: () => {
                      card.col = cols[ci - 1].id; persist(); render();
                    }}, "←") : null,
                    ci < cols.length - 1 ? el("button", { class: "ff-btn sm ghost", title: "Déplacer à droite", onClick: () => {
                      card.col = cols[ci + 1].id; persist(); render();
                    }}, "→") : null
                  ]),
                  el("button", { class: "ff-btn sm ghost", onClick: () => editModal(card) }, "✏️")
                ])
              ]);
              cardEl.addEventListener("dragstart", e => {
                dragCardId = card.id;
                e.dataTransfer.effectAllowed = "move";
                cardEl.style.opacity = ".5";
              });
              cardEl.addEventListener("dragend", () => {
                dragCardId = null;
                cardEl.style.opacity = "1";
              });
              return cardEl;
            });

            const colNameEl = el("div", {
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }
            }, [
              el("div", { style: { display: "flex", alignItems: "center", gap: "7px" } }, [
                el("span", { style: { width: "12px", height: "12px", borderRadius: "50%", background: col.color, display: "inline-block" } }),
                el("span", { style: { fontWeight: "800", color: "var(--pg-navy)" } }, col.name + " (" + colCards.length + ")")
              ]),
              el("div", { style: { display: "flex", gap: "4px" } }, [
                el("button", { class: "ff-btn sm ghost", title: "Renommer", onClick: () => {
                  const n = prompt("Nouveau nom :", col.name);
                  if (n) { col.name = n; persist(); render(); }
                }}, "✏️"),
                el("button", { class: "ff-btn sm ghost", title: "Supprimer la colonne", onClick: () => {
                  if (!confirm("Supprimer la colonne « " + col.name + " » et ses cartes ?")) return;
                  cols = cols.filter(c => c.id !== col.id);
                  cards = cards.filter(c => c.col !== col.id);
                  persist(); render();
                }}, "✕")
              ])
            ]);

            ctx.clear(colEl);
            colEl.append(colNameEl);
            cardEls.forEach(c => colEl.append(c));
            colEl.append(addInp, el("div", { style: { fontSize: ".78rem", color: "var(--pg-mut)", marginTop: "2px" } }, "↵ Entrée pour ajouter"));
            return colEl;
          })
        )
      );
    }
    root.append(out);
    render();
  }
});
