/* RegEx Tester & Parser — test live, groupes, remplacement, presets. */
FF.register({
  id: "regex", title: "RegEx Tester & Parser", icon: "🔎", tag: "Dev",
  desc: "Teste tes expressions régulières en direct : correspondances, groupes, remplacement.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;
    const st = store("regex");
    let s = st.get("s", { pat: "(\\w+)@(\\w+)\\.(\\w+)", flags: "g", txt: "Écris à contact@pgrg.ca ou info@freeforge.ca !", rep: "$1 [at] $2" });
    const PRESETS = { "Courriel": "[\\w.+-]+@[\\w-]+\\.[\\w.-]+", "Téléphone (QC)": "\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}", "URL": "https?://[\\w./?=&#-]+", "Code postal CA": "[A-Za-z]\\d[A-Za-z][\\s-]?\\d[A-Za-z]\\d", "Nombre": "-?\\d+(\\.\\d+)?" };
    const out = el("div");
    function render() {
      ctx.clear(out);
      let re = null, err = null; try { re = new RegExp(s.pat, s.flags); } catch (e) { err = e.message; }
      const matches = []; if (re && s.flags.includes("g")) { let m; const r2 = new RegExp(s.pat, s.flags); let guard = 0; while ((m = r2.exec(s.txt)) && guard++ < 5000) { matches.push(m); if (m.index === r2.lastIndex) r2.lastIndex++; } } else if (re) { const m = re.exec(s.txt); if (m) matches.push(m); }
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-field" }, [el("label", "Motif (regex)"), el("div", { class: "ff-inline", style: { display: "flex", gap: "8px" } }, [
            el("input", { class: "ff-input", value: s.pat, spellcheck: false, style: { fontFamily: "ui-monospace,monospace" }, onInput: (e) => { s.pat = e.target.value; persist(); render(); } }),
            el("input", { class: "ff-input", value: s.flags, style: { width: "80px", fontFamily: "ui-monospace,monospace" }, title: "flags (g,i,m,s,u)", onInput: (e) => { s.flags = e.target.value; persist(); render(); } })
          ])]),
          el("div", {}, Object.keys(PRESETS).map((k) => el("button", { class: "ff-chip", style: { cursor: "pointer" }, onClick: () => { s.pat = PRESETS[k]; persist(); render(); } }, k))),
          el("div", { class: "ff-field", style: { marginTop: "10px" } }, [el("label", "Texte de test"), el("textarea", { class: "ff-input", rows: 4, value: s.txt, onInput: (e) => { s.txt = e.target.value; persist(); render(); } })]),
          err ? el("div", { class: "ff-note", style: { color: "var(--pg-err)", borderColor: "var(--pg-err)" } }, "✗ " + err)
            : el("div", { class: "ff-chip", style: { background: "#dcfce7", color: "var(--pg-ok)", borderColor: "var(--pg-ok)" } }, "✓ " + matches.length + " correspondance(s)")
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Correspondances"), matches.length ? el("table", { class: "ff-table" }, [
          el("tr", [el("th", "#"), el("th", "Texte"), el("th", "Position"), el("th", "Groupes")]),
          ...matches.map((m, i) => el("tr", [el("td", String(i + 1)), el("td", el("code", m[0])), el("td", String(m.index)), el("td", m.slice(1).map((g, j) => el("span", { class: "ff-chip" }, (j + 1) + ": " + (g == null ? "∅" : g))))]))
        ]) : el("div", { class: "ff-empty" }, "Aucune correspondance.")]),
        el("div", { class: "ff-panel" }, [el("h2", "Remplacement"),
          el("div", { class: "ff-field" }, [el("label", ["Remplacer par ", el("span", { class: "hint" }, "($1, $2… pour les groupes)")]), el("input", { class: "ff-input", value: s.rep, onInput: (e) => { s.rep = e.target.value; persist(); render(); } })]),
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, "Résultat"), el("div", { style: { fontSize: "1rem", color: "#fff", marginTop: "6px", wordBreak: "break-word" } }, re ? safeReplace(re) : "—")]),
          el("button", { class: "ff-btn ghost", style: { marginTop: "10px" }, onClick: () => copy(re ? safeReplace(re) : "") }, "📋 Copier le résultat")
        ])
      );
      function safeReplace(re) { try { return s.txt.replace(new RegExp(s.pat, s.flags.includes("g") ? s.flags : s.flags + "g"), s.rep); } catch (e) { return "—"; } }
    }
    function persist() { st.set("s", s); }
    root.append(out); render();
  }
});
