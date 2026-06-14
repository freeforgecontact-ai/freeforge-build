/* Resume/CV Builder — sections éditables, aperçu A4, export PDF, persistance. */
FF.register({
  id: "cv", title: "Resume / CV Builder", icon: "📄", tag: "CV",
  desc: "Construis ton CV section par section. Aperçu style A4 et export PDF.",
  mount(root, ctx) {
    const { el, store, toast, print, copy } = ctx;
    const st = store("cv");
    let data = st.get("data", {
      nom: "", titre: "", courriel: "", telephone: "", ville: "", linkedin: "",
      resume: "",
      experiences: [{ poste: "Développeur Web", entreprise: "Acme Inc.", periode: "2021–présent", desc: "Développement d'applications React et Node.js." }],
      formations: [{ diplome: "Baccalauréat en informatique", etablissement: "Université de Montréal", annee: "2021" }],
      competences: "JavaScript, React, Node.js, SQL, Git"
    });
    let tab = "edit";
    const out = el("div");

    function persist() { st.set("data", data); }

    function field(label, key, type, placeholder) {
      const inp = type === "textarea"
        ? el("textarea", { class: "ff-input", rows: 3, value: data[key] || "", placeholder: placeholder || "", onInput: e => { data[key] = e.target.value; persist(); if (tab === "preview") render(); } })
        : el("input", { class: "ff-input", type: type || "text", value: data[key] || "", placeholder: placeholder || "", onInput: e => { data[key] = e.target.value; persist(); } });
      return el("div", { class: "ff-field" }, [el("label", label), inp]);
    }

    function renderPreview() {
      return el("div", { id: "cv-preview", style: { background: "#fff", color: "#1a1a1a", padding: "32px 40px", maxWidth: "740px", margin: "0 auto", fontFamily: "Nunito, sans-serif", fontSize: "14px", lineHeight: "1.6", border: "3px solid var(--pg-navy)", borderRadius: "14px" } }, [
        el("div", { style: { borderBottom: "3px solid #0f4c81", paddingBottom: "14px", marginBottom: "16px" } }, [
          el("h1", { style: { margin: "0 0 4px", fontSize: "28px", color: "#0f4c81", fontFamily: "Fredoka, sans-serif" } }, data.nom || "Ton nom"),
          data.titre ? el("div", { style: { fontSize: "16px", color: "#f97316", fontWeight: "700" } }, data.titre) : null,
          el("div", { style: { marginTop: "6px", fontSize: "13px", color: "#5b6b7c", display: "flex", flexWrap: "wrap", gap: "12px" } }, [
            data.courriel ? el("span", "✉ " + data.courriel) : null,
            data.telephone ? el("span", "📞 " + data.telephone) : null,
            data.ville ? el("span", "📍 " + data.ville) : null,
            data.linkedin ? el("span", "🔗 " + data.linkedin) : null
          ].filter(Boolean))
        ]),
        data.resume ? sectionCV("Résumé professionnel", el("p", { style: { margin: 0 } }, data.resume)) : null,
        data.experiences && data.experiences.length ? sectionCV("Expériences", el("div", data.experiences.map(ex => el("div", { style: { marginBottom: "12px" } }, [
          el("div", { style: { display: "flex", justifyContent: "space-between" } }, [
            el("strong", ex.poste || "Poste"),
            el("span", { style: { color: "#5b6b7c", fontSize: "12px" } }, ex.periode || "")
          ]),
          el("div", { style: { color: "#f97316", fontSize: "13px", fontWeight: "700" } }, ex.entreprise || ""),
          ex.desc ? el("p", { style: { margin: "4px 0 0", color: "#374151" } }, ex.desc) : null
        ])))) : null,
        data.formations && data.formations.length ? sectionCV("Formation", el("div", data.formations.map(fo => el("div", { style: { marginBottom: "8px" } }, [
          el("strong", fo.diplome || "Diplôme"),
          el("div", { style: { color: "#5b6b7c", fontSize: "13px" } }, (fo.etablissement || "") + (fo.annee ? " · " + fo.annee : ""))
        ])))) : null,
        data.competences ? sectionCV("Compétences", el("p", { style: { margin: 0 } }, data.competences)) : null
      ]);
      function sectionCV(titre, content) {
        return el("div", { style: { marginBottom: "18px" } }, [
          el("h2", { style: { fontSize: "16px", color: "#0f4c81", borderBottom: "2px solid #bfe3f9", paddingBottom: "4px", margin: "0 0 10px", fontFamily: "Fredoka, sans-serif" } }, titre),
          content
        ]);
      }
    }

    function render() {
      ctx.clear(out);
      const segEdit = el("button", { class: "ff-seg" + (tab === "edit" ? " on" : ""), onClick: () => { tab = "edit"; render(); } }, "✏️ Éditer");
      const segPrev = el("button", { class: "ff-seg" + (tab === "preview" ? " on" : ""), onClick: () => { tab = "preview"; render(); } }, "👁 Aperçu");
      const seg = el("div", { class: "ff-seg" }, [segEdit, segPrev]);
      if (tab === "edit") {
        out.append(
          el("div", { class: "ff-panel" }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" } }, [
              el("h2", { style: { margin: 0 } }, "Mes informations"),
              seg
            ]),
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [field("Nom complet", "nom", "text", "Jean Tremblay")]),
              el("div", { class: "ff-col" }, [field("Titre professionnel", "titre", "text", "Développeur Full-Stack")])
            ]),
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [field("Courriel", "courriel", "email", "jean@email.com")]),
              el("div", { class: "ff-col" }, [field("Téléphone", "telephone", "tel", "514-555-1234")])
            ]),
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [field("Ville", "ville", "text", "Montréal, QC")]),
              el("div", { class: "ff-col" }, [field("LinkedIn / Site", "linkedin", "text", "linkedin.com/in/jean")])
            ]),
            field("Résumé professionnel", "resume", "textarea", "Bref résumé de ton profil..."),
            field("Compétences (séparées par virgule)", "competences", "textarea", "JavaScript, Python, SQL...")
          ]),
          el("div", { class: "ff-panel" }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [
              el("h2", { style: { margin: 0 } }, "Expériences"),
              el("button", { class: "ff-btn sm primary", onClick: () => { data.experiences.push({ poste: "", entreprise: "", periode: "", desc: "" }); persist(); render(); } }, "＋ Ajouter")
            ]),
            ...data.experiences.map((ex, i) => el("div", { style: { border: "2px solid var(--pg-sky2)", borderRadius: "12px", padding: "14px", marginTop: "12px" } }, [
              el("div", { class: "ff-row" }, [
                el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Poste"), el("input", { class: "ff-input", value: ex.poste, onInput: e => { ex.poste = e.target.value; persist(); } })])]),
                el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Entreprise"), el("input", { class: "ff-input", value: ex.entreprise, onInput: e => { ex.entreprise = e.target.value; persist(); } })])])
              ]),
              el("div", { class: "ff-row" }, [
                el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Période"), el("input", { class: "ff-input", value: ex.periode, placeholder: "2020–2022", onInput: e => { ex.periode = e.target.value; persist(); } })])]),
                el("div", { class: "ff-col" }, [el("button", { class: "ff-btn sm ghost", style: { marginTop: "24px" }, onClick: () => { data.experiences.splice(i, 1); persist(); render(); } }, "✕ Retirer")])
              ]),
              el("div", { class: "ff-field" }, [el("label", "Description"), el("textarea", { class: "ff-input", rows: 2, value: ex.desc, onInput: e => { ex.desc = e.target.value; persist(); } })])
            ]))
          ]),
          el("div", { class: "ff-panel" }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [
              el("h2", { style: { margin: 0 } }, "Formation"),
              el("button", { class: "ff-btn sm primary", onClick: () => { data.formations.push({ diplome: "", etablissement: "", annee: "" }); persist(); render(); } }, "＋ Ajouter")
            ]),
            ...data.formations.map((fo, i) => el("div", { style: { border: "2px solid var(--pg-sky2)", borderRadius: "12px", padding: "14px", marginTop: "12px" } }, [
              el("div", { class: "ff-row" }, [
                el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Diplôme"), el("input", { class: "ff-input", value: fo.diplome, onInput: e => { fo.diplome = e.target.value; persist(); } })])]),
                el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Établissement"), el("input", { class: "ff-input", value: fo.etablissement, onInput: e => { fo.etablissement = e.target.value; persist(); } })])])
              ]),
              el("div", { class: "ff-row" }, [
                el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Année"), el("input", { class: "ff-input", value: fo.annee, placeholder: "2021", onInput: e => { fo.annee = e.target.value; persist(); } })])]),
                el("div", { class: "ff-col" }, [el("button", { class: "ff-btn sm ghost", style: { marginTop: "24px" }, onClick: () => { data.formations.splice(i, 1); persist(); render(); } }, "✕ Retirer")])
              ])
            ]))
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: () => { tab = "preview"; render(); } }, "👁 Aperçu"),
            el("button", { class: "ff-btn accent", onClick: () => { const prev = document.getElementById("cv-preview"); if (prev) print("CV — " + (data.nom || "CV"), prev); else { tab = "preview"; render(); setTimeout(() => { const p = document.getElementById("cv-preview"); if (p) print("CV", p); }, 100); } } }, "🖨 Exporter PDF")
          ])
        );
      } else {
        out.append(
          el("div", { class: "ff-panel" }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" } }, [
              el("h2", { style: { margin: 0 } }, "Aperçu du CV"),
              el("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap" } }, [
                seg,
                el("button", { class: "ff-btn accent", onClick: () => { const p = document.getElementById("cv-preview"); if (p) print("CV — " + (data.nom || "CV"), p); } }, "🖨 PDF")
              ])
            ]),
            renderPreview()
          ])
        );
      }
    }
    root.append(out);
    render();
  }
});
