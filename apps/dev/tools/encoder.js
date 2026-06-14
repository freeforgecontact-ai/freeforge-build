/* Encodeur Universel — Base64, URL, HTML, hex + empreintes SHA. */
FF.register({
  id: "encoder", title: "Encodeur Universel", icon: "🔁", tag: "Dev",
  desc: "Encode/décode Base64, URL, HTML, hexadécimal et calcule des empreintes SHA.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;
    const st = store("encoder");
    let txt = st.get("txt", "FreeForge — outils 100 % locaux");
    const enc = new TextEncoder();
    const ops = {
      "Base64 ⟶": (t) => btoa(unescape(encodeURIComponent(t))),
      "Base64 ⟵": (t) => { try { return decodeURIComponent(escape(atob(t))); } catch (e) { return "⚠ entrée Base64 invalide"; } },
      "URL ⟶": (t) => encodeURIComponent(t),
      "URL ⟵": (t) => { try { return decodeURIComponent(t); } catch (e) { return "⚠ invalide"; } },
      "HTML ⟶": (t) => t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
      "HTML ⟵": (t) => t.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" }[m])),
      "Hex ⟶": (t) => [...enc.encode(t)].map((b) => b.toString(16).padStart(2, "0")).join(" "),
      "Hex ⟵": (t) => { try { return new TextDecoder().decode(new Uint8Array(t.trim().split(/\s+/).map((h) => parseInt(h, 16)))); } catch (e) { return "⚠ invalide"; } }
    };
    const out = el("div");
    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-field" }, [el("label", "Texte"), el("textarea", { class: "ff-input", rows: 4, value: txt, onInput: (e) => { txt = e.target.value; st.set("txt", txt); render(); } })])]),
        el("div", { class: "ff-panel" }, [el("h2", "Conversions"), el("table", { class: "ff-table" }, Object.keys(ops).map((k) => {
          const r = ops[k](txt);
          return el("tr", [el("td", { style: { fontWeight: "800", color: "var(--pg-navy)", whiteSpace: "nowrap" } }, k), el("td", el("code", { style: { wordBreak: "break-all" } }, r)), el("td", { class: "num" }, el("button", { class: "ff-btn sm ghost", onClick: () => copy(r) }, "📋"))]);
        }))]),
        el("div", { class: "ff-panel" }, [el("h2", "Empreintes (SHA)"), el("div", { class: "ff-btns" }, ["SHA-1", "SHA-256", "SHA-512"].map((a) => el("button", { class: "ff-btn primary", onClick: () => hash(a) }, a))), el("div", { id: "hashout", style: { marginTop: "10px" } })])
      );
    }
    async function hash(algo) {
      const box = document.getElementById("hashout");
      try { const buf = await crypto.subtle.digest(algo, enc.encode(txt)); const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); box.innerHTML = ""; box.append(el("div", { style: { wordBreak: "break-all" } }, [el("b", algo + " : "), el("code", hex), el("button", { class: "ff-btn sm ghost", style: { marginLeft: "6px" }, onClick: () => copy(hex) }, "📋")])); }
      catch (e) { box.textContent = "Erreur : " + e.message; }
    }
    root.append(out); render();
  }
});
