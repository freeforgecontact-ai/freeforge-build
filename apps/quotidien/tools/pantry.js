/* Pantry & Expiration Tracker — articles, dates péremption, alertes colorées, persistance. */
FF.register({
  id: "pantry", title: "Pantry & Expiration Tracker", icon: "🗄️", tag: "Cuisine",
  desc: "Articles de garde-manger avec dates de péremption. Alertes couleur proximité.",
  mount(root, ctx) {
    const { el, store, toast, save } = ctx;
    const st = store("pantry");
    const out = el("div");

    let items = st.get("items", [
      { id: 1, name: "Lait 2%", qty: "1 carton", exp: addDays(3) },
      { id: 2, name: "Yogourt grec", qty: "500g", exp: addDays(7) },
      { id: 3, name: "Poulet haché", qty: "400g", exp: addDays(-1) },
      { id: 4, name: "Fromage cheddar", qty: "200g", exp: addDays(14) },
      { id: 5, name: "Farine tout usage", qty: "1 kg", exp: addDays(180) },
      { id: 6, name: "Haricots en conserve", qty: "2 boîtes", exp: addDays(365) }
    ]);
    let nextId = st.get("nextId", 7);
    let sortBy = st.get("sortBy", "exp");
    let filter = st.get("filter", "all");

    function addDays(n) {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    }

    function persist() {
      st.set("items", items);
      st.set("nextId", nextId);
      st.set("sortBy", sortBy);
      st.set("filter", filter);
    }

    function daysUntil(dateStr) {
      if (!dateStr) return 9999;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(dateStr + "T00:00:00");
      return Math.round((exp - today) / (1000 * 60 * 60 * 24));
    }

    function statusOf(item) {
      const d = daysUntil(item.exp);
      if (d < 0) return { label: "Périmé", color: "#b91c1c", bg: "#fee2e2", icon: "🚫" };
      if (d === 0) return { label: "Expire aujourd'hui", color: "#c2410c", bg: "#ffedd5", icon: "⚠️" };
      if (d <= 3) return { label: "Bientôt (" + d + "j)", color: "#d97706", bg: "#fef3c7", icon: "⏳" };
      if (d <= 7) return { label: d + " jours", color: "#0f4c81", bg: "#eff6ff", icon: "📅" };
      return { label: d + " jours", color: "var(--pg-ok)", bg: "#f0fdf4", icon: "✅" };
    }

    function sortItems(list) {
      return [...list].sort((a, b) => {
        if (sortBy === "exp") return daysUntil(a.exp) - daysUntil(b.exp);
        if (sortBy === "name") return a.name.localeCompare(b.name, "fr-CA");
        return 0;
      });
    }

    function filterItems(list) {
      if (filter === "expired") return list.filter(i => daysUntil(i.exp) < 0);
      if (filter === "soon") return list.filter(i => { const d = daysUntil(i.exp); return d >= 0 && d <= 7; });
      if (filter === "ok") return list.filter(i => daysUntil(i.exp) > 7);
      return list;
    }

    function render() {
      ctx.clear(out);
      const sorted = sortItems(filterItems(items));
      const expCount = items.filter(i => daysUntil(i.exp) < 0).length;
      const soonCount = items.filter(i => { const d = daysUntil(i.exp); return d >= 0 && d <= 7; }).length;

      const nameInp = el("input", { class: "ff-input", placeholder: "Nom de l'article…", style: { flex: "2", minWidth: "140px" } });
      const qtyInp = el("input", { class: "ff-input", placeholder: "Quantité (ex: 1 kg)", style: { flex: "1", minWidth: "100px" } });
      const expInp = el("input", { class: "ff-input", type: "date", value: addDays(7), style: { flex: "1", minWidth: "130px" } });

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" } }, [
            el("h2", { style: { margin: 0 } }, "Garde-manger 🗄️"),
            el("div", { class: "ff-stats", style: { gap: "8px" } }, [
              el("div", { class: "ff-stat", style: { background: expCount > 0 ? "#fee2e2" : "var(--pg-pale)", borderColor: expCount > 0 ? "var(--pg-err)" : "var(--pg-navy)" } }, [
                el("div", { class: "v", style: { color: expCount > 0 ? "var(--pg-err)" : "var(--pg-navy)" } }, String(expCount)),
                el("div", { class: "k" }, "Périmés")
              ]),
              el("div", { class: "ff-stat", style: { background: soonCount > 0 ? "#fef3c7" : "var(--pg-pale)", borderColor: soonCount > 0 ? "#d97706" : "var(--pg-navy)" } }, [
                el("div", { class: "v", style: { color: soonCount > 0 ? "#d97706" : "var(--pg-navy)" } }, String(soonCount)),
                el("div", { class: "k" }, "Bientôt")
              ]),
              el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(items.length)), el("div", { class: "k" }, "Total")])
            ])
          ]),
          el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "12px" } }, [
            nameInp, qtyInp, expInp,
            el("button", { class: "ff-btn primary", onClick: () => {
              const name = nameInp.value.trim();
              if (!name) { toast("Entre un nom d'article", "err"); return; }
              items.push({ id: nextId, name, qty: qtyInp.value.trim() || "1", exp: expInp.value || addDays(30) });
              nextId++;
              persist(); render();
              toast("Article ajouté", "ok");
            }}, "＋ Ajouter")
          ]),
          el("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" } }, [
            el("div", { class: "ff-seg" }, [
              ["all", "Tous"], ["expired", "🚫 Périmés"], ["soon", "⏳ Bientôt"], ["ok", "✅ OK"]
            ].map(([v, label]) => el("button", {
              class: "ff-seg" + (filter === v ? " on" : ""),
              onClick: () => { filter = v; persist(); render(); }
            }, label))),
            el("div", { style: { display: "flex", gap: "6px", alignItems: "center", marginLeft: "auto" } }, [
              el("span", { style: { fontSize: ".85rem", fontWeight: "700" } }, "Trier :"),
              el("select", { class: "ff-select", style: { width: "auto" }, onChange: e => { sortBy = e.target.value; persist(); render(); } }, [
                el("option", { value: "exp", selected: sortBy === "exp" }, "Péremption"),
                el("option", { value: "name", selected: sortBy === "name" }, "Nom A-Z")
              ]),
              el("button", { class: "ff-btn sm ghost", onClick: () => {
                const csv = "Nom,Quantité,Date péremption,Statut\n" +
                  items.map(i => { const s = statusOf(i); return `"${i.name}","${i.qty}","${i.exp}","${s.label}"`; }).join("\n");
                save("garde-manger.csv", csv, "text/csv;charset=utf-8");
              }}, "⬇️ Export CSV")
            ])
          ])
        ]),
        el("div", { class: "ff-panel" }, [
          sorted.length === 0
            ? el("div", { class: "ff-empty" }, "Aucun article" + (filter !== "all" ? " dans ce filtre" : "") + ".")
            : el("table", { class: "ff-table" }, [
              el("thead", el("tr", [
                el("th", "Article"),
                el("th", "Quantité"),
                el("th", "Date"),
                el("th", "Statut"),
                el("th", "")
              ])),
              el("tbody", sorted.map(item => {
                const st2 = statusOf(item);
                return el("tr", { style: { background: st2.bg } }, [
                  el("td", [
                    el("span", { style: { marginRight: "6px" } }, st2.icon),
                    el("input", { class: "ff-input", value: item.name, style: { border: "none", background: "transparent", fontWeight: "700", padding: "2px 4px" }, onInput: e => { item.name = e.target.value; persist(); } })
                  ]),
                  el("td", el("input", { class: "ff-input", value: item.qty, style: { border: "none", background: "transparent", width: "100px", padding: "2px 4px" }, onInput: e => { item.qty = e.target.value; persist(); } })),
                  el("td", el("input", { class: "ff-input", type: "date", value: item.exp, style: { border: "none", background: "transparent", padding: "2px 4px", color: st2.color, fontWeight: "700" }, onInput: e => { item.exp = e.target.value; persist(); render(); } })),
                  el("td", el("span", { style: { fontWeight: "800", color: st2.color, fontSize: ".85rem" } }, st2.label)),
                  el("td", el("button", { class: "ff-btn sm ghost", onClick: () => { items = items.filter(x => x.id !== item.id); persist(); render(); } }, "✕"))
                ]);
              }))
            ])
        ])
      );
    }
    root.append(out);
    render();
  }
});
