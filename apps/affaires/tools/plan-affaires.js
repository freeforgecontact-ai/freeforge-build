/* Plan d'Affaires Guidé — sections guidées, jauge de complétion, export PDF/MD. */
FF.register({
  id: "plan-affaires", title: "Plan d’affaires guidé", icon: "🧭", tag: "Guide",
  desc: "Un plan d’affaires complet, section par section, avec exemples et export.",
  mount(root, ctx) {
    const { el, store, save, print, toast } = ctx;
    const st = store("plan");
    const SECTIONS = [
      ["resume", "Résumé exécutif", "En 5 phrases : que fais-tu, pour qui, pourquoi maintenant ?"],
      ["probleme", "Problème", "Quel problème concret vis le client ? À quel point ça fait mal ?"],
      ["solution", "Solution / offre", "Ton produit/service et ce qui le rend unique."],
      ["marche", "Marché cible", "Qui est ton client idéal ? Taille du marché local ?"],
      ["revenus", "Modèle de revenus", "Comment tu fais de l’argent ? Prix, marges, récurrence ?"],
      ["concurrence", "Concurrence", "Qui d’autre ? Ton avantage durable ?"],
      ["marketing", "Marketing & ventes", "Comment les clients te trouvent et achètent ?"],
      ["operations", "Opérations", "Comment tu livres, fournisseurs, outils, lieux ?"],
      ["equipe", "Équipe", "Qui fait quoi ? Compétences manquantes ?"],
      ["finances", "Prévisions financières", "Revenus/dépenses 12 mois, seuil de rentabilité, besoin de financement ?"]
    ];
    let data = st.get("data", {});
    const out = el("div"); root.append(out);
    function done() { return SECTIONS.filter(([k]) => (data[k] || "").trim().length > 12).length; }
    function render() {
      ctx.clear(out);
      const d = done(), pct = Math.round(d / SECTIONS.length * 100);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [
            el("div", {}, [el("strong", "Complétion : " + d + "/" + SECTIONS.length), el("div", { style: { height: "10px", background: "var(--pg-bg)", borderRadius: "999px", overflow: "hidden", marginTop: "6px", width: "200px", border: "2px solid var(--pg-line)" } }, el("div", { style: { width: pct + "%", height: "100%", background: "var(--pg-primary)" } }))]),
            el("div", { class: "ff-btns" }, [el("button", { class: "ff-btn ghost sm", onClick: exportMd }, "⬇️ Markdown"), el("button", { class: "ff-btn accent sm", onClick: () => print("Plan d’affaires", printable()) }, "🖨️ PDF")])
          ])
        ]),
        ...SECTIONS.map(([k, title, hint]) => el("div", { class: "ff-panel" }, [
          el("h2", title),
          el("div", { class: "ff-note" }, hint),
          el("textarea", { class: "ff-input", rows: 4, value: data[k] || "", onInput: (e) => { data[k] = e.target.value; st.set("data", data); updateMeter(); } })
        ]))
      );
    }
    function updateMeter() { /* léger: re-render seulement la jauge au blur pour ne pas perdre le focus */ }
    function exportMd() {
      const md = "# Plan d’affaires\n\n" + SECTIONS.map(([k, t]) => `## ${t}\n\n${data[k] || "_(à compléter)_"}\n`).join("\n");
      save("plan-affaires.md", md, "text/markdown"); toast("Markdown exporté", "ok");
    }
    function printable() { return el("div", {}, [el("h1", "Plan d’affaires"), ...SECTIONS.map(([k, t]) => el("div", {}, [el("h2", t), el("p", { style: { whiteSpace: "pre-wrap" } }, data[k] || "—")]))]); }
    render();
  }
});
