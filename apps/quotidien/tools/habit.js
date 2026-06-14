/* Habit Tracker Grid — grille 30 jours, streak, persistance. */
FF.register({
  id: "habit", title: "Habit Tracker Grid", icon: "✅", tag: "Habitudes",
  desc: "Grille 30 jours pour tes habitudes. Série (streak) calculée automatiquement.",
  mount(root, ctx) {
    const { el, store, fmt, toast } = ctx;
    const st = store("habit");
    let habits = st.get("habits", [
      { id: 1, name: "Exercice", color: "#4ade80" },
      { id: 2, name: "Lecture", color: "#60a5fa" },
      { id: 3, name: "Méditation", color: "#f97316" }
    ]);
    let checks = st.get("checks", {});
    let nextId = st.get("nextId", 4);
    const out = el("div");

    function persist() {
      st.set("habits", habits);
      st.set("checks", checks);
      st.set("nextId", nextId);
    }

    function getLast30() {
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      return days;
    }

    function streak(habitId) {
      const today = new Date().toISOString().slice(0, 10);
      let count = 0;
      let d = new Date();
      while (true) {
        const key = d.toISOString().slice(0, 10);
        if (!checks[habitId + ":" + key]) break;
        count++;
        d.setDate(d.getDate() - 1);
        if (count > 365) break;
      }
      return count;
    }

    function render() {
      ctx.clear(out);
      const days = getLast30();
      const dayLabels = days.map(d => {
        const dt = new Date(d + "T12:00:00");
        return dt.toLocaleDateString("fr-CA", { day: "numeric" });
      });
      const monthLabel = new Date().toLocaleDateString("fr-CA", { month: "long", year: "numeric" });

      const nameInp = el("input", { class: "ff-input", placeholder: "Nom de l'habitude…", style: { maxWidth: "240px" } });
      const colorPicker = el("input", { type: "color", value: "#0f4c81", style: { width: "48px", height: "38px", border: "2px solid var(--pg-navy)", borderRadius: "8px", cursor: "pointer", padding: "2px" } });

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" } }, [
            el("h2", { style: { margin: 0 } }, "Mes habitudes — " + monthLabel),
            el("div", { class: "ff-stats", style: { gap: "8px" } }, [
              el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(habits.length)), el("div", { class: "k" }, "Habitudes")])
            ])
          ]),
          el("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" } }, [
            nameInp, colorPicker,
            el("button", { class: "ff-btn primary", onClick: () => {
              const name = nameInp.value.trim();
              if (!name) { toast("Entre un nom d'habitude", "err"); return; }
              habits.push({ id: nextId, name, color: colorPicker.value });
              nextId++;
              persist();
              render();
              toast("Habitude ajoutée", "ok");
            }}, "＋ Ajouter")
          ]),
          habits.length === 0
            ? el("div", { class: "ff-empty" }, "Ajoute ta première habitude ci-dessus.")
            : el("div", { style: { overflowX: "auto" } }, [
              el("table", { class: "ff-table", style: { minWidth: "600px", tableLayout: "fixed" } }, [
                el("thead", el("tr", [
                  el("th", { style: { width: "140px", textAlign: "left" } }, "Habitude"),
                  el("th", { style: { width: "60px", textAlign: "center" } }, "🔥"),
                  ...days.map((d, i) => {
                    const isToday = d === new Date().toISOString().slice(0, 10);
                    return el("th", { style: { width: "26px", textAlign: "center", padding: "4px 2px", fontSize: ".72rem", fontWeight: isToday ? "900" : "700", color: isToday ? "var(--pg-org)" : "var(--pg-navy)", background: isToday ? "var(--pg-pale)" : "" } }, dayLabels[i]);
                  }),
                  el("th", { style: { width: "44px" } }, "")
                ])),
                el("tbody", habits.map(h => {
                  const s = streak(h.id);
                  return el("tr", [
                    el("td", el("div", { style: { display: "flex", alignItems: "center", gap: "6px" } }, [
                      el("span", { style: { width: "12px", height: "12px", borderRadius: "50%", background: h.color, display: "inline-block", flexShrink: "0" } }),
                      el("span", { style: { fontWeight: "700", fontSize: ".9rem" } }, h.name)
                    ])),
                    el("td", { style: { textAlign: "center" } }, [
                      el("span", { style: { fontWeight: "800", color: s > 0 ? "var(--pg-org)" : "var(--pg-mut)" } }, s > 0 ? s + "🔥" : "—")
                    ]),
                    ...days.map(d => {
                      const key = h.id + ":" + d;
                      const checked = !!checks[key];
                      const isToday = d === new Date().toISOString().slice(0, 10);
                      const box = el("div", {
                        style: {
                          width: "22px", height: "22px", borderRadius: "6px", margin: "0 auto",
                          cursor: "pointer", border: "2px solid " + (checked ? h.color : "var(--pg-sky2)"),
                          background: checked ? h.color : (isToday ? "#fffbeb" : "transparent"),
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", transition: "all .1s"
                        },
                        onClick: () => {
                          if (checks[key]) delete checks[key];
                          else checks[key] = 1;
                          persist();
                          render();
                        }
                      }, checked ? "✓" : "");
                      return el("td", { style: { textAlign: "center", padding: "4px 2px" } }, box);
                    }),
                    el("td", el("button", { class: "ff-btn sm ghost", title: "Supprimer", onClick: () => {
                      if (!confirm("Supprimer « " + h.name + " » ?")) return;
                      habits = habits.filter(x => x.id !== h.id);
                      Object.keys(checks).filter(k => k.startsWith(h.id + ":")).forEach(k => delete checks[k]);
                      persist(); render();
                    }}, "✕"))
                  ]);
                }))
              ])
            ])
        ]),
        el("div", { class: "ff-panel" }, [
          el("h2", "Résumé"),
          el("div", { class: "ff-stats" }, habits.map(h => {
            const s = streak(h.id);
            const total = getLast30().filter(d => checks[h.id + ":" + d]).length;
            const pct = Math.round(total / 30 * 100);
            return el("div", { class: "ff-stat" }, [
              el("div", { class: "v", style: { color: h.color } }, pct + "%"),
              el("div", { class: "k" }, h.name + " (" + s + "🔥)")
            ]);
          }))
        ])
      );
    }
    root.append(out);
    render();
  }
});
