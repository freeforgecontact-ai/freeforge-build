/* Steam Backlog Manager — saisie manuelle ou import CSV/JSON, stats, persistance. */
FF.register({
  id: "steam", title: "Steam Backlog Manager", icon: "🎮", tag: "Biblio",
  desc: "Gère ta bibliothèque Steam : statuts, heures jouées, notes. Import CSV/JSON, saisie manuelle OK.",
  mount(root, ctx) {
    const { el, store, fmt, save, toast, clear } = ctx;
    const st = store("steam");

    const STATUTS = [
      { val: "ajouer", lbl: "À jouer", color: "#7ec3ee" },
      { val: "encours", lbl: "En cours", color: "#ffd23f" },
      { val: "fini", lbl: "Fini", color: "#22c55e" },
      { val: "abandonne", lbl: "Abandonné", color: "#f87171" }
    ];

    let games = st.get("games", [
      { id: 1, title: "Cyberpunk 2077", statut: "fini", heures: 120, note: 9, genre: "RPG" },
      { id: 2, title: "Elden Ring", statut: "encours", heures: 45, note: 10, genre: "Souls-like" },
      { id: 3, title: "Stardew Valley", statut: "ajouer", heures: 0, note: null, genre: "Simulation" },
      { id: 4, title: "Half-Life: Alyx", statut: "fini", heures: 12, note: 10, genre: "FPS/VR" }
    ]);
    let nextId = st.get("nextId", 5);
    let filterStatut = "all", sortKey = "title", sortDir = 1, search = "";
    let form = { title: "", statut: "ajouer", heures: "", note: "", genre: "" };
    let editId = null;

    function persist() { st.set("games", games); st.set("nextId", nextId); }

    function getStats() {
      const total = games.length;
      const totalH = games.reduce((a, g) => a + (+g.heures || 0), 0);
      const finis = games.filter(g => g.statut === "fini").length;
      const encours = games.filter(g => g.statut === "encours").length;
      const ajouer = games.filter(g => g.statut === "ajouer").length;
      const notesMoy = games.filter(g => g.note).length
        ? games.filter(g => g.note).reduce((a, g) => a + +g.note, 0) / games.filter(g => g.note).length : 0;
      return { total, totalH, finis, encours, ajouer, notesMoy };
    }

    function exportCSV() {
      const lines = ["Titre,Statut,Heures,Note,Genre",
        ...games.map(g => [g.title, g.statut, g.heures, g.note || "", g.genre].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","))
      ];
      save("steam-backlog.csv", lines.join("\n"), "text/csv");
    }

    function exportJSON() {
      save("steam-backlog.json", JSON.stringify(games, null, 2), "application/json");
    }

    function importData(text) {
      try {
        // Essaie JSON d'abord
        if (text.trimStart().startsWith("[")) {
          const arr = JSON.parse(text);
          let count = 0;
          arr.forEach(g => {
            if (g.title || g.name) {
              games.push({ id: nextId++, title: g.title || g.name, statut: g.statut || g.status || "ajouer", heures: +(g.heures || g.hours || g.playtime_forever || 0), note: g.note || null, genre: g.genre || "" });
              count++;
            }
          });
          persist(); toast(count + " jeux importés (JSON)", "ok"); render();
          return;
        }
        // CSV
        const lines = text.split("\n").filter(l => l.trim());
        const header = lines[0].toLowerCase().split(",").map(h => h.replace(/"/g, "").trim());
        let count = 0;
        lines.slice(1).forEach(line => {
          const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
          const get = (key) => { const i = header.indexOf(key); return i >= 0 ? cols[i] : ""; };
          const title = get("titre") || get("title") || get("name") || cols[0];
          if (!title) return;
          games.push({ id: nextId++, title, statut: get("statut") || get("status") || "ajouer", heures: +(get("heures") || get("hours") || 0), note: +(get("note")) || null, genre: get("genre") || "" });
          count++;
        });
        persist(); toast(count + " jeux importés (CSV)", "ok"); render();
      } catch (e) { toast("Erreur import : " + e.message, "err"); }
    }

    const out = el("div");
    function render() {
      clear(out);
      const stats = getStats();

      let visible = [...games];
      if (filterStatut !== "all") visible = visible.filter(g => g.statut === filterStatut);
      if (search.trim()) visible = visible.filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || (g.genre || "").toLowerCase().includes(search.toLowerCase()));
      visible.sort((a, b) => {
        let av = a[sortKey], bv = b[sortKey];
        if (sortKey === "heures" || sortKey === "note") { av = +av; bv = +bv; }
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
      });

      function thBtn(key, lbl) {
        return el("th", { style: { cursor: "pointer", userSelect: "none" }, onClick() { sortDir = sortKey === key ? -sortDir : 1; sortKey = key; render(); } },
          lbl + (sortKey === key ? (sortDir > 0 ? " ↑" : " ↓") : "")
        );
      }

      function statutBadge(val) {
        const s = STATUTS.find(x => x.val === val) || STATUTS[0];
        return el("span", { class: "ff-chip", style: { background: s.color + "33", borderColor: s.color, color: "#1f2937" } }, s.lbl);
      }

      out.append(
        el("div", { class: "ff-stats", style: { marginBottom: "18px" } }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, stats.total.toString()), el("div", { class: "k" }, "Jeux total")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, stats.totalH.toLocaleString("fr-CA") + " h"), el("div", { class: "k" }, "Heures jouées")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, stats.finis.toString()), el("div", { class: "k" }, "Finis")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, stats.encours.toString()), el("div", { class: "k" }, "En cours")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, stats.ajouer.toString()), el("div", { class: "k" }, "À jouer")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, stats.notesMoy ? stats.notesMoy.toFixed(1) + " / 10" : "—"), el("div", { class: "k" }, "Note moy.")])
        ]),

        el("div", { class: "ff-panel" }, [
          el("h2", editId ? "✏️ Modifier" : "➕ Ajouter un jeu"),
          el("div", { class: "ff-note" }, "Saisie manuelle (l'accès à l'API Steam nécessite un réseau — cet outil est 100 % local)."),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [el("label", "Titre du jeu"), el("input", { class: "ff-input", placeholder: "ex: Elden Ring", value: form.title, onInput(e) { form.title = e.target.value; } })]),
              el("div", { class: "ff-field" }, [el("label", "Genre"), el("input", { class: "ff-input", placeholder: "ex: RPG, FPS, Simulation…", value: form.genre, onInput(e) { form.genre = e.target.value; } })])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Statut"),
                el("select", { class: "ff-select", onChange(e) { form.statut = e.target.value; } },
                  STATUTS.map(s => el("option", { value: s.val, selected: form.statut === s.val }, s.lbl))
                )
              ]),
              el("div", { class: "ff-field" }, [el("label", "Heures jouées"), el("input", { class: "ff-input", type: "number", min: "0", placeholder: "0", value: form.heures, onInput(e) { form.heures = e.target.value; } })]),
              el("div", { class: "ff-field" }, [el("label", "Note /10 (optionnel)"), el("input", { class: "ff-input", type: "number", min: "0", max: "10", step: "0.5", placeholder: "—", value: form.note, onInput(e) { form.note = e.target.value; } })])
            ])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick() {
              if (!form.title.trim()) { toast("Entre le titre du jeu", "err"); return; }
              const entry = { id: editId || nextId, title: form.title.trim(), statut: form.statut, heures: +(form.heures) || 0, note: form.note ? +(form.note) : null, genre: form.genre.trim() };
              if (editId) {
                const idx = games.findIndex(g => g.id === editId);
                if (idx >= 0) games[idx] = entry;
                editId = null;
              } else {
                nextId++;
                games.unshift(entry);
              }
              form = { title: "", statut: "ajouer", heures: "", note: "", genre: "" };
              persist(); toast("Sauvegardé !", "ok"); render();
            } }, editId ? "💾 Sauvegarder" : "➕ Ajouter"),
            editId ? el("button", { class: "ff-btn ghost", onClick() { editId = null; form = { title: "", statut: "ajouer", heures: "", note: "", genre: "" }; render(); } }, "Annuler") : null,
            el("button", { class: "ff-btn ghost", onClick() {
              const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".csv,.json";
              inp.onchange = async () => {
                const file = inp.files[0]; if (!file) return;
                const text = await file.text(); importData(text);
              };
              inp.click();
            } }, "📂 Import CSV/JSON"),
            el("button", { class: "ff-btn ghost", onClick: exportCSV }, "⬇️ Export CSV"),
            el("button", { class: "ff-btn ghost", onClick: exportJSON }, "⬇️ Export JSON")
          ])
        ]),

        el("div", { class: "ff-panel" }, [
          el("h2", "Ma bibliothèque (" + visible.length + " / " + games.length + ")"),
          el("div", { class: "ff-row", style: { marginBottom: "10px" } }, [
            el("div", { class: "ff-col" }, [
              el("input", { class: "ff-input", type: "search", placeholder: "Recherche titre ou genre…", value: search,
                onInput(e) { search = e.target.value; render(); } })
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-seg" }, [
                el("button", { class: filterStatut === "all" ? "on" : "", onClick() { filterStatut = "all"; render(); } }, "Tous"),
                ...STATUTS.map(s => el("button", { class: filterStatut === s.val ? "on" : "", onClick() { filterStatut = s.val; render(); } }, s.lbl))
              ])
            ])
          ]),
          visible.length ? el("div", { style: { overflowX: "auto" } }, el("table", { class: "ff-table" }, [
            el("tr", [thBtn("title", "Titre"), el("th", "Statut"), thBtn("genre", "Genre"), thBtn("heures", "Heures"), thBtn("note", "Note"), el("th", "")]),
            ...visible.map(g => el("tr", [
              el("td", { style: { fontWeight: "700" } }, g.title),
              el("td", statutBadge(g.statut)),
              el("td", g.genre || "—"),
              el("td", { class: "num" }, g.heures ? g.heures.toLocaleString("fr-CA") + " h" : "—"),
              el("td", { class: "num" }, g.note ? g.note + " / 10" : "—"),
              el("td", el("div", { style: { display: "flex", gap: "4px" } }, [
                el("button", { class: "ff-btn sm ghost", onClick() {
                  editId = g.id; form = { title: g.title, statut: g.statut, heures: String(g.heures || ""), note: g.note ? String(g.note) : "", genre: g.genre || "" };
                  out.scrollIntoView({ behavior: "smooth" }); render();
                } }, "✏️"),
                el("button", { class: "ff-btn sm ghost", onClick() { games = games.filter(x => x.id !== g.id); persist(); render(); } }, "✕")
              ]))
            ]))
          ])) : el("div", { class: "ff-empty" }, "Aucun jeu pour ce filtre.")
        ])
      );
    }
    root.append(out); render();
  }
});
