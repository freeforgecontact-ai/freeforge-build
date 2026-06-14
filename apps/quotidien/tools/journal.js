/* Journal & Mood Tracker — chiffrement AES-GCM (Web Crypto), clé PBKDF2. */
FF.register({
  id: "journal", title: "Journal & Mood Tracker", icon: "📔", tag: "Journal",
  desc: "Entrées chiffrées AES-GCM (PBKDF2). Contenu illisible sans mot de passe.",
  mount(root, ctx) {
    const { el, store, fmt, toast, save } = ctx;
    const st = store("journal");
    const out = el("div");
    let unlocked = false;
    let sessionKey = null;
    const MOODS = ["😢", "😕", "😐", "🙂", "😄"];
    const MOOD_LABELS = ["Très bas", "Bas", "Neutre", "Bien", "Excellent"];

    /* ---- Crypto helpers ---- */
    async function deriveKey(password, salt) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 200000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    }

    function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
    function unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }

    async function encryptText(text, key) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(text);
      const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
      return { ct: b64(ct), iv: b64(iv) };
    }

    async function decryptText(ct, iv, key) {
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(unb64(iv)) }, key, unb64(ct));
      return new TextDecoder().decode(plain);
    }

    async function tryUnlock(password) {
      const entries = st.get("entries", []);
      if (entries.length === 0) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveKey(password, salt);
        st.set("salt", b64(salt));
        sessionKey = key;
        unlocked = true;
        return true;
      }
      try {
        const salt = new Uint8Array(unb64(st.get("salt", "")));
        const key = await deriveKey(password, salt);
        const first = entries[entries.length - 1];
        await decryptText(first.ct, first.iv, key);
        sessionKey = key;
        unlocked = true;
        return true;
      } catch (_) {
        return false;
      }
    }

    function lockView() {
      ctx.clear(out);
      const pwdInp = el("input", { class: "ff-input", type: "password", placeholder: "Mot de passe du journal…" });
      const errMsg = el("div", { class: "ff-note", style: { display: "none", background: "#fee2e2", borderColor: "var(--pg-err)" } }, "Mot de passe incorrect.");
      const btn = el("button", { class: "ff-btn primary", onClick: async () => {
        const pwd = pwdInp.value;
        if (!pwd) { toast("Entre un mot de passe", "err"); return; }
        const ok = await tryUnlock(pwd);
        if (ok) { render(); } else { errMsg.style.display = "block"; pwdInp.value = ""; }
      }});
      btn.textContent = "🔓 Déverrouiller";
      pwdInp.addEventListener("keydown", e => { if (e.key === "Enter") btn.click(); });
      out.append(el("div", { class: "ff-panel", style: { maxWidth: "420px", margin: "0 auto" } }, [
        el("div", { style: { textAlign: "center", fontSize: "48px", margin: "0 0 10px" } }, "🔒"),
        el("h2", { style: { textAlign: "center" } }, "Journal chiffré"),
        el("p", { class: "ff-note" }, "Tes entrées sont chiffrées avec AES-GCM. Sans ton mot de passe, le contenu est illisible. Si tu crées un nouveau journal, choisis un mot de passe fort — il ne peut pas être récupéré."),
        el("div", { class: "ff-field" }, [el("label", "Mot de passe"), pwdInp]),
        errMsg,
        el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [btn])
      ]));
    }

    async function render() {
      ctx.clear(out);
      if (!unlocked) { lockView(); return; }
      const entries = st.get("entries", []);
      const today = new Date().toISOString().slice(0, 10);
      let mood = 2;
      const textArea = el("textarea", { class: "ff-input", rows: 5, placeholder: "Écris ici… Cette entrée sera chiffrée." });

      const moodBtns = MOODS.map((m, i) => {
        const btn = el("button", {
          style: { fontSize: "28px", background: "none", border: "3px solid transparent", borderRadius: "12px", cursor: "pointer", padding: "4px 8px", transition: "all .15s" },
          title: MOOD_LABELS[i],
          onClick: () => {
            mood = i;
            moodBtns.forEach((b, j) => {
              b.style.borderColor = j === i ? "var(--pg-yel)" : "transparent";
              b.style.background = j === i ? "var(--pg-pale)" : "none";
            });
          }
        }, m);
        if (i === 2) { btn.style.borderColor = "var(--pg-yel)"; btn.style.background = "var(--pg-pale)"; }
        return btn;
      });

      const listEl = el("div");

      async function loadList() {
        ctx.clear(listEl);
        const ents = st.get("entries", []);
        if (!ents.length) { listEl.append(el("div", { class: "ff-empty" }, "Aucune entrée pour l'instant.")); return; }
        for (const entry of [...ents].reverse()) {
          const card = el("div", { style: { border: "2px solid var(--pg-sky2)", borderRadius: "12px", padding: "14px", marginBottom: "10px" } }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, [
              el("span", { style: { fontWeight: "800", color: "var(--pg-navy)" } }, fmt.date(entry.date)),
              el("span", { style: { fontSize: "24px" } }, MOODS[entry.mood !== undefined ? entry.mood : 2])
            ]),
            el("div", { style: { color: "var(--pg-mut)", fontSize: ".85rem", fontStyle: "italic" } }, "Chiffré — cliquer pour lire")
          ]);
          card.style.cursor = "pointer";
          card.addEventListener("click", async () => {
            try {
              const text = await decryptText(entry.ct, entry.iv, sessionKey);
              ctx.clear(card);
              card.append(
                el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, [
                  el("span", { style: { fontWeight: "800", color: "var(--pg-navy)" } }, fmt.date(entry.date)),
                  el("div", { style: { display: "flex", gap: "8px", alignItems: "center" } }, [
                    el("span", { style: { fontSize: "24px" } }, MOODS[entry.mood !== undefined ? entry.mood : 2]),
                    el("button", { class: "ff-btn sm ghost", onClick: async e => {
                      e.stopPropagation();
                      const idx = ents.findIndex(x => x.date === entry.date && x.iv === entry.iv);
                      if (idx >= 0) { ents.splice(idx, 1); st.set("entries", ents); await loadList(); toast("Entrée supprimée"); }
                    }}, "✕")
                  ])
                ]),
                el("p", { style: { margin: 0, whiteSpace: "pre-wrap" } }, text)
              );
            } catch (_) {
              toast("Impossible de déchiffrer cette entrée", "err");
            }
          });
          listEl.append(card);
        }
      }

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" } }, [
            el("h2", { style: { margin: 0 } }, "Nouvelle entrée — " + fmt.date(today)),
            el("button", { class: "ff-btn sm ghost", onClick: () => { unlocked = false; sessionKey = null; render(); } }, "🔒 Verrouiller")
          ]),
          el("div", { style: { marginBottom: "12px" } }, [
            el("div", { style: { fontWeight: "900", fontSize: ".9rem", color: "var(--pg-navy)", marginBottom: "8px" } }, "Humeur du jour"),
            el("div", { style: { display: "flex", gap: "6px" } }, moodBtns)
          ]),
          el("div", { class: "ff-field" }, [el("label", "Texte (sera chiffré)"), textArea]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: async () => {
              const text = textArea.value.trim();
              if (!text) { toast("Écris quelque chose d'abord", "err"); return; }
              try {
                const { ct, iv } = await encryptText(text, sessionKey);
                const ents = st.get("entries", []);
                ents.push({ date: today, mood, ct, iv });
                st.set("entries", ents);
                textArea.value = "";
                toast("Entrée enregistrée et chiffrée ✓", "ok");
                await loadList();
              } catch (e) {
                toast("Erreur de chiffrement : " + e.message, "err");
              }
            }}, "💾 Enregistrer (chiffré)")
          ])
        ]),
        moodChart(st.get("entries", [])),
        el("div", { class: "ff-panel" }, [
          el("h2", "Historique"),
          listEl
        ])
      );
      await loadList();
    }

    function moodChart(entries) {
      if (!entries.length) return el("div");
      const last30 = entries.slice(-30);
      const avg = last30.reduce((a, e) => a + (e.mood !== undefined ? e.mood : 2), 0) / last30.length;
      const label = MOOD_LABELS[Math.round(avg)] || "Neutre";
      return el("div", { class: "ff-panel" }, [
        el("h2", "Tendance d'humeur (30 derniers jours)"),
        el("div", { class: "ff-stats" }, [
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, MOODS[Math.round(avg)]), el("div", { class: "k" }, "Humeur moy.")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, String(entries.length)), el("div", { class: "k" }, "Entrées totales")]),
          el("div", { class: "ff-stat" }, [el("div", { class: "v" }, label), el("div", { class: "k" }, "État général")])
        ]),
        el("div", { style: { display: "flex", gap: "3px", alignItems: "flex-end", height: "60px", marginTop: "12px" } },
          last30.map(e => {
            const h = ((e.mood !== undefined ? e.mood : 2) + 1) * 10;
            const colors = ["#ef4444", "#f97316", "#facc15", "#4ade80", "#22c55e"];
            return el("div", { style: { flex: "1", height: h + "px", background: colors[e.mood !== undefined ? e.mood : 2], borderRadius: "4px 4px 0 0", minWidth: "4px" }, title: fmt.date(e.date) + " — " + (MOOD_LABELS[e.mood] || "?") });
          })
        )
      ]);
    }

    root.append(out);
    render();
  }
});
