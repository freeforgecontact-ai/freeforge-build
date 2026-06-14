/* Calculateur de prix de vente (TPS/TVQ incluses) — enrichi. */
FF.register({
  id: "prix-vente", title: "Prix de vente", icon: "🏷️", tag: "PME",
  desc: "Marge, majoration ou profit cible — taxes TPS/TVQ et arrondi psychologique.",
  mount(root, ctx) {
    const { el, store, fmt, round2, save, copy, toast } = ctx;
    const TPS = 0.05, TVQ = 0.09975;
    const st = store("prix-vente");
    let s = st.get("state", { cost: 100, mode: "marge", val: 40, round: "none", taxIncl: false });

    // ---- maths pures ----
    function priceFromCost(cost, mode, val) {
      cost = +cost || 0; val = +val || 0;
      if (mode === "marge") { const m = Math.min(val, 99.9) / 100; return m >= 1 ? cost : cost / (1 - m); }
      if (mode === "majoration") return cost * (1 + val / 100);
      if (mode === "profit") return cost + val;
      return cost;
    }
    function roundPrice(p, mode) {
      if (mode === "99") return Math.floor(p) + 0.99;
      if (mode === "95") return Math.floor(p) + 0.95;
      if (mode === "1") return Math.round(p);
      if (mode === "5") return Math.round(p / 5) * 5;
      if (mode === "cash") return Math.round(p * 20) / 20; // arrondi 0,05 $
      return round2(p);
    }
    function compute() {
      let base = priceFromCost(s.cost, s.mode, s.val);
      base = roundPrice(base, s.round);
      if (s.taxIncl) { /* base est le prix AVANT taxe; on calcule la version taxes incluses ci-dessous */ }
      const tps = round2(base * TPS), tvq = round2(base * TVQ);
      const ttc = round2(base + tps + tvq);
      const profit = round2(base - (+s.cost || 0));
      const marge = base > 0 ? profit / base : 0;
      const major = (+s.cost) > 0 ? profit / (+s.cost) : 0;
      return { base, tps, tvq, ttc, profit, marge, major };
    }

    // ---- UI ----
    const out = el("div");
    function render() {
      ctx.clear(out);
      const r = compute();
      const seg = (key, opts) => el("div", { class: "ff-seg" }, opts.map(([v, lbl]) =>
        el("button", { class: s[key] === v ? "on" : "", onClick: () => { s[key] = v; persist(); render(); } }, lbl)));

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [
                el("label", "Coût du produit/service"),
                el("input", { class: "ff-input", type: "number", min: "0", step: "0.01", value: s.cost,
                  onInput: (e) => { s.cost = e.target.value; persist(); render(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", "Méthode de calcul"),
                seg("mode", [["marge", "Marge %"], ["majoration", "Majoration %"], ["profit", "Profit $"]])
              ]),
              el("div", { class: "ff-field" }, [
                el("label", s.mode === "profit" ? "Profit visé ($)" : (s.mode === "marge" ? "Marge visée (%)" : "Majoration (%)")),
                el("input", { class: "ff-input", type: "number", min: "0", step: "0.1", value: s.val,
                  onInput: (e) => { s.val = e.target.value; persist(); render(); } })
              ]),
              el("div", { class: "ff-field" }, [
                el("label", ["Arrondi psychologique ", el("span", { class: "hint" }, "(prix avant taxes)")]),
                seg("round", [["none", "Exact"], ["99", ",99"], ["95", ",95"], ["1", "1 $"], ["5", "5 $"], ["cash", "0,05 $"]])
              ])
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-result" }, [
                el("div", { class: "lbl" }, "Prix de vente (taxes incluses)"),
                el("div", { class: "big" }, fmt.money(r.ttc)),
                el("div", { style: { opacity: .9, marginTop: "4px", fontSize: "13px" } }, "Avant taxes : " + fmt.money(r.base))
              ]),
              el("div", { class: "ff-stats", style: { marginTop: "12px" } }, [
                stat(fmt.money(r.tps), "TPS 5 %"),
                stat(fmt.money(r.tvq), "TVQ 9,975 %"),
                stat(fmt.money(r.profit), "Profit"),
                stat(fmt.pct(r.marge), "Marge"),
                stat(fmt.pct(r.major), "Majoration")
              ])
            ])
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: savePreset }, "💾 Sauver ce produit"),
            el("button", { class: "ff-btn ghost", onClick: () => copy(summary(r)) }, "📋 Copier le résumé"),
            el("button", { class: "ff-btn ghost", onClick: () => save("prix-vente.txt", summary(r), "text/plain") }, "⬇️ Exporter")
          ]),
          el("div", { class: "ff-note" }, "TVQ calculée sur le montant avant taxes (règle Québec depuis 2013, non composée).")
        ]),
        presetsPanel()
      );
      function stat(v, k) { return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]); }
    }

    function summary(r) {
      return [`FreeForge — Prix de vente`, ``, `Coût : ${fmt.money(+s.cost)}`,
        `${s.mode === "profit" ? "Profit visé" : (s.mode === "marge" ? "Marge" : "Majoration")} : ${s.val}${s.mode === "profit" ? " $" : " %"}`,
        ``, `Prix avant taxes : ${fmt.money(r.base)}`, `TPS (5 %) : ${fmt.money(r.tps)}`, `TVQ (9,975 %) : ${fmt.money(r.tvq)}`,
        `PRIX TAXES INCLUSES : ${fmt.money(r.ttc)}`, ``, `Profit : ${fmt.money(r.profit)} — Marge ${fmt.pct(r.marge)} — Majoration ${fmt.pct(r.major)}`].join("\n");
    }
    function persist() { st.set("state", s); }
    function savePreset() {
      const name = prompt("Nom du produit :"); if (!name) return;
      const list = st.get("presets", []); list.unshift({ name, s: Object.assign({}, s), at: Date.now() });
      st.set("presets", list.slice(0, 100)); toast("Produit sauvegardé", "ok"); render();
    }
    function presetsPanel() {
      const list = st.get("presets", []);
      return el("div", { class: "ff-panel" }, [
        el("h2", "Mes produits enregistrés"),
        list.length ? el("table", { class: "ff-table" }, [
          el("tr", [el("th", "Produit"), el("th", { class: "num" }, "Prix TTC"), el("th", "")]),
          ...list.map((p, i) => {
            const r = (() => { const old = s; s = p.s; const x = compute(); s = old; return x; })();
            return el("tr", [
              el("td", p.name),
              el("td", { class: "num" }, fmt.money(r.ttc)),
              el("td", { class: "num" }, [
                el("button", { class: "ff-btn sm ghost", onClick: () => { s = Object.assign({}, p.s); persist(); render(); } }, "Charger"),
                el("button", { class: "ff-btn sm ghost", style: { marginLeft: "6px" }, onClick: () => { list.splice(i, 1); st.set("presets", list); render(); } }, "✕")
              ])
            ]);
          })
        ]) : el("div", { class: "ff-empty" }, "Aucun produit enregistré pour l’instant.")
      ]);
    }
    root.append(out); render();
  }
});
