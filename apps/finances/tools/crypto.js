/* Crypto Portfolio Tracker — prix en ligne (CoinGecko) + cache hors-ligne. */
FF.register({
  id: "crypto", title: "Portefeuille Crypto", icon: "🪙", tag: "En ligne+cache",
  desc: "Suis ton portefeuille crypto. Prix en direct quand tu es en ligne, en cache sinon.",
  mount(root, ctx) {
    const { el, store, fmt, round2, cachedFetch, toast } = ctx;
    const st = store("crypto");
    const COINS = { bitcoin: "Bitcoin (BTC)", ethereum: "Ethereum (ETH)", solana: "Solana (SOL)", cardano: "Cardano (ADA)", dogecoin: "Dogecoin (DOGE)", litecoin: "Litecoin (LTC)" };
    let holdings = st.get("holdings", [{ id: "bitcoin", qty: 0.15 }, { id: "ethereum", qty: 2 }]);
    let prices = st.get("prices", { bitcoin: 90000, ethereum: 4800, solana: 240, cardano: 0.9, dogecoin: 0.18, litecoin: 130 });
    let updatedAt = st.get("updatedAt", 0);
    const out = el("div");
    function persist() { st.set("holdings", holdings); st.set("prices", prices); st.set("updatedAt", updatedAt); }
    async function refresh() {
      const ids = Object.keys(COINS).join(",");
      try {
        const r = await cachedFetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=cad`, { key: "cgprices", ttl: 3600e3 });
        for (const k in r.data) if (r.data[k].cad) prices[k] = r.data[k].cad;
        updatedAt = r.at || Date.now(); persist();
        toast(r.fresh ? "Prix à jour" : "Prix en cache (hors-ligne)", "ok"); render();
      } catch (e) { toast("Pas de connexion — prix en cache/manuels", "err"); }
    }
    function render() {
      ctx.clear(out);
      const total = round2(holdings.reduce((a, h) => a + (+h.qty || 0) * (prices[h.id] || 0), 0));
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Valeur du portefeuille"), el("div", { class: "big" }, fmt.money(total))]),
          el("div", { style: { textAlign: "center", marginTop: "8px", color: "var(--pg-mut)", fontSize: ".85rem" } }, updatedAt ? "Prix du " + new Date(updatedAt).toLocaleString("fr-CA") : "Prix de démonstration — clique « Rafraîchir »"),
          el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [el("button", { class: "ff-btn primary", onClick: refresh }, "🔄 Rafraîchir les prix (en ligne)")])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Mes avoirs"), el("button", { class: "ff-btn sm primary", onClick: () => { holdings.push({ id: "bitcoin", qty: 0 }); persist(); render(); } }, "＋")]),
          el("table", { class: "ff-table" }, [el("tr", [el("th", "Crypto"), el("th", { class: "num" }, "Quantité"), el("th", { class: "num" }, "Prix"), el("th", { class: "num" }, "Valeur"), el("th", "")]),
            ...holdings.map((h, i) => el("tr", [
              el("td", el("select", { class: "ff-select", onChange: (e) => { h.id = e.target.value; persist(); render(); } }, Object.keys(COINS).map((k) => el("option", { value: k, selected: h.id === k }, COINS[k])))),
              el("td", { class: "num" }, el("input", { class: "ff-input", type: "number", step: "0.0001", style: { width: "110px" }, value: h.qty, onInput: (e) => { h.qty = +e.target.value; persist(); render(); } })),
              el("td", { class: "num" }, fmt.money(prices[h.id] || 0)),
              el("td", { class: "num" }, fmt.money(round2((+h.qty || 0) * (prices[h.id] || 0)))),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { holdings.splice(i, 1); persist(); render(); } }, "✕"))
            ]))]),
          el("div", { class: "ff-note" }, "Prix via CoinGecko quand tu es en ligne, puis conservés localement pour l’usage hors-ligne. Aucune clé ni compte requis.")
        ])
      );
    }
    root.append(out); render();
  }
});
