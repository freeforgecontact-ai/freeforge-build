/* Gestionnaire de Reçus & ZIP — catégories, totaux, photos, export ZIP (store, 100% local). */
FF.register({
  id: "recus", title: "Reçus & ZIP", icon: "🧾", tag: "Dépenses",
  desc: "Classe tes reçus (catégories, photos), vois les totaux et exporte un ZIP.",
  mount(root, ctx) {
    const { el, store, fmt, round2, save, toast } = ctx;
    const st = store("recus");
    const CATS = ["Bureau", "Déplacement", "Repas", "Matériel", "Logiciel", "Marketing", "Autre"];
    let list = st.get("list", []);
    const out = el("div"); root.append(out);

    function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
    function zip(files) {
      const enc = new TextEncoder(), parts = [], central = []; let off = 0;
      const u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
      for (const f of files) {
        const name = enc.encode(f.name), crc = crc32(f.bytes), sz = f.bytes.length;
        const lh = [80, 75, 3, 4, ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(name.length), ...u16(0)];
        const local = new Uint8Array(lh.length + name.length + sz); local.set(lh, 0); local.set(name, lh.length); local.set(f.bytes, lh.length + name.length);
        parts.push(local);
        const ch = [80, 75, 1, 2, ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)];
        const cen = new Uint8Array(ch.length + name.length); cen.set(ch, 0); cen.set(name, ch.length); central.push(cen); off += local.length;
      }
      const cenSize = central.reduce((a, c) => a + c.length, 0);
      const eocd = new Uint8Array([80, 75, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cenSize), ...u32(off), ...u16(0)]);
      const all = [...parts, ...central, eocd]; const total = all.reduce((a, p) => a + p.length, 0);
      const res = new Uint8Array(total); let o = 0; for (const p of all) { res.set(p, o); o += p.length; } return res;
    }

    function render() {
      ctx.clear(out);
      const total = round2(list.reduce((a, r) => a + (+r.amount || 0), 0));
      const tax = round2(list.reduce((a, r) => a + (+r.tax || 0), 0));
      const byCat = {}; list.forEach((r) => byCat[r.cat] = round2((byCat[r.cat] || 0) + (+r.amount || 0)));
      const inp = {};
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-stats" }, [
          stat(String(list.length), "Reçus"), stat(fmt.money(total), "Total"), stat(fmt.money(tax), "Taxes")
        ])]),
        el("div", { class: "ff-panel" }, [
          el("h2", "Ajouter un reçu"),
          el("div", { class: "ff-row" }, [
            field("Date", "date", "date", new Date().toISOString().slice(0, 10)),
            field("Commerçant", "vendor", "text", ""),
            selectField("Catégorie", "cat", CATS),
            field("Montant ($)", "amount", "number", ""), field("Taxes ($)", "tax", "number", "")
          ]),
          el("div", { class: "ff-field" }, [el("label", "Photo (optionnel)"), el("input", { class: "ff-input", type: "file", accept: "image/*", id: "recuPhoto" })]),
          el("div", { class: "ff-btns" }, [el("button", { class: "ff-btn primary", onClick: add }, "＋ Ajouter")])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Reçus"),
            list.length ? el("div", {}, [el("button", { class: "ff-btn sm ghost", onClick: exportCsv }, "⬇️ CSV"), el("button", { class: "ff-btn sm ghost", style: { marginLeft: "6px" }, onClick: exportZip }, "🗜️ ZIP")]) : null]),
          Object.keys(byCat).length ? el("div", { style: { margin: "6px 0" } }, Object.keys(byCat).map((c) => el("span", { class: "ff-chip" }, c + " : " + fmt.money(byCat[c])))) : null,
          list.length ? el("table", { class: "ff-table" }, [
            el("tr", [el("th", "Date"), el("th", "Commerçant"), el("th", "Catégorie"), el("th", { class: "num" }, "Montant"), el("th", "")]),
            ...list.map((r, i) => el("tr", [el("td", fmt.date(r.date)), el("td", [r.photo ? el("span", { title: "photo jointe" }, "📎 ") : "", r.vendor || "—"]), el("td", el("span", { class: "ff-chip" }, r.cat)), el("td", { class: "num" }, fmt.money(+r.amount)),
              el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => { list.splice(i, 1); st.set("list", list); render(); } }, "✕"))]))
          ]) : el("div", { class: "ff-empty" }, "Aucun reçu.")
        ])
      );
      function field(label, key, type, val) { const i = el("input", { class: "ff-input", type, value: val }); inp[key] = i; return el("div", { class: "ff-field ff-col" }, [el("label", label), i]); }
      function selectField(label, key, opts) { const s = el("select", { class: "ff-select" }, opts.map((o) => el("option", o))); inp[key] = s; return el("div", { class: "ff-field ff-col" }, [el("label", label), s]); }
      function stat(v, k) { return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]); }
      function add() {
        const amount = +inp.amount.value; if (!amount) { toast("Montant requis", "err"); return; }
        const rec = { date: inp.date.value, vendor: inp.vendor.value, cat: inp.cat.value, amount, tax: +inp.tax.value || 0 };
        const file = document.getElementById("recuPhoto").files[0];
        if (file) { const rd = new FileReader(); rd.onload = () => { rec.photo = rd.result; commit(rec); }; rd.readAsDataURL(file); }
        else commit(rec);
      }
      function commit(rec) { list.unshift(rec); st.set("list", list); render(); }
    }
    function exportCsv() {
      const rows = [["Date", "Commercant", "Categorie", "Montant", "Taxes"], ...list.map((r) => [r.date, r.vendor, r.cat, r.amount, r.tax])];
      save("recus.csv", rows.map((r) => r.map((c) => '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"').join(",")).join("\n"), "text/csv");
    }
    function exportZip() {
      const enc = new TextEncoder(); const files = [];
      const csv = [["Date", "Commercant", "Categorie", "Montant", "Taxes"], ...list.map((r) => [r.date, r.vendor, r.cat, r.amount, r.tax])].map((r) => r.join(",")).join("\n");
      files.push({ name: "recus.csv", bytes: enc.encode(csv) });
      list.forEach((r, i) => { if (r.photo && r.photo.indexOf("base64,") > 0) { const b64 = r.photo.split("base64,")[1]; const bin = atob(b64); const u = new Uint8Array(bin.length); for (let j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j); const ext = (r.photo.slice(11, 20).match(/(png|jpe?g|webp)/) || ["jpg"])[0]; files.push({ name: `photos/recu-${i + 1}-${(r.vendor || "recu").replace(/\W+/g, "_")}.${ext}`, bytes: u }); } });
      save("recus.zip", zip(files), "application/zip"); toast("ZIP exporté (" + files.length + " fichiers)", "ok");
    }
    render();
  }
});
