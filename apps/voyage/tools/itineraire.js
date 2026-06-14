/* Travel Itinerary Planner — jour par jour, budget, export. */
FF.register({
  id: "itineraire", title: "Planificateur d'Itinéraire", icon: "🗺️", tag: "Organisation",
  desc: "Planifiez votre voyage jour par jour avec activités et budget. Export inclus.",
  mount(root, ctx) {
    const { el, store, fmt, round2, save, toast } = ctx;
    const st = store("itineraire");

    let voyage = st.get("voyage", {
      nom: "Mon voyage", dateDebut: "",
      jours: [
        { titre: "Arrivée et installation", activites: [{ desc: "Aéroport → Hôtel", budget: 80 }, { desc: "Dîner en ville", budget: 40 }] },
        { titre: "Exploration centre-ville", activites: [{ desc: "Visite musée", budget: 25 }, { desc: "Déjeuner café local", budget: 20 }, { desc: "Tour guidé à pied", budget: 15 }] }
      ]
    });

    function persist() { st.set("voyage", voyage); }

    function totalJour(jour) {
      return round2(jour.activites.reduce((a, act) => a + (+act.budget || 0), 0));
    }

    function totalVoyage() {
      return round2(voyage.jours.reduce((a, j) => a + totalJour(j), 0));
    }

    const out = el("div");
    let vueCourante = st.get("vueCourante", "liste");

    function render() {
      ctx.clear(out);
      const total = totalVoyage();

      out.append(
        // En-tête voyage
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Nom du voyage"),
                el("input", { class: "ff-input", value: voyage.nom, onInput: (e) => { voyage.nom = e.target.value; persist(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Date de départ"),
                el("input", { class: "ff-input", type: "date", value: voyage.dateDebut,
                  onChange: (e) => { voyage.dateDebut = e.target.value; persist(); render(); } })
              ])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-result" }, [
                el("div", { class: "lbl" }, "Budget total du voyage"),
                el("div", { class: "big" }, fmt.money(total)),
                el("div", { style: { color: "var(--pg-sky2)", fontSize: ".9rem", marginTop: "4px" } },
                  voyage.jours.length + " jour" + (voyage.jours.length > 1 ? "s" : "") +
                  (total > 0 && voyage.jours.length > 0 ? " · Moy. " + fmt.money(round2(total / voyage.jours.length)) + "/jour" : ""))
              ])
            ])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: () => {
              voyage.jours.push({ titre: "Jour " + (voyage.jours.length + 1), activites: [] });
              persist();
              render();
            } }, "＋ Ajouter un jour"),
            el("button", { class: "ff-btn ghost", onClick: exportTxt }, "⬇️ Exporter TXT"),
            el("button", { class: "ff-btn ghost", onClick: exportCsv }, "⬇️ Exporter CSV")
          ])
        ]),
        // Stats
        el("div", { class: "ff-stats", style: { marginBottom: "18px" } }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(voyage.jours.length)), el("div", { class: "k" }, "Jours planifiés")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(voyage.jours.reduce((a, j) => a + j.activites.length, 0))), el("div", { class: "k" }, "Activités")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, fmt.money(total)), el("div", { class: "k" }, "Budget total")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, voyage.jours.length > 0 ? fmt.money(round2(total / voyage.jours.length)) : fmt.money(0)), el("div", { class: "k" }, "Moy./jour")])
        ]),
        // Jours
        ...voyage.jours.map((jour, ji) => {
          const dateJour = voyage.dateDebut
            ? new Intl.DateTimeFormat("fr-CA", { weekday: "long", month: "long", day: "numeric" }).format(new Date(new Date(voyage.dateDebut).getTime() + ji * 86400000))
            : null;

          return el("div", { class: "ff-panel" }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" } }, [
              el("div", {}, [
                el("div", { style: { fontFamily: "var(--pg-head)", fontWeight: 700, color: "var(--pg-navy)", fontSize: "1.1rem" } }, "Jour " + (ji + 1) + (dateJour ? " — " + dateJour : "")),
                el("input", { class: "ff-input", style: { marginTop: "6px" }, value: jour.titre, placeholder: "Titre du jour",
                  onInput: (e) => { jour.titre = e.target.value; persist(); } })
              ]),
              el("div", { style: { textAlign: "right" } }, [
                el("div", { class: "ff-chip" }, "Budget : " + fmt.money(totalJour(jour))),
                el("button", { class: "ff-btn sm ghost", style: { marginLeft: "6px" }, onClick: () => { voyage.jours.splice(ji, 1); persist(); render(); } }, "✕ Supprimer")
              ])
            ]),
            // Activités
            jour.activites.length ? el("table", { class: "ff-table", style: { marginBottom: "10px" } }, [
              el("tr", [el("th", "Activité / description"), el("th", { class: "num" }, "Budget ($)"), el("th", "")]),
              ...jour.activites.map((act, ai) =>
                el("tr", [
                  el("td", el("input", { class: "ff-input", value: act.desc, placeholder: "Description de l'activité",
                    onInput: (e) => { act.desc = e.target.value; persist(); } })),
                  el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", min: "0", style: { width: "100px" }, value: act.budget,
                    onInput: (e) => { act.budget = +e.target.value; persist(); render(); } })),
                  el("td", el("button", { class: "ff-btn sm ghost", onClick: () => { jour.activites.splice(ai, 1); persist(); render(); } }, "✕"))
                ])
              )
            ]) : el("div", { class: "ff-empty", style: { padding: "12px" } }, "Aucune activité pour ce jour."),
            el("button", { class: "ff-btn sm primary", onClick: () => {
              jour.activites.push({ desc: "Nouvelle activité", budget: 0 });
              persist();
              render();
            } }, "＋ Activité")
          ]);
        })
      );
    }

    function exportTxt() {
      const lignes = ["FreeForge Voyage — " + voyage.nom, voyage.dateDebut ? "Départ : " + voyage.dateDebut : "", ""];
      voyage.jours.forEach((j, ji) => {
        lignes.push("=== Jour " + (ji + 1) + " : " + j.titre + " ===");
        j.activites.forEach(a => lignes.push("  • " + a.desc + (a.budget ? " (" + fmt.money(+a.budget) + ")" : "")));
        lignes.push("  Budget du jour : " + fmt.money(totalJour(j)));
        lignes.push("");
      });
      lignes.push("BUDGET TOTAL : " + fmt.money(totalVoyage()));
      save("itineraire-" + (voyage.nom || "voyage").replace(/\s+/g, "-") + ".txt", lignes.join("\n"), "text/plain");
      toast("Itinéraire exporté", "ok");
    }

    function exportCsv() {
      const rows = [["Jour", "Titre", "Activite", "Budget"]];
      voyage.jours.forEach((j, ji) => {
        j.activites.forEach(a => rows.push([ji + 1, j.titre, a.desc, +a.budget || 0]));
        if (j.activites.length === 0) rows.push([ji + 1, j.titre, "", 0]);
      });
      save("itineraire.csv", rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n"), "text/csv");
      toast("CSV exporté", "ok");
    }

    root.append(out);
    render();
  }
});
