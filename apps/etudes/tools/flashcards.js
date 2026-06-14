/* Flashcard Active Quizzer — répétition espacée (Leitner) persistée. */
FF.register({
  id: "flashcards", title: "Flashcards (révision espacée)", icon: "🃏", tag: "SRS",
  desc: "Crée des cartes et révise avec la méthode Leitner — l’app espace les rappels.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("flashcards");
    let cards = st.get("cards", [{ f: "Capitale du Québec ?", b: "Québec", box: 1, due: 0 }, { f: "2 + 2 × 3 ?", b: "8", box: 1, due: 0 }]);
    const INTERVAL = [0, 1, 2, 4, 8, 16]; // jours par boîte
    let mode = "list", cur = null, flipped = false;
    const out = el("div");
    function persist() { st.set("cards", cards); }
    function due() { const now = Date.now(); return cards.filter((c) => (c.due || 0) <= now); }
    function answer(ok) { if (ok) cur.box = Math.min(5, (cur.box || 1) + 1); else cur.box = 1; cur.due = Date.now() + INTERVAL[cur.box] * 864e5; persist(); next(); }
    function next() { const d = due(); flipped = false; cur = d[0] || null; render(); }
    function render() {
      ctx.clear(out);
      if (mode === "study") {
        if (!cur) { out.append(el("div", { class: "ff-panel" }, [el("div", { class: "ff-empty" }, "🎉 Tout est révisé pour l’instant !"), el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [el("button", { class: "ff-btn ghost", onClick: () => { mode = "list"; render(); } }, "‹ Retour")])])); return; }
        out.append(el("div", { class: "ff-panel" }, [
          el("div", { onClick: () => { flipped = !flipped; render(); }, style: { cursor: "pointer", minHeight: "160px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: "1.4rem", fontWeight: "800", background: flipped ? "var(--pg-pale)" : "#fff", border: "3px solid var(--pg-navy)", borderRadius: "16px", padding: "24px" } }, flipped ? cur.b : cur.f),
          el("div", { style: { textAlign: "center", color: "var(--pg-mut)", marginTop: "8px", fontSize: ".85rem" } }, flipped ? "(réponse)" : "(clique pour retourner)"),
          flipped ? el("div", { class: "ff-btns", style: { justifyContent: "center", marginTop: "12px" } }, [el("button", { class: "ff-btn", style: { background: "var(--pg-err)" }, onClick: () => answer(false) }, "À revoir"), el("button", { class: "ff-btn", style: { background: "var(--pg-ok)" }, onClick: () => answer(true) }, "✓ Compris")]) : null,
          el("div", { style: { textAlign: "center", marginTop: "10px", color: "var(--pg-mut)" } }, due().length + " carte(s) à réviser")
        ]));
        return;
      }
      const inputs = {};
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-stats" }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(cards.length)), el("div", { class: "k" }, "Cartes")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(due().length)), el("div", { class: "k" }, "À réviser")])
        ]), el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [el("button", { class: "ff-btn primary", onClick: () => { mode = "study"; next(); } }, "▶ Réviser (" + due().length + ")")])]),
        el("div", { class: "ff-panel" }, [el("h2", "Nouvelle carte"),
          el("div", { class: "ff-row" }, [el("div", { class: "ff-field ff-col" }, [el("label", "Recto (question)"), inputs.f = el("input", { class: "ff-input" })]), el("div", { class: "ff-field ff-col" }, [el("label", "Verso (réponse)"), inputs.b = el("input", { class: "ff-input" })])]),
          el("button", { class: "ff-btn primary", onClick: () => { if (inputs.f.value) { cards.push({ f: inputs.f.value, b: inputs.b.value, box: 1, due: 0 }); persist(); render(); toast("Carte ajoutée", "ok"); } } }, "＋ Ajouter")]),
        el("div", { class: "ff-panel" }, [el("h2", "Mes cartes"), cards.length ? el("table", { class: "ff-table" }, [el("tr", [el("th", "Question"), el("th", "Réponse"), el("th", "Boîte"), el("th", "")]), ...cards.map((c, i) => el("tr", [el("td", c.f), el("td", c.b), el("td", el("span", { class: "ff-chip" }, "B" + (c.box || 1))), el("td", el("button", { class: "ff-btn sm ghost", onClick: () => { cards.splice(i, 1); persist(); render(); } }, "✕"))]))]) : el("div", { class: "ff-empty" }, "Aucune carte.")])
      );
    }
    root.append(out); render();
  }
});
