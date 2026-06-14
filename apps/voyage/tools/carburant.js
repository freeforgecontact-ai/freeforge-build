/* Calculateur Carburant Roadtrip — distance, consommation, prix, coût/pers. */
FF.register({
  id: "carburant", title: "Calculateur Carburant", icon: "⛽", tag: "Roadtrip",
  desc: "Calculez le coût en carburant de votre roadtrip : total, par personne et litres nécessaires.",
  mount(root, ctx) {
    const { el, store, fmt, round2, save, copy, toast } = ctx;
    const st = store("carburant");

    let s = st.get("state", {
      distance: 500,
      conso: 9.5,
      prix: 1.75,
      personnes: 2,
      retour: false
    });

    const PRESETS = [
      { nom: "Citadine / Hybride", conso: 6.5 },
      { nom: "Berline économique", conso: 8.5 },
      { nom: "Berline standard", conso: 10.5 },
      { nom: "VUS compact", conso: 10.0 },
      { nom: "VUS intermédiaire", conso: 12.0 },
      { nom: "VUS grand format", conso: 14.5 },
      { nom: "Camionnette", conso: 15.5 },
      { nom: "Électrique (éq. 100km)", conso: 2.2 },
      { nom: "Camper / VR", conso: 22.0 }
    ];

    function persist() { st.set("state", s); }

    function calc() {
      var dist = (+s.distance || 0) * (s.retour ? 2 : 1);
      var conso = +s.conso || 0;
      var prix = +s.prix || 0;
      var pers = Math.max(1, +s.personnes || 1);
      var litres = round2(dist / 100 * conso);
      var total = round2(litres * prix);
      var parPers = round2(total / pers);
      var coûtKm = dist > 0 ? round2(total / dist * 100) : 0;
      return { dist, litres, total, parPers, coûtKm, pers };
    }

    const out = el("div");

    function render() {
      ctx.clear(out);
      var r = calc();

      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Paramètres du trajet"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Distance (km)"),
                el("input", { class: "ff-input", type: "number", min: "0", step: "1", value: s.distance,
                  onInput: function(e) { s.distance = +e.target.value; persist(); render(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Consommation (L/100 km)"),
                el("input", { class: "ff-input", type: "number", min: "0", step: "0.1", value: s.conso,
                  onInput: function(e) { s.conso = +e.target.value; persist(); render(); } }),
                el("div", { style: { display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" } },
                  PRESETS.map(function(p) {
                    return el("button", { class: "ff-btn sm ghost", onClick: function() { s.conso = p.conso; persist(); render(); } }, p.nom + " (" + p.conso + ")");
                  })
                )
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Prix de l'essence ($/L)"),
                el("input", { class: "ff-input", type: "number", min: "0", step: "0.001", value: s.prix,
                  onInput: function(e) { s.prix = +e.target.value; persist(); render(); } }),
                el("div", { style: { display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" } }, [
                  el("button", { class: "ff-btn sm ghost", onClick: function() { s.prix = 1.60; persist(); render(); } }, "1,60 $"),
                  el("button", { class: "ff-btn sm ghost", onClick: function() { s.prix = 1.75; persist(); render(); } }, "1,75 $"),
                  el("button", { class: "ff-btn sm ghost", onClick: function() { s.prix = 1.90; persist(); render(); } }, "1,90 $"),
                  el("button", { class: "ff-btn sm ghost", onClick: function() { s.prix = 2.05; persist(); render(); } }, "2,05 $"),
                  el("button", { class: "ff-btn sm ghost", onClick: function() { s.prix = 2.20; persist(); render(); } }, "2,20 $")
                ])
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Nombre de personnes"),
                el("input", { class: "ff-input", type: "number", min: "1", max: "20", step: "1", value: s.personnes,
                  onInput: function(e) { s.personnes = Math.max(1, +e.target.value || 1); persist(); render(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", { style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" } }, [
                  el("input", { type: "checkbox", checked: s.retour, style: { width: "18px", height: "18px", accentColor: "var(--pg-blue)" },
                    onChange: function(e) { s.retour = e.target.checked; persist(); render(); } }),
                  "Inclure le trajet retour (aller-retour)"
                ])
              ])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-result" }, [
                el("div", { class: "lbl" }, "Coût total en carburant"),
                el("div", { class: "big" }, fmt.money(r.total)),
                el("div", { style: { color: "var(--pg-sky2)", marginTop: "4px", fontSize: ".9rem" } },
                  r.dist + " km" + (s.retour ? " (aller-retour)" : "") + " · " + fmt.num(r.litres) + " L")
              ]),
              el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [
                el("div", { class: "ff-stat" }, [
                  el("div", { class: "v" }, fmt.money(r.parPers)),
                  el("div", { class: "k" }, "Par personne (" + r.pers + " pers.)")
                ]),
                el("div", { class: "ff-stat" }, [
                  el("div", { class: "v" }, fmt.num(r.litres) + " L"),
                  el("div", { class: "k" }, "Litres nécessaires")
                ]),
                el("div", { class: "ff-stat" }, [
                  el("div", { class: "v" }, fmt.money(r.coûtKm) + " /100 km"),
                  el("div", { class: "k" }, "Coût au 100 km")
                ]),
                el("div", { class: "ff-stat" }, [
                  el("div", { class: "v" }, fmt.num(r.dist) + " km"),
                  el("div", { class: "k" }, "Distance totale")
                ])
              ]),
              el("div", { class: "ff-btns", style: { marginTop: "12px" } }, [
                el("button", { class: "ff-btn ghost", onClick: function() {
                  var texte = "FreeForge Voyage — Calcul Carburant\n" +
                    "\nDistance : " + r.dist + " km" + (s.retour ? " (aller-retour)" : "") +
                    "\nConsommation : " + s.conso + " L/100 km" +
                    "\nPrix : " + s.prix + " $/L" +
                    "\nPersonnes : " + s.personnes +
                    "\n\nLitres nécessaires : " + r.litres + " L" +
                    "\nCoût total : " + fmt.money(r.total) +
                    "\nCoût par personne : " + fmt.money(r.parPers) +
                    "\nCoût au 100 km : " + fmt.money(r.coûtKm);
                  copy(texte);
                  toast("Copié !", "ok");
                } }, "📋 Copier"),
                el("button", { class: "ff-btn ghost", onClick: function() {
                  var texte = "FreeForge Voyage — Calcul Carburant\n" +
                    "\nDistance : " + r.dist + " km\nConsommation : " + s.conso + " L/100km\nPrix : " + s.prix + " $/L\n" +
                    "Personnes : " + s.personnes + "\n\nLitres : " + r.litres + " L\nTotal : " + fmt.money(r.total) +
                    "\nPar personne : " + fmt.money(r.parPers);
                  save("carburant.txt", texte, "text/plain");
                  toast("Exporté", "ok");
                } }, "⬇️ Exporter")
              ])
            ])
          ])
        ]),

        // Comparatif multi-véhicules
        el("div", { class: "ff-panel" }, [
          el("h2", "Comparatif par type de véhicule"),
          el("div", { style: { overflowX: "auto" } }, [
            el("table", { class: "ff-table" }, [
              el("tr", [el("th", "Véhicule"), el("th", { class: "num" }, "L/100"), el("th", { class: "num" }, "Litres"), el("th", { class: "num" }, "Total"), el("th", { class: "num" }, "/pers.")]),
              ...PRESETS.slice(0, 7).map(function(p) {
                var litres = round2(r.dist / 100 * p.conso);
                var total = round2(litres * (+s.prix || 0));
                var parPers = round2(total / Math.max(1, +s.personnes || 1));
                return el("tr", { style: p.conso === +s.conso ? { background: "var(--pg-pale)" } : {} }, [
                  el("td", p.nom + (p.conso === +s.conso ? " ◄" : "")),
                  el("td", { class: "num" }, p.conso),
                  el("td", { class: "num" }, fmt.num(litres)),
                  el("td", { class: "num" }, fmt.money(total)),
                  el("td", { class: "num" }, fmt.money(parPers))
                ]);
              })
            ])
          ])
        ])
      );
    }

    root.append(out);
    render();
  }
});
