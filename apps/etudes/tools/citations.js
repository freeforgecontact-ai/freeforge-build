/* Générateur de Citations — APA, MLA, Chicago + bibliographie. */
FF.register({
  id: "citations", title: "Générateur de Citations", icon: "📚", tag: "Biblio",
  desc: "Crée des références APA, MLA ou Chicago et bâtis ta bibliographie.",
  mount(root, ctx) {
    const { el, store, copy, toast, save } = ctx;
    const st = store("citations");
    let f = st.get("f", { type: "web", style: "APA", author: "Tremblay, J.", title: "Les outils PME", year: "2026", source: "FreeForge", url: "https://freeforge.pgrg.ca", accessed: "2026-06-13" });
    let biblio = st.get("biblio", []);
    function format(c) {
      const A = c.author || "Auteur inconnu";
      if (c.style === "APA") return c.type === "web" ? `${A} (${c.year}). ${c.title}. ${c.source}. ${c.url}` : c.type === "journal" ? `${A} (${c.year}). ${c.title}. ${c.source}.` : `${A} (${c.year}). ${c.title}. ${c.source}.`;
      if (c.style === "MLA") return c.type === "web" ? `${A}. « ${c.title}. » ${c.source}, ${c.year}, ${c.url}. Consulté le ${c.accessed}.` : `${A}. ${c.title}. ${c.source}, ${c.year}.`;
      return `${A}. « ${c.title}. » ${c.source} (${c.year}).${c.url ? " " + c.url + "." : ""}`; // Chicago
    }
    const out = el("div");
    function persist() { st.set("f", f); st.set("biblio", biblio); }
    function fld(label, key) { return el("div", { class: "ff-field ff-col" }, [el("label", label), el("input", { class: "ff-input", value: f[key], onInput: (e) => { f[key] = e.target.value; persist(); render(); } })]); }
    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-field ff-col" }, [el("label", "Type"), el("select", { class: "ff-select", onChange: (e) => { f.type = e.target.value; persist(); render(); } }, [["web", "Site web"], ["book", "Livre"], ["journal", "Article"]].map(([v, l]) => el("option", { value: v, selected: f.type === v }, l)))]),
            el("div", { class: "ff-field ff-col" }, [el("label", "Style"), el("div", { class: "ff-seg" }, ["APA", "MLA", "Chicago"].map((s) => el("button", { class: f.style === s ? "on" : "", onClick: () => { f.style = s; persist(); render(); } }, s)))])
          ]),
          el("div", { class: "ff-row" }, [fld("Auteur (Nom, P.)", "author"), fld("Année", "year")]),
          fld("Titre", "title"), fld(f.type === "journal" ? "Revue" : (f.type === "book" ? "Éditeur" : "Site/Source"), "source"),
          f.type === "web" ? el("div", { class: "ff-row" }, [fld("URL", "url"), fld("Consulté le", "accessed")]) : null,
          el("div", { class: "ff-result" }, [el("div", { class: "lbl" }, f.style), el("div", { style: { fontSize: "1rem", color: "#fff", marginTop: "8px", textAlign: "left" } }, format(f))]),
          el("div", { class: "ff-btns" }, [el("button", { class: "ff-btn primary", onClick: () => { biblio.push(format(f)); persist(); render(); toast("Ajouté à la bibliographie", "ok"); } }, "＋ À la bibliographie"), el("button", { class: "ff-btn ghost", onClick: () => copy(format(f)) }, "📋 Copier")])
        ]),
        biblio.length ? el("div", { class: "ff-panel" }, [el("div", { style: { display: "flex", justifyContent: "space-between" } }, [el("h2", { style: { margin: 0 } }, "Bibliographie"), el("button", { class: "ff-btn sm ghost", onClick: () => save("bibliographie.txt", biblio.join("\n\n"), "text/plain") }, "⬇️ Exporter")]),
          ...biblio.map((b, i) => el("div", { style: { borderBottom: "1px solid var(--pg-sky2)", padding: "8px 0", display: "flex", justifyContent: "space-between", gap: "8px" } }, [el("span", b), el("button", { class: "ff-btn sm ghost", onClick: () => { biblio.splice(i, 1); persist(); render(); } }, "✕")]))]) : null
      );
    }
    root.append(out); render();
  }
});
