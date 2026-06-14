/* Offline Currency Converter — taux en ligne via open.er-api.com ou frankfurter.app, cache hors-ligne. */
FF.register({
  id: "currency", title: "Convertisseur de Devises", icon: "💱", tag: "En ligne+cache",
  desc: "Convertit entre devises. Taux en ligne mis en cache pour usage hors-ligne.",
  mount(root, ctx) {
    const { el, store, fmt, round2, cachedFetch, toast, save } = ctx;
    const st = store("currency");

    const DEVISES = {
      CAD: "Dollar canadien", USD: "Dollar américain", EUR: "Euro", GBP: "Livre sterling",
      JPY: "Yen japonais", CHF: "Franc suisse", AUD: "Dollar australien", MXN: "Peso mexicain",
      BRL: "Real brésilien", CNY: "Yuan chinois", INR: "Roupie indienne", KRW: "Won coréen",
      NOK: "Couronne norvégienne", SEK: "Couronne suédoise", DKK: "Couronne danoise",
      NZD: "Dollar néo-zélandais", SGD: "Dollar de Singapour", HKD: "Dollar de Hong Kong",
      TRY: "Livre turque", MYR: "Ringgit malaisien", THB: "Baht thaïlandais",
      CZK: "Couronne tchèque", PLN: "Zloty polonais", PHP: "Peso philippin",
      IDR: "Roupie indonésienne", EGP: "Livre égyptienne", ZAR: "Rand sud-africain",
      COP: "Peso colombien", ARS: "Peso argentin", CLP: "Peso chilien"
    };

    let rates = st.get("rates", { CAD: 1, USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 110, CHF: 0.67, AUD: 1.11, MXN: 13.1, BRL: 3.8 });
    let updatedAt = st.get("updatedAt", 0);
    let state = st.get("state", { base: "CAD", cible: "USD", montant: 100 });

    function persist() { st.set("state", state); }

    const out = el("div");

    async function rafraichir() {
      const url1 = "https://open.er-api.com/v6/latest/CAD";
      const url2 = "https://api.frankfurter.app/latest?from=CAD";
      const btn = root.querySelector("#curr-refresh-btn");
      if (btn) btn.textContent = "⏳ Mise à jour...";
      try {
        let r;
        try {
          r = await cachedFetch(url1, { key: "currency-rates-cad", ttl: 6 * 3600e3 });
          if (r.data && r.data.rates) {
            rates = r.data.rates;
            rates.CAD = 1;
          }
        } catch (e1) {
          r = await cachedFetch(url2, { key: "currency-rates-cad-fb", ttl: 6 * 3600e3 });
          if (r.data && r.data.rates) {
            rates = r.data.rates;
            rates.CAD = 1;
          }
        }
        st.set("rates", rates);
        updatedAt = r.at || Date.now();
        st.set("updatedAt", updatedAt);
        toast(r.fresh ? "Taux mis à jour" : "Taux en cache (hors-ligne)", "ok");
        render();
      } catch (e) {
        toast("Hors-ligne — utilisation du dernier cache", "err");
        render();
      }
    }

    function convertir(montant, de, vers) {
      if (!rates[de] || !rates[vers]) return 0;
      // Tout est en CAD comme base
      const enCAD = montant / rates[de];
      return enCAD * rates[vers];
    }

    function render() {
      ctx.clear(out);
      const { base, cible, montant } = state;
      const resultat = rates[base] && rates[cible] ? round2(convertir(+montant || 0, base, cible)) : 0;
      const taux = rates[base] && rates[cible] ? (rates[cible] / rates[base]) : 0;

      const deviseSel = (key, id) => el("select", { class: "ff-select", id,
        onChange: (e) => { state[key] = e.target.value; persist(); render(); } },
        Object.entries(DEVISES).map(([code, nom]) =>
          el("option", { value: code, selected: state[key] === code }, code + " — " + nom)
        )
      );

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Montant"),
                el("input", { class: "ff-input", type: "number", min: "0", step: "0.01", value: montant,
                  onInput: (e) => { state.montant = +e.target.value; persist(); render(); } })
              ]),
              el("div", { class: "ff-field" }, [el("label", "Devise source"), deviseSel("base", "curr-base")]),
              el("div", { class: "ff-field" }, [el("label", "Devise cible"), deviseSel("cible", "curr-cible")])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-result" }, [
                el("div", { class: "lbl" }, montant + " " + base + " ="),
                el("div", { class: "big" }, new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(resultat) + " " + cible),
                el("div", { style: { color: "var(--pg-sky2)", marginTop: "6px", fontSize: ".85rem" } },
                  "1 " + base + " = " + new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 4 }).format(taux) + " " + cible)
              ]),
              el("div", { class: "ff-note", style: { marginTop: "10px" } },
                updatedAt
                  ? "Taux du " + new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))
                  : "Taux de démonstration — cliquez « Rafraîchir »"
              )
            ])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", id: "curr-refresh-btn", onClick: rafraichir }, "🔄 Rafraîchir les taux (en ligne)"),
            el("button", { class: "ff-btn ghost", onClick: () => { const t = state.base; state.base = state.cible; state.cible = t; persist(); render(); } }, "⇄ Inverser"),
            el("button", { class: "ff-btn ghost", onClick: () => {
              const lignes = Object.keys(DEVISES)
                .filter(c => rates[c])
                .map(c => {
                  const v = round2(convertir(+montant || 0, base, c));
                  return montant + " " + base + " = " + v + " " + c + " (" + DEVISES[c] + ")";
                });
              const texte = "FreeForge Voyage — Taux de change\n" +
                (updatedAt ? "Taux du " + new Date(updatedAt).toLocaleString("fr-CA") : "Taux de démo") +
                "\n\n" + lignes.join("\n");
              save("taux-change.txt", texte, "text/plain");
              toast("Exporté", "ok");
            } }, "⬇️ Exporter tous les taux")
          ])
        ]),
        // Tableau multi-devises rapide
        el("div", { class: "ff-panel" }, [
          el("h2", "Tableau de conversion rapide"),
          el("div", { style: { overflowX: "auto" } }, [
            el("table", { class: "ff-table" }, [
              el("tr", [el("th", "Devise"), el("th", "Nom"), el("th", { class: "num" }, montant + " " + base)]),
              ...["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "MXN", "BRL", "CNY"]
                .filter(c => c !== base && rates[c])
                .map(c => {
                  const v = round2(convertir(+montant || 0, base, c));
                  return el("tr", [
                    el("td", el("span", { class: "ff-chip" }, c)),
                    el("td", DEVISES[c] || c),
                    el("td", { class: "num" }, new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 2 }).format(v))
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
