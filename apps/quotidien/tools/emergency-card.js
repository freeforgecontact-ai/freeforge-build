/* Emergency Card Generator — formulaire, aperçu carte portefeuille, export PNG/PDF. */
FF.register({
  id: "emergency-card", title: "Emergency Card Generator", icon: "🆘", tag: "Santé",
  desc: "Génère une carte d'urgence format portefeuille. Export PNG et PDF.",
  mount(root, ctx) {
    const { el, store, toast, print, save } = ctx;
    const st = store("emergency-card");
    let data = st.get("data", {
      nom: "", ddn: "", groupeSanguin: "O+",
      contacts: [{ nom: "", tel: "", lien: "Conjoint(e)" }, { nom: "", tel: "", lien: "Parent" }],
      allergies: "", medicaments: "", medecin: "", medecinTel: "", notes: ""
    });
    const out = el("div");

    const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Inconnu"];

    function persist() { st.set("data", data); }

    function field(label, key, type, opts) {
      const isSelect = type === "select";
      let inp;
      if (isSelect) {
        inp = el("select", { class: "ff-select", onChange: e => { data[key] = e.target.value; persist(); } },
          (opts || []).map(o => el("option", { value: o, selected: data[key] === o }, o)));
      } else if (type === "textarea") {
        inp = el("textarea", { class: "ff-input", rows: 2, value: data[key] || "", placeholder: opts || "", onInput: e => { data[key] = e.target.value; persist(); } });
      } else {
        inp = el("input", { class: "ff-input", type: type || "text", value: data[key] || "", placeholder: opts || "", onInput: e => { data[key] = e.target.value; persist(); } });
      }
      return el("div", { class: "ff-field" }, [el("label", label), inp]);
    }

    function renderCard() {
      const W = 450, H = 252; // format carte bancaire ×1.5
      const canvas = el("canvas", { width: W, height: H, id: "ec-canvas", style: { borderRadius: "12px", border: "3px solid var(--pg-navy)", display: "block", maxWidth: "100%" } });
      requestAnimationFrame(() => {
        const c = canvas.getContext("2d");
        if (!c) return;
        // Fond
        const grad = c.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#0f4c81");
        grad.addColorStop(1, "#0a3559");
        c.fillStyle = grad;
        c.roundRect ? c.roundRect(0, 0, W, H, 14) : c.fillRect(0, 0, W, H);
        c.fill();
        // Bande rouge urgence
        c.fillStyle = "#b91c1c";
        c.fillRect(0, 0, 8, H);
        // Texte urgence
        c.fillStyle = "#ffd23f";
        c.font = "bold 13px 'Fredoka', 'Trebuchet MS', sans-serif";
        c.fillText("🆘 CARTE D'URGENCE", 18, 22);
        // Nom
        c.fillStyle = "#ffffff";
        c.font = "bold 22px 'Fredoka', 'Trebuchet MS', sans-serif";
        c.fillText(data.nom || "NOM COMPLET", 18, 52);
        // DDN
        if (data.ddn) { c.font = "14px Nunito, sans-serif"; c.fillStyle = "#bfe3f9"; c.fillText("Né(e) le : " + data.ddn, 18, 72); }
        // Groupe sanguin (badge)
        c.fillStyle = "#b91c1c";
        c.beginPath();
        c.roundRect ? c.roundRect(W - 70, 8, 58, 36, 8) : c.fillRect(W - 70, 8, 58, 36);
        c.fill();
        c.fillStyle = "#fff";
        c.font = "bold 18px 'Fredoka', sans-serif";
        c.textAlign = "center";
        c.fillText(data.groupeSanguin || "?", W - 41, 33);
        c.textAlign = "left";
        c.font = "10px sans-serif";
        c.fillStyle = "#ffd23f";
        c.fillText("GR. SANGUIN", W - 70, 56);
        // Séparateur
        c.strokeStyle = "rgba(255,255,255,.2)";
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(18, 82); c.lineTo(W - 18, 82); c.stroke();
        // Contacts
        let y = 98;
        c.fillStyle = "#7ec3ee";
        c.font = "bold 10px sans-serif";
        c.fillText("CONTACTS D'URGENCE", 18, y - 4);
        data.contacts.slice(0, 2).forEach(con => {
          if (!con.nom && !con.tel) return;
          c.fillStyle = "#ffffff";
          c.font = "bold 13px Nunito, sans-serif";
          c.fillText(con.nom || "—", 18, y + 12);
          c.fillStyle = "#bfe3f9";
          c.font = "12px Nunito, sans-serif";
          c.fillText(con.lien + " : " + (con.tel || "—"), 18, y + 25);
          y += 32;
        });
        // Séparateur vertical
        c.strokeStyle = "rgba(255,255,255,.15)";
        c.beginPath(); c.moveTo(W / 2, 88); c.lineTo(W / 2, H - 18); c.stroke();
        // Droite — allergies + médicaments
        let yd = 94;
        c.fillStyle = "#7ec3ee";
        c.font = "bold 10px sans-serif";
        c.fillText("ALLERGIES / MÉDICAMENTS", W / 2 + 8, yd);
        yd += 14;
        if (data.allergies) {
          c.fillStyle = "#fca5a5";
          c.font = "bold 11px Nunito, sans-serif";
          c.fillText("⚠ " + truncate(data.allergies, 28), W / 2 + 8, yd);
          yd += 16;
        }
        if (data.medicaments) {
          c.fillStyle = "#a7f3d0";
          c.font = "11px Nunito, sans-serif";
          c.fillText("💊 " + truncate(data.medicaments, 28), W / 2 + 8, yd);
          yd += 16;
        }
        if (data.medecin) {
          c.fillStyle = "#bfe3f9";
          c.font = "11px Nunito, sans-serif";
          c.fillText("👨‍⚕️ " + truncate(data.medecin, 26) + (data.medecinTel ? " " + data.medecinTel : ""), W / 2 + 8, yd);
        }
        // Footer
        c.fillStyle = "rgba(255,255,255,.3)";
        c.fillRect(0, H - 22, W, 22);
        c.fillStyle = "#0a3559";
        c.font = "bold 10px sans-serif";
        c.fillText("Généré avec FreeForge Quotidien — freeforge local", 12, H - 8);
      });
      return canvas;
    }

    function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("h2", "Mes informations"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [field("Nom complet", "nom", "text", "Jean Tremblay")]),
            el("div", { class: "ff-col" }, [field("Date de naissance", "ddn", "text", "1985-03-15")]),
            el("div", { class: "ff-col" }, [field("Groupe sanguin", "groupeSanguin", "select", BLOOD_TYPES)])
          ])
        ]),
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [
            el("h2", { style: { margin: 0 } }, "Contacts d'urgence"),
            el("button", { class: "ff-btn sm primary", onClick: () => { data.contacts.push({ nom: "", tel: "", lien: "Autre" }); persist(); render(); } }, "＋")
          ]),
          ...data.contacts.map((con, i) => el("div", { style: { border: "2px solid var(--pg-sky2)", borderRadius: "10px", padding: "12px", marginTop: "10px" } }, [
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Nom"), el("input", { class: "ff-input", value: con.nom, onInput: e => { con.nom = e.target.value; persist(); } })])]),
              el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Téléphone"), el("input", { class: "ff-input", type: "tel", value: con.tel, onInput: e => { con.tel = e.target.value; persist(); } })])]),
              el("div", { class: "ff-col" }, [el("div", { class: "ff-field" }, [el("label", "Lien"), el("input", { class: "ff-input", value: con.lien, onInput: e => { con.lien = e.target.value; persist(); } })])]),
              el("div", { class: "ff-col", style: { flex: "0 0 auto" } }, [el("button", { class: "ff-btn sm ghost", style: { marginTop: "22px" }, onClick: () => { data.contacts.splice(i, 1); persist(); render(); } }, "✕")])
            ])
          ]))
        ]),
        el("div", { class: "ff-panel" }, [
          el("h2", "Informations médicales"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [field("Allergies", "allergies", "textarea", "Pénicilline, noix…")]),
            el("div", { class: "ff-col" }, [field("Médicaments réguliers", "medicaments", "textarea", "Metformine 500mg…")])
          ]),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [field("Médecin de famille", "medecin", "text", "Dr. Lemieux")]),
            el("div", { class: "ff-col" }, [field("Tél. médecin", "medecinTel", "tel", "514-555-9999")])
          ]),
          field("Notes supplémentaires", "notes", "textarea", "Diabétique type 2, porteur stimulateur cardiaque…")
        ]),
        el("div", { class: "ff-panel" }, [
          el("h2", "Aperçu de la carte"),
          el("div", { class: "ff-note" }, "Imprimez, plastifiez et gardez dans votre portefeuille ou votre sac."),
          el("div", { style: { marginBottom: "14px" } }, [renderCard()]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: () => {
              const canvas = document.getElementById("ec-canvas");
              if (!canvas) return toast("Génère d'abord la carte", "err");
              canvas.toBlob(blob => { save("carte-urgence.png", blob, "image/png"); toast("PNG exporté", "ok"); }, "image/png");
            }}, "⬇️ Exporter PNG"),
            el("button", { class: "ff-btn accent", onClick: () => {
              const canvas = document.getElementById("ec-canvas");
              if (!canvas) return toast("Génère d'abord la carte", "err");
              const wrap = el("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" } });
              wrap.append(canvas.cloneNode(true));
              wrap.append(el("p", { style: { color: "#666", fontSize: "12px" } }, "Carte d'urgence — " + (data.nom || "") + " — " + new Date().toLocaleDateString("fr-CA")));
              print("Carte d'urgence — " + (data.nom || ""), wrap);
            }}, "🖨 Imprimer / PDF")
          ])
        ])
      );
    }
    root.append(out);
    render();
  }
});
