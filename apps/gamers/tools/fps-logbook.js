/* FPS & Hardware Logbook — journal de performances par jeu/GPU/CPU. */
FF.register({
  id: "fps-logbook", title: "FPS & Hardware Logbook", icon: "📊", tag: "Perf",
  desc: "Journalise tes FPS par jeu, GPU, CPU et réglages. Statistiques et tri intégrés.",
  mount(root, ctx) {
    const { el, store, fmt, save, toast, clear } = ctx;
    const st = store("fps-logbook");

    let entries = st.get("entries", [
      { id: 1, game: "CS2", gpu: "RTX 3070", cpu: "Ryzen 5 5600X", settings: "High 1080p", fps: 250, date: "2025-01-10", notes: "Stable, drops rares" },
      { id: 2, game: "Cyberpunk 2077", gpu: "RTX 3070", cpu: "Ryzen 5 5600X", settings: "Ultra RT 1440p", fps: 48, date: "2025-01-12", notes: "DLSS Quality activé" },
      { id: 3, game: "Valorant", gpu: "RTX 3070", cpu: "Ryzen 5 5600X", settings: "Low 1080p", fps: 400, date: "2025-01-15", notes: "Sans limiter" }
    ]);
    let nextId = st.get("nextId", 4);
    let sortKey = "date", sortDir = 1, filter = "";
    let form = { game: "", gpu: "", cpu: "", settings: "", fps: "", date: new Date().toISOString().slice(0, 10), notes: "" };
    let editId = null;

    function persist() { st.set("entries", entries); st.set("nextId", nextId); }

    function stats() {
      const byGame = {};
      entries.forEach(e => {
        if (!byGame[e.game]) byGame[e.game] = [];
        byGame[e.game].push(+e.fps);
      });
      return Object.entries(byGame).map(([g, fps]) => {
        const avg = fps.reduce((a, b) => a + b, 0) / fps.length;
        return { game: g, avg: Math.round(avg), min: Math.min(...fps), max: Math.max(...fps), count: fps.length };
      }).sort((a, b) => b.count - a.count);
    }

    const out = el("div");
    function render() {
      clear(out);
      let visible = entries.filter(e =>
        !filter || [e.game, e.gpu, e.cpu, e.settings, e.notes].join(" ").toLowerCase().includes(filter.toLowerCase())
      );
      visible = [...visible].sort((a, b) => {
        const av = sortKey === "fps" ? +a[sortKey] : a[sortKey];
        const bv = sortKey === "fps" ? +b[sortKey] : b[sortKey];
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
      });

      function thBtn(key, lbl) {
        return el("th", { style: { cursor: "pointer", userSelect: "none" }, onClick() { sortDir = sortKey === key ? -sortDir : 1; sortKey = key; render(); } },
          lbl + (sortKey === key ? (sortDir > 0 ? " ↑" : " ↓") : "")
        );
      }

      function fieldEl(label, key, type) {
        return el("div", { class: "ff-field" }, [
          el("label", label),
          el("input", {
            class: "ff-input", type: type || "text", value: form[key], placeholder: label,
            onInput(e) { form[key] = e.target.value; }
          })
        ]);
      }

      const statsData = stats();

      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", editId ? "✏️ Modifier l'entrée" : "➕ Nouvelle entrée"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [fieldEl("Jeu", "game"), fieldEl("GPU", "gpu"), fieldEl("CPU", "cpu")]),
            el("div", { class: "ff-col" }, [fieldEl("Réglages", "settings"), fieldEl("FPS moyen", "fps", "number"), fieldEl("Date", "date", "date"), fieldEl("Notes", "notes")])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick() {
              if (!form.game.trim()) { toast("Remplis le nom du jeu", "err"); return; }
              if (editId) {
                const idx = entries.findIndex(e => e.id === editId);
                if (idx >= 0) entries[idx] = Object.assign({ id: editId }, form, { fps: +form.fps });
                editId = null;
              } else {
                entries.unshift(Object.assign({ id: nextId++ }, form, { fps: +form.fps }));
              }
              form = { game: "", gpu: "", cpu: "", settings: "", fps: "", date: new Date().toISOString().slice(0, 10), notes: "" };
              persist(); render();
              toast(editId ? "Modifié !" : "Ajouté !", "ok");
            } }, editId ? "💾 Sauvegarder" : "➕ Ajouter"),
            editId ? el("button", { class: "ff-btn ghost", onClick() { editId = null; form = { game: "", gpu: "", cpu: "", settings: "", fps: "", date: new Date().toISOString().slice(0, 10), notes: "" }; render(); } }, "Annuler") : null,
            el("button", { class: "ff-btn ghost", onClick() {
              const csv = ["Jeu,GPU,CPU,Réglages,FPS,Date,Notes",
                ...entries.map(e => [e.game, e.gpu, e.cpu, e.settings, e.fps, e.date, e.notes].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","))
              ].join("\n");
              save("fps-logbook.csv", csv, "text/csv");
            } }, "⬇️ Export CSV")
          ])
        ]),
        entries.length ? el("div", { class: "ff-panel" }, [
          el("h2", "Statistiques par jeu"),
          el("div", { class: "ff-stats" }, statsData.slice(0, 6).map(s =>
            el("div", { class: "ff-stat" }, [
              el("div", { class: "v" }, s.avg + " FPS"),
              el("div", { class: "k" }, s.game + " (" + s.count + " entrée" + (s.count > 1 ? "s" : "") + ")")
            ])
          ))
        ]) : null,
        el("div", { class: "ff-panel" }, [
          el("h2", "Journal (" + visible.length + " / " + entries.length + ")"),
          el("div", { class: "ff-field" }, [
            el("label", "Recherche"),
            el("input", { class: "ff-input", type: "search", placeholder: "Jeu, GPU, CPU, réglages…", value: filter,
              onInput(e) { filter = e.target.value; render(); } })
          ]),
          visible.length ? el("div", { style: { overflowX: "auto" } }, el("table", { class: "ff-table" }, [
            el("tr", [thBtn("game", "Jeu"), thBtn("gpu", "GPU"), thBtn("cpu", "CPU"), el("th", "Réglages"), thBtn("fps", "FPS"), thBtn("date", "Date"), el("th", "Notes"), el("th", "")]),
            ...visible.map(e => el("tr", [
              el("td", e.game), el("td", e.gpu), el("td", e.cpu), el("td", e.settings),
              el("td", { class: "num", style: { fontWeight: "700", color: +e.fps >= 144 ? "var(--pg-ok)" : +e.fps >= 60 ? "var(--pg-blue)" : "var(--pg-err)" } }, String(+e.fps)),
              el("td", e.date), el("td", { style: { maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, e.notes || "—"),
              el("td", el("div", { style: { display: "flex", gap: "4px" } }, [
                el("button", { class: "ff-btn sm ghost", onClick() {
                  editId = e.id; form = Object.assign({}, e, { fps: String(e.fps) }); render();
                } }, "✏️"),
                el("button", { class: "ff-btn sm ghost", onClick() {
                  entries = entries.filter(x => x.id !== e.id); persist(); render();
                } }, "✕")
              ]))
            ]))
          ])) : el("div", { class: "ff-empty" }, "Aucune entrée. Commence à journaliser tes perfs !")
        ])
      );
    }
    root.append(out); render();
  }
});
