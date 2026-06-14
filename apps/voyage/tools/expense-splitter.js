/* Travel Expense Splitter — N voyageurs, dépenses partagées, règlement minimal. */
FF.register({
  id: "expense-splitter", title: "Partage de Dépenses", icon: "💸", tag: "Finance",
  desc: "Divisez les dépenses de voyage entre voyageurs et calculez qui doit quoi à qui.",
  mount(root, ctx) {
    const { el, store, fmt, round2, save, toast } = ctx;
    const st = store("expense-splitter");

    let voyageurs = st.get("voyageurs", ["Alice", "Bob", "Charlie"]);
    let depenses = st.get("depenses", [
      { desc: "Hôtel nuit 1", montant: 180, payeur: "Alice", partage: ["Alice", "Bob", "Charlie"] },
      { desc: "Repas du soir", montant: 75, payeur: "Bob", partage: ["Alice", "Bob", "Charlie"] },
      { desc: "Taxi aéroport", montant: 45, payeur: "Charlie", partage: ["Alice", "Charlie"] }
    ]);

    function persist() { st.set("voyageurs", voyageurs); st.set("depenses", depenses); }

    function calcSoldes() {
      const soldes = {};
      voyageurs.forEach(function(v) { soldes[v] = 0; });

      depenses.forEach(function(dep) {
        var montant = +dep.montant || 0;
        var partageList = dep.partage.filter(function(p) { return voyageurs.includes(p); });
        if (partageList.length === 0) return;
        var part = round2(montant / partageList.length);

        // Le payeur reçoit le montant total
        if (soldes[dep.payeur] !== undefined) soldes[dep.payeur] += montant;

        // Chaque participant doit sa part
        partageList.forEach(function(p) {
          if (soldes[p] !== undefined) soldes[p] -= part;
        });
      });

      // Arrondir les soldes
      Object.keys(soldes).forEach(function(k) { soldes[k] = round2(soldes[k]); });
      return soldes;
    }

    function calcReglements(soldes) {
      // Algorithme de règlement minimal
      var debiteurs = [];
      var crediteurs = [];

      Object.entries(soldes).forEach(function(entry) {
        var nom = entry[0];
        var val = entry[1];
        if (val < -0.01) debiteurs.push({ nom: nom, montant: -val });
        else if (val > 0.01) crediteurs.push({ nom: nom, montant: val });
      });

      debiteurs.sort(function(a, b) { return b.montant - a.montant; });
      crediteurs.sort(function(a, b) { return b.montant - a.montant; });

      var reglements = [];
      var i = 0, j = 0;
      while (i < debiteurs.length && j < crediteurs.length) {
        var transfert = round2(Math.min(debiteurs[i].montant, crediteurs[j].montant));
        if (transfert > 0.01) {
          reglements.push({ de: debiteurs[i].nom, vers: crediteurs[j].nom, montant: transfert });
        }
        debiteurs[i].montant = round2(debiteurs[i].montant - transfert);
        crediteurs[j].montant = round2(crediteurs[j].montant - transfert);
        if (debiteurs[i].montant < 0.01) i++;
        if (crediteurs[j].montant < 0.01) j++;
      }
      return reglements;
    }

    const out = el("div");

    function render() {
      ctx.clear(out);
      var soldes = calcSoldes();
      var reglements = calcReglements(soldes);
      var totalDepenses = round2(depenses.reduce(function(a, d) { return a + (+d.montant || 0); }, 0));

      out.append(
        // Voyageurs
        el("div", { class: "ff-panel" }, [
          el("h2", "Voyageurs"),
          el("div", { style: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" } },
            voyageurs.map(function(v, i) {
              return el("div", { style: { display: "flex", alignItems: "center", gap: "4px" } }, [
                el("input", { class: "ff-input", style: { width: "140px" }, value: v,
                  onInput: function(e) {
                    var ancien = voyageurs[i];
                    var nouveau = e.target.value;
                    voyageurs[i] = nouveau;
                    // Mettre à jour les références dans les dépenses
                    depenses.forEach(function(dep) {
                      if (dep.payeur === ancien) dep.payeur = nouveau;
                      dep.partage = dep.partage.map(function(p) { return p === ancien ? nouveau : p; });
                    });
                    persist();
                  }
                }),
                el("button", { class: "ff-btn sm ghost", onClick: function() {
                  if (voyageurs.length <= 1) { toast("Il faut au moins un voyageur", "err"); return; }
                  var nom = voyageurs[i];
                  voyageurs.splice(i, 1);
                  depenses.forEach(function(dep) {
                    dep.partage = dep.partage.filter(function(p) { return p !== nom; });
                    if (dep.payeur === nom) dep.payeur = voyageurs[0] || "";
                  });
                  persist();
                  render();
                } }, "✕")
              ]);
            })
          ),
          el("button", { class: "ff-btn sm primary", onClick: function() {
            voyageurs.push("Voyageur " + (voyageurs.length + 1));
            persist();
            render();
          } }, "＋ Ajouter un voyageur")
        ]),

        // Résumé
        el("div", { class: "ff-result", style: { marginBottom: "18px" } }, [
          el("div", { class: "lbl" }, "Total des dépenses"),
          el("div", { class: "big" }, fmt.money(totalDepenses)),
          el("div", { style: { color: "var(--pg-sky2)", marginTop: "4px", fontSize: ".9rem" } },
            depenses.length + " dépense" + (depenses.length > 1 ? "s" : "") +
            (voyageurs.length > 0 ? " · " + fmt.money(round2(totalDepenses / voyageurs.length)) + "/pers." : ""))
        ]),

        // Soldes
        el("div", { class: "ff-panel" }, [
          el("h2", "Soldes individuels"),
          el("div", { class: "ff-stats" },
            voyageurs.map(function(v) {
              var s = soldes[v] || 0;
              var couleur = s > 0.01 ? "var(--pg-ok)" : s < -0.01 ? "var(--pg-err)" : "var(--pg-mut)";
              return el("div", { class: "ff-stat", style: { borderColor: Math.abs(s) > 0.01 ? couleur : "" } }, [
                el("div", { class: "v", style: { color: couleur } }, (s > 0 ? "+" : "") + fmt.money(s)),
                el("div", { class: "k" }, v),
                el("div", { style: { fontSize: ".7rem", color: "var(--pg-mut)", marginTop: "4px" } }, s > 0.01 ? "À recevoir" : s < -0.01 ? "À payer" : "Équilibré")
              ]);
            })
          )
        ]),

        // Règlements
        reglements.length > 0 ? el("div", { class: "ff-panel" }, [
          el("h2", "Règlement minimal"),
          el("div", { class: "ff-note" }, "Le nombre minimal de transactions pour équilibrer les comptes."),
          ...reglements.map(function(r) {
            return el("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--pg-sky2)", flexWrap: "wrap" } }, [
              el("span", { class: "ff-chip" }, r.de),
              el("span", { style: { fontSize: "1.4rem" } }, "→"),
              el("span", { class: "ff-chip" }, r.vers),
              el("span", { style: { fontFamily: "var(--pg-head)", fontWeight: 700, fontSize: "1.1rem", color: "var(--pg-navy)" } }, fmt.money(r.montant))
            ]);
          })
        ]) : el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-empty" }, depenses.length === 0 ? "Ajoutez des dépenses pour voir les règlements." : "✅ Tout est équilibré !")
        ]),

        // Dépenses
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, [
            el("h2", { style: { margin: 0 } }, "Dépenses"),
            el("div", { class: "ff-btns", style: { margin: 0 } }, [
              el("button", { class: "ff-btn sm primary", onClick: function() {
                depenses.unshift({ desc: "Nouvelle dépense", montant: 0, payeur: voyageurs[0] || "", partage: voyageurs.slice() });
                persist();
                render();
              } }, "＋ Dépense"),
              el("button", { class: "ff-btn sm ghost", onClick: exportTxt }, "⬇️ Exporter")
            ])
          ]),
          depenses.length ? el("div", {},
            depenses.map(function(dep, di) {
              return el("div", { style: { border: "2px solid var(--pg-sky2)", borderRadius: "14px", padding: "14px", marginBottom: "10px" } }, [
                el("div", { class: "ff-row" }, [
                  el("div", { class: "ff-col" }, [
                    el("div", { class: "ff-field" }, [
                      el("label", "Description"),
                      el("input", { class: "ff-input", value: dep.desc, onInput: function(e) { dep.desc = e.target.value; persist(); } })
                    ]),
                    el("div", { class: "ff-row" }, [
                      el("div", { class: "ff-col" }, [
                        el("div", { class: "ff-field" }, [
                          el("label", "Montant ($)"),
                          el("input", { class: "ff-input", type: "number", min: "0", step: "0.01", value: dep.montant,
                            onInput: function(e) { dep.montant = +e.target.value; persist(); render(); } })
                        ])
                      ]),
                      el("div", { class: "ff-col" }, [
                        el("div", { class: "ff-field" }, [
                          el("label", "Payé par"),
                          el("select", { class: "ff-select", onChange: function(e) { dep.payeur = e.target.value; persist(); render(); } },
                            voyageurs.map(function(v) { return el("option", { value: v, selected: dep.payeur === v }, v); })
                          )
                        ])
                      ])
                    ])
                  ]),
                  el("div", { class: "ff-col", style: { flex: "0 0 auto" } }, [
                    el("div", { class: "ff-field" }, [
                      el("label", "Partagé entre"),
                      el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } },
                        voyageurs.map(function(v) {
                          var inclus = dep.partage.includes(v);
                          return el("button", {
                            class: "ff-btn sm" + (inclus ? " primary" : " ghost"),
                            onClick: function() {
                              if (inclus) {
                                dep.partage = dep.partage.filter(function(p) { return p !== v; });
                                if (dep.partage.length === 0) dep.partage = voyageurs.slice();
                              } else {
                                dep.partage = dep.partage.concat([v]);
                              }
                              persist();
                              render();
                            }
                          }, v);
                        })
                      )
                    ]),
                    el("div", { style: { fontSize: ".82rem", color: "var(--pg-mut)" } },
                      "Part/pers. : " + fmt.money(dep.partage.length > 0 ? round2((+dep.montant || 0) / dep.partage.length) : 0))
                  ])
                ]),
                el("button", { class: "ff-btn sm ghost", onClick: function() { depenses.splice(di, 1); persist(); render(); } }, "✕ Supprimer")
              ]);
            })
          ) : el("div", { class: "ff-empty" }, "Aucune dépense ajoutée.")
        ])
      );
    }

    function exportTxt() {
      var soldes = calcSoldes();
      var reglements = calcReglements(soldes);
      var lignes = ["FreeForge Voyage — Partage de Dépenses", ""];
      lignes.push("Voyageurs : " + voyageurs.join(", "));
      lignes.push("Total : " + fmt.money(round2(depenses.reduce(function(a, d) { return a + (+d.montant || 0); }, 0))));
      lignes.push("");
      lignes.push("--- DÉPENSES ---");
      depenses.forEach(function(d) {
        lignes.push(d.desc + " — " + fmt.money(+d.montant || 0) + " (payé par " + d.payeur + ", partagé entre " + d.partage.join(", ") + ")");
      });
      lignes.push("");
      lignes.push("--- SOLDES ---");
      voyageurs.forEach(function(v) { lignes.push(v + " : " + (soldes[v] >= 0 ? "+" : "") + fmt.money(soldes[v] || 0)); });
      lignes.push("");
      lignes.push("--- RÈGLEMENTS ---");
      if (reglements.length === 0) lignes.push("Tout est équilibré !");
      else reglements.forEach(function(r) { lignes.push(r.de + " doit " + fmt.money(r.montant) + " à " + r.vers); });
      save("depenses-voyage.txt", lignes.join("\n"), "text/plain");
      toast("Exporté", "ok");
    }

    root.append(out);
    render();
  }
});
