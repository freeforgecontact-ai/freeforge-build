/* Moteur de document d'affaires partagé (facture & soumission). 100% local. */
FF.docEngine = function (cfg) {
  // cfg: {id,title,icon,tag,type:'facture'|'devis', noun, dateLabel, secondDateLabel, statuses:[]}
  return {
    id: cfg.id, title: cfg.title, icon: cfg.icon, tag: cfg.tag, desc: cfg.desc,
    mount(root, ctx) {
      const { el, store, fmt, round2, toast, print, save } = ctx;
      const TPS = 0.05, TVQ = 0.09975;
      const biz = store("biz");                 // infos entreprise partagées entre factures/devis
      const db = store(cfg.type);               // documents de ce type
      let business = biz.get("info", { name: "", addr: "", email: "", phone: "", logo: "" });
      let view = "list", current = null;

      const root2 = el("div"); root.append(root2);
      function go(v, doc) { view = v; current = doc; render(); }

      function newDoc() {
        const n = (db.get("counter", 0) || 0) + 1; db.set("counter", n);
        return { id: "d" + Date.now(), no: String(n).padStart(4, "0"), date: new Date().toISOString().slice(0, 10),
          date2: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
          client: { name: "", addr: "", email: "" }, items: [{ desc: "", qty: 1, price: 0 }],
          tps: true, tvq: true, discount: 0, notes: "", status: cfg.statuses[0] };
      }
      function totals(d) {
        const sub = round2(d.items.reduce((a, it) => a + (+it.qty || 0) * (+it.price || 0), 0));
        const disc = round2(+d.discount || 0);
        const net = Math.max(0, round2(sub - disc));
        const tps = d.tps ? round2(net * TPS) : 0, tvq = d.tvq ? round2(net * TVQ) : 0;
        return { sub, disc, net, tps, tvq, total: round2(net + tps + tvq) };
      }

      function render() {
        ctx.clear(root2);
        root2.append(view === "list" ? listView() : editView(current));
      }

      function listView() {
        const docs = db.get("docs", []);
        return el("div", {}, [
          el("div", { class: "ff-panel" }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" } }, [
              el("h2", { style: { margin: 0 } }, "Mes " + cfg.noun + "s"),
              el("button", { class: "ff-btn primary", onClick: () => go("edit", newDoc()) }, "＋ Nouvelle " + cfg.noun)
            ]),
            docs.length ? el("table", { class: "ff-table", style: { marginTop: "10px" } }, [
              el("tr", [el("th", "N°"), el("th", "Client"), el("th", "Date"), el("th", "Statut"), el("th", { class: "num" }, "Total"), el("th", "")]),
              ...docs.map((d, i) => { const t = totals(d); return el("tr", [
                el("td", "#" + d.no), el("td", d.client.name || "—"), el("td", fmt.date(d.date)),
                el("td", el("span", { class: "ff-chip" }, d.status)),
                el("td", { class: "num" }, fmt.money(t.total)),
                el("td", { class: "num" }, [
                  el("button", { class: "ff-btn sm ghost", onClick: () => go("edit", JSON.parse(JSON.stringify(d))) }, "Ouvrir"),
                  el("button", { class: "ff-btn sm ghost", style: { marginLeft: "6px" }, onClick: () => { docs.splice(i, 1); db.set("docs", docs); render(); } }, "✕")
                ])
              ]); })
            ]) : el("div", { class: "ff-empty" }, "Aucune " + cfg.noun + ". Crée la première !")
          ])
        ]);
      }

      function editView(d) {
        const t = totals(d);
        const itemsTbl = el("table", { class: "ff-table" });
        function drawItems() {
          ctx.clear(itemsTbl);
          itemsTbl.append(el("tr", [el("th", "Description"), el("th", { class: "num" }, "Qté"), el("th", { class: "num" }, "Prix unit."), el("th", { class: "num" }, "Montant"), el("th", "")]));
          d.items.forEach((it, i) => {
            itemsTbl.append(el("tr", [
              el("td", el("input", { class: "ff-input", value: it.desc, placeholder: "Produit ou service", onInput: (e) => { it.desc = e.target.value; } })),
              el("td", { class: "num", style: { width: "70px" } }, el("input", { class: "ff-input", type: "number", min: "0", step: "1", value: it.qty, onInput: (e) => { it.qty = e.target.value; refresh(); } })),
              el("td", { class: "num", style: { width: "110px" } }, el("input", { class: "ff-input", type: "number", min: "0", step: "0.01", value: it.price, onInput: (e) => { it.price = e.target.value; refresh(); } })),
              el("td", { class: "num" }, fmt.money((+it.qty || 0) * (+it.price || 0))),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { d.items.splice(i, 1); if (!d.items.length) d.items.push({ desc: "", qty: 1, price: 0 }); drawItems(); refresh(); } }, "✕"))
            ]));
          });
        }
        const totalsBox = el("div");
        function refresh() { const tt = totals(d); ctx.clear(totalsBox); totalsBox.append(totalsView(tt, d)); itemsTbl.querySelectorAll("tr").forEach((tr, idx) => { if (idx > 0) { const it = d.items[idx - 1]; if (it) tr.children[3].textContent = fmt.money((+it.qty || 0) * (+it.price || 0)); } }); }
        drawItems();

        return el("div", {}, [
          el("div", { class: "ff-btns", style: { marginBottom: "12px" } }, [
            el("button", { class: "ff-btn ghost", onClick: () => go("list") }, "‹ Liste"),
            el("button", { class: "ff-btn primary", onClick: () => saveDoc(d) }, "💾 Enregistrer"),
            el("button", { class: "ff-btn accent", onClick: () => print(cfg.noun + " " + d.no, printable(d)) }, "🖨️ Imprimer / PDF"),
            cfg.type === "devis" ? el("button", { class: "ff-btn ghost", onClick: () => toFacture(d) }, "➜ Convertir en facture") : null
          ]),
          el("div", { class: "ff-panel" }, [
            el("h2", "Mon entreprise"),
            el("div", { class: "ff-row" }, [
              field("Nom de l’entreprise", business.name, (v) => business.name = v),
              field("Courriel", business.email, (v) => business.email = v),
              field("Téléphone", business.phone, (v) => business.phone = v)
            ]),
            field("Adresse", business.addr, (v) => business.addr = v, "textarea"),
            el("div", { class: "ff-btns" }, [el("button", { class: "ff-btn sm ghost", onClick: () => { biz.set("info", business); toast("Entreprise enregistrée", "ok"); } }, "Sauver mon entreprise")])
          ]),
          el("div", { class: "ff-panel" }, [
            el("h2", cfg.title + " #" + d.no),
            el("div", { class: "ff-row" }, [
              field("Client", d.client.name, (v) => d.client.name = v),
              field(cfg.dateLabel, d.date, (v) => d.date = v, "date"),
              field(cfg.secondDateLabel, d.date2, (v) => d.date2 = v, "date")
            ]),
            field("Adresse du client", d.client.addr, (v) => d.client.addr = v, "textarea"),
            el("div", { class: "ff-field" }, [el("label", "Articles"), itemsTbl,
              el("button", { class: "ff-btn sm ghost", style: { marginTop: "8px" }, onClick: () => { d.items.push({ desc: "", qty: 1, price: 0 }); drawItems(); refresh(); } }, "＋ Ligne")]),
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [
                checkbox("Appliquer TPS (5 %)", d.tps, (v) => { d.tps = v; refresh(); }),
                checkbox("Appliquer TVQ (9,975 %)", d.tvq, (v) => { d.tvq = v; refresh(); }),
                field("Rabais ($)", d.discount, (v) => { d.discount = v; refresh(); }, "number"),
                el("div", { class: "ff-field" }, [el("label", "Statut"), el("select", { class: "ff-select", onChange: (e) => d.status = e.target.value }, cfg.statuses.map((x) => el("option", { selected: d.status === x }, x)))])
              ]),
              el("div", { class: "ff-col" }, totalsBox)
            ]),
            field("Notes / conditions", d.notes, (v) => d.notes = v, "textarea")
          ])
        ]);
        function field(label, val, on, type) {
          const input = type === "textarea" ? el("textarea", { class: "ff-input", rows: 2, value: val, onInput: (e) => on(e.target.value) })
            : el("input", { class: "ff-input", type: type || "text", value: val, onInput: (e) => on(e.target.value) });
          return el("div", { class: "ff-field ff-col" }, [el("label", label), input]);
        }
        function checkbox(label, val, on) { const c = el("input", { type: "checkbox", checked: val, onChange: (e) => on(e.target.checked) }); return el("label", { class: "ff-field", style: { display: "flex", gap: "8px", alignItems: "center", fontWeight: "700" } }, [c, label]); }
      }

      function totalsView(t, d) {
        return el("table", { class: "ff-table" }, [
          el("tr", [el("td", "Sous-total"), el("td", { class: "num" }, fmt.money(t.sub))]),
          t.disc ? el("tr", [el("td", "Rabais"), el("td", { class: "num" }, "−" + fmt.money(t.disc))]) : null,
          d.tps ? el("tr", [el("td", "TPS (5 %)"), el("td", { class: "num" }, fmt.money(t.tps))]) : null,
          d.tvq ? el("tr", [el("td", "TVQ (9,975 %)"), el("td", { class: "num" }, fmt.money(t.tvq))]) : null,
          el("tr", [el("td", el("strong", "TOTAL")), el("td", { class: "num" }, el("strong", fmt.money(t.total)))])
        ]);
      }

      function saveDoc(d) {
        const docs = db.get("docs", []); const i = docs.findIndex((x) => x.id === d.id);
        if (i >= 0) docs[i] = d; else docs.unshift(d);
        db.set("docs", docs); biz.set("info", business); toast(cfg.title + " enregistrée", "ok"); go("list");
      }
      function toFacture(d) {
        const f = store("facture"); const docs = f.get("docs", []);
        const n = (f.get("counter", 0) || 0) + 1; f.set("counter", n);
        const copy = JSON.parse(JSON.stringify(d)); copy.id = "d" + Date.now(); copy.no = String(n).padStart(4, "0"); copy.status = "impayée";
        docs.unshift(copy); f.set("docs", docs); toast("Facture #" + copy.no + " créée", "ok");
      }
      function printable(d) {
        const t = totals(d);
        return el("div", { style: { fontFamily: "Nunito, sans-serif", color: "#15302b" } }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", borderBottom: "3px solid #0a7c64", paddingBottom: "10px" } }, [
            el("div", {}, [el("h1", { style: { margin: "0", color: "#0a7c64" } }, business.name || "Mon entreprise"),
              el("div", business.addr || ""), el("div", [business.email, business.phone].filter(Boolean).join(" · "))]),
            el("div", { style: { textAlign: "right" } }, [el("h2", { style: { margin: 0 } }, cfg.title.toUpperCase()),
              el("div", "N° " + d.no), el("div", cfg.dateLabel + " : " + fmt.date(d.date)), el("div", cfg.secondDateLabel + " : " + fmt.date(d.date2))])
          ]),
          el("div", { style: { margin: "14px 0" } }, [el("strong", "Facturé à : "), d.client.name, el("div", d.client.addr || "")]),
          el("table", { style: { width: "100%", borderCollapse: "collapse" } }, [
            el("tr", {}, [th("Description"), th("Qté", 1), th("Prix", 1), th("Montant", 1)]),
            ...d.items.map((it) => el("tr", {}, [td(it.desc), td(it.qty, 1), td(fmt.money(+it.price), 1), td(fmt.money((+it.qty || 0) * (+it.price || 0)), 1)]))
          ]),
          el("div", { style: { marginTop: "12px", marginLeft: "auto", width: "260px" } }, totalsView(t, d)),
          d.notes ? el("p", { style: { marginTop: "16px", color: "#5c726c" } }, d.notes) : null
        ]);
        function th(x, n) { return el("th", { style: { textAlign: n ? "right" : "left", borderBottom: "2px solid #d6e4e0", padding: "6px" } }, x); }
        function td(x, n) { return el("td", { style: { textAlign: n ? "right" : "left", borderBottom: "1px solid #eee", padding: "6px" } }, x); }
      }

      render();
    }
  };
};
