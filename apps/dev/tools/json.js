/* Formatteur & Arbre JSON — format, minify, validation, arbre repliable, stats. */
FF.register({
  id: "json", title: "Formatteur & Arbre JSON", icon: "🧩", tag: "Data",
  desc: "Formate, minifie, valide et explore ton JSON en arbre repliable.",
  mount(root, ctx) {
    const { el, store, toast, copy, save } = ctx;
    const st = store("json");
    let src = st.get("src", '{\n  "produit": "FreeForge",\n  "actif": true,\n  "outils": 91,\n  "tags": ["pme","local"]\n}');
    const ta = el("textarea", { class: "ff-input", rows: 12, value: src, spellcheck: false, style: { fontFamily: "ui-monospace,Consolas,monospace", fontSize: ".9rem" }, onInput: (e) => { src = e.target.value; st.set("src", src); run(); } });
    const status = el("div"); const tree = el("div"); const stats = el("div");
    function parse() { try { return { ok: true, val: JSON.parse(src) }; } catch (e) { return { ok: false, err: e.message }; } }
    function run() {
      const r = parse(); ctx.clear(status); ctx.clear(tree); ctx.clear(stats);
      if (!r.ok) { status.append(el("div", { class: "ff-note", style: { borderColor: "var(--pg-err)", color: "var(--pg-err)", background: "#fdecec" } }, "✗ JSON invalide : " + r.err)); return; }
      status.append(el("div", { class: "ff-chip", style: { background: "#dcfce7", color: "var(--pg-ok)", borderColor: "var(--pg-ok)" } }, "✓ JSON valide"));
      const s = analyze(r.val); stats.append(el("div", { class: "ff-stats" }, [
        stat(String(s.keys), "Clés"), stat(String(s.depth), "Profondeur"), stat(String(s.arrays), "Tableaux"), stat(JSON.stringify(r.val).length + " o", "Taille minifiée")
      ]));
      tree.append(node("racine", r.val, true));
    }
    function analyze(v, d = 1) { let keys = 0, depth = d, arrays = 0; if (Array.isArray(v)) { arrays++; v.forEach((x) => { const a = analyze(x, d + 1); keys += a.keys; depth = Math.max(depth, a.depth); arrays += a.arrays; }); } else if (v && typeof v === "object") { for (const k in v) { keys++; const a = analyze(v[k], d + 1); keys += a.keys; depth = Math.max(depth, a.depth); arrays += a.arrays; } } return { keys, depth, arrays }; }
    function node(key, val, open) {
      const isObj = val && typeof val === "object";
      if (!isObj) return el("div", { style: { padding: "1px 0", fontFamily: "ui-monospace,monospace", fontSize: ".88rem" } }, [el("b", { style: { color: "var(--pg-blue)" } }, key + ": "), el("span", { style: { color: typeof val === "string" ? "#0a7c64" : "#b45309" } }, JSON.stringify(val))]);
      const kids = el("div", { style: { paddingLeft: "16px", display: open ? "block" : "none", borderLeft: "2px solid var(--pg-sky2)", marginLeft: "4px" } });
      const entries = Array.isArray(val) ? val.map((v, i) => [i, v]) : Object.entries(val);
      entries.forEach(([k, v]) => kids.append(node(k, v, false)));
      const tog = el("div", { style: { cursor: "pointer", padding: "1px 0", fontFamily: "ui-monospace,monospace", fontSize: ".88rem", fontWeight: "700" }, onClick: () => { const o = kids.style.display === "none"; kids.style.display = o ? "block" : "none"; cap.textContent = (o ? "▾ " : "▸ ") + key + " " + meta; } });
      const meta = Array.isArray(val) ? `[${val.length}]` : `{${Object.keys(val).length}}`;
      const cap = el("span", { style: { color: "var(--pg-navy)" } }, (open ? "▾ " : "▸ ") + key + " " + meta); tog.append(cap);
      return el("div", {}, [tog, kids]);
    }
    function stat(v, k) { return el("div", { class: "ff-stat" }, [el("div", { class: "v" }, v), el("div", { class: "k" }, k)]); }
    root.append(
      el("div", { class: "ff-panel" }, [el("div", { class: "ff-field" }, [el("label", "JSON"), ta]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: () => { const r = parse(); if (r.ok) { src = JSON.stringify(r.val, null, 2); ta.value = src; st.set("src", src); run(); toast("Formaté", "ok"); } else toast("JSON invalide", "err"); } }, "✨ Formater"),
          el("button", { class: "ff-btn ghost", onClick: () => { const r = parse(); if (r.ok) { src = JSON.stringify(r.val); ta.value = src; st.set("src", src); run(); } } }, "Minifier"),
          el("button", { class: "ff-btn ghost", onClick: () => { const r = parse(); if (r.ok) { src = JSON.stringify(sortDeep(r.val), null, 2); ta.value = src; st.set("src", src); run(); toast("Clés triées", "ok"); } } }, "Trier clés"),
          el("button", { class: "ff-btn ghost", onClick: () => copy(ta.value) }, "📋 Copier"),
          el("button", { class: "ff-btn ghost", onClick: () => save("data.json", ta.value, "application/json") }, "⬇️ .json")
        ]), status, stats]),
      el("div", { class: "ff-panel" }, [el("h2", "Arbre"), tree])
    );
    function sortDeep(v) { if (Array.isArray(v)) return v.map(sortDeep); if (v && typeof v === "object") return Object.keys(v).sort().reduce((o, k) => (o[k] = sortDeep(v[k]), o), {}); return v; }
    run();
  }
});
