/* JWT Debugger & Tool — décode header/payload, vérifie HS256, échéances. */
FF.register({
  id: "jwt", title: "JWT Debugger & Tool", icon: "🔐", tag: "Sécurité",
  desc: "Décode un jeton JWT, affiche les échéances et vérifie la signature HS256.",
  mount(root, ctx) {
    const { el, store, toast, copy } = ctx;
    const st = store("jwt");
    let token = st.get("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6Ik5hdGhhbiIsImlhdCI6MTcwMDAwMDAwMH0.sig");
    let secret = st.get("secret", "mon-secret");
    const out = el("div");
    function b64urlDecode(s) { try { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); } catch (e) { return null; } }
    function decode() { const p = token.split("."); if (p.length < 2) return null; const h = b64urlDecode(p[0]), pl = b64urlDecode(p[1]); try { return { header: JSON.parse(h), payload: JSON.parse(pl), sig: p[2] || "" }; } catch (e) { return null; } }
    function render() {
      ctx.clear(out); const d = decode();
      out.append(el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Jeton JWT"), el("textarea", { class: "ff-input", rows: 4, value: token, spellcheck: false, style: { fontFamily: "ui-monospace,monospace", fontSize: ".82rem", wordBreak: "break-all" }, onInput: (e) => { token = e.target.value.trim(); st.set("token", token); render(); } })])
      ]));
      if (!d) { out.append(el("div", { class: "ff-note", style: { color: "var(--pg-err)", borderColor: "var(--pg-err)" } }, "✗ Jeton illisible.")); return; }
      const exp = d.payload.exp, now = Math.floor(Date.now() / 1000);
      out.append(
        el("div", { class: "ff-panel" }, [el("h2", "En-tête (header)"), pre(d.header)]),
        el("div", { class: "ff-panel" }, [el("h2", "Charge utile (payload)"), pre(d.payload),
          d.payload.iat ? line("Émis le", new Date(d.payload.iat * 1000).toLocaleString("fr-CA")) : null,
          exp ? line("Expire le", new Date(exp * 1000).toLocaleString("fr-CA") + (exp < now ? "  ⛔ EXPIRÉ" : "  ✓ valide")) : null
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Vérifier la signature (HS256)"),
          el("div", { class: "ff-field" }, [el("label", "Secret"), el("input", { class: "ff-input", value: secret, onInput: (e) => { secret = e.target.value; st.set("secret", secret); } })]),
          el("div", { class: "ff-btns" }, [el("button", { class: "ff-btn primary", onClick: verify }, "Vérifier"), el("button", { class: "ff-btn ghost", onClick: () => copy(JSON.stringify(d.payload, null, 2)) }, "📋 Copier payload")]),
          el("div", { id: "jwtv", style: { marginTop: "10px" } })
        ])
      );
      function pre(o) { return el("pre", { style: { background: "var(--pg-pale)", border: "2px solid var(--pg-sky2)", borderRadius: "12px", padding: "12px", overflow: "auto", fontSize: ".82rem", margin: 0 } }, JSON.stringify(o, null, 2)); }
      function line(k, v) { return el("div", { style: { marginTop: "8px" } }, [el("b", { style: { color: "var(--pg-blue)" } }, k + " : "), v]); }
    }
    async function verify() {
      const box = document.getElementById("jwtv"); const p = token.split(".");
      try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, enc.encode(p[0] + "." + p[1]));
        const b = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const ok = b === p[2];
        box.innerHTML = ""; box.append(el("div", { class: "ff-chip", style: ok ? { background: "#dcfce7", color: "var(--pg-ok)", borderColor: "var(--pg-ok)" } : { background: "#fdecec", color: "var(--pg-err)", borderColor: "var(--pg-err)" } }, ok ? "✓ Signature valide" : "✗ Signature invalide"));
      } catch (e) { box.textContent = "Erreur : " + e.message; }
    }
    root.append(out); render();
  }
});
