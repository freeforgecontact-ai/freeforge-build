/* Calculateur de Taxes (TPS/TVQ + provinces) — enrichi : ajout ou extraction. */
FF.register({
  id: "taxes", title: "Taxes de vente", icon: "🧾", tag: "Canada",
  desc: "TPS/TVQ et taxes provinciales — ajoute ou extrait les taxes d’un montant.",
  mount(root, ctx) {
    const { el, store, fmt, round2, copy, save } = ctx;
    // taux 2026 (fédéral + provincial). qst=TVQ sur montant avant taxe.
    const PROV = {
      QC: { n: "Québec", gst: 0.05, qst: 0.09975 },
      ON: { n: "Ontario (TVH)", hst: 0.13 },
      NB: { n: "Nouveau-Brunswick (TVH)", hst: 0.15 },
      NS: { n: "Nouvelle-Écosse (TVH)", hst: 0.14 },
      NL: { n: "Terre-Neuve (TVH)", hst: 0.15 },
      PE: { n: "Île-du-P.-Édouard (TVH)", hst: 0.15 },
      AB: { n: "Alberta (TPS)", gst: 0.05 },
      BC: { n: "C.-Britannique", gst: 0.05, pst: 0.07 },
      MB: { n: "Manitoba", gst: 0.05, pst: 0.07 },
      SK: { n: "Saskatchewan", gst: 0.05, pst: 0.06 }
    };
    const st = store("taxes");
    let s = st.get("state", { amount: 100, prov: "QC", mode: "add" });

    function calc() {
      const p = PROV[s.prov]; let amt = +s.amount || 0;
      const rate = (p.gst || 0) + (p.qst || 0) + (p.pst || 0) + (p.hst || 0);
      let base, lines = [];
      if (s.mode === "extract") { base = amt / (1 + rate); } else { base = amt; }
      base = round2(base);
      if (p.gst) lines.push(["TPS (5 %)", round2(base * p.gst)]);
      if (p.qst) lines.push(["TVQ (9,975 %)", round2(base * p.qst)]);
      if (p.pst) lines.push(["TVP (" + fmt.pct(p.pst) + ")", round2(base * p.pst)]);
      if (p.hst) lines.push(["TVH (" + fmt.pct(p.hst) + ")", round2(base * p.hst)]);
      const tax = round2(lines.reduce((a, l) => a + l[1], 0));
      const total = round2(base + tax);
      return { base, tax, total, lines };
    }
    const out = el("div");
    function render() {
      ctx.clear(out);
      const r = calc();
      out.append(el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-field" }, [
              el("label", "Montant"),
              el("input", { class: "ff-input", type: "number", min: "0", step: "0.01", value: s.amount, onInput: (e) => { s.amount = e.target.value; save_(); render(); } })
            ]),
            el("div", { class: "ff-field" }, [
              el("label", "Province / territoire"),
              el("select", { class: "ff-select", value: s.prov, onChange: (e) => { s.prov = e.target.value; save_(); render(); } },
                Object.keys(PROV).map((k) => el("option", { value: k, selected: s.prov === k }, PROV[k].n)))
            ]),
            el("div", { class: "ff-field" }, [
              el("label", "Le montant est…"),
              el("div", { class: "ff-seg" }, [
                el("button", { class: s.mode === "add" ? "on" : "", onClick: () => { s.mode = "add"; save_(); render(); } }, "avant taxes"),
                el("button", { class: s.mode === "extract" ? "on" : "", onClick: () => { s.mode = "extract"; save_(); render(); } }, "taxes incluses")
              ])
            ])
          ]),
          el("div", { class: "ff-col" }, [
            el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Total" + (s.mode === "extract" ? " (saisi)" : " taxes incluses")), el("div", { class: "big" }, fmt.money(r.total))]),
            el("table", { class: "ff-table", style: { marginTop: "12px" } }, [
              el("tr", [el("td", "Montant avant taxes"), el("td", { class: "num" }, fmt.money(r.base))]),
              ...r.lines.map((l) => el("tr", [el("td", l[0]), el("td", { class: "num" }, fmt.money(l[1]))])),
              el("tr", [el("td", el("strong", "Taxes totales")), el("td", { class: "num" }, el("strong", fmt.money(r.tax)))])
            ])
          ])
        ]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn ghost", onClick: () => copy(txt(r)) }, "📋 Copier"),
          el("button", { class: "ff-btn ghost", onClick: () => save("taxes.txt", txt(r), "text/plain") }, "⬇️ Exporter")
        ])
      ]));
    }
    function txt(r) { return `Taxes — ${PROV[s.prov].n}\nAvant taxes : ${fmt.money(r.base)}\n` + r.lines.map((l) => `${l[0]} : ${fmt.money(l[1])}`).join("\n") + `\nTotal : ${fmt.money(r.total)}`; }
    function save_() { st.set("state", s); }
    root.append(out); render();
  }
});
