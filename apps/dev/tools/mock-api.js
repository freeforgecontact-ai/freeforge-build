/* Concepteur Mock API — routes persistées, test local, export collection. */
FF.register({
  id: "mock-api", title: "Concepteur Mock API", icon: "🧪", tag: "Dev",
  desc: "Définis des routes API factices (persistées), teste-les localement, exporte la collection.",
  mount(root, ctx) {
    const { el, store, save, toast, copy } = ctx;
    const st = store("mockapi");
    let routes = st.get("routes", [{ method: "GET", path: "/api/produits", status: 200, body: '[{"id":1,"nom":"FreeForge"}]' }]);
    const out = el("div");
    function persist() { st.set("routes", routes); }
    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [el("h2", { style: { margin: 0 } }, "Routes"),
            el("div", {}, [el("button", { class: "ff-btn sm primary", onClick: () => { routes.push({ method: "GET", path: "/api/nouvelle", status: 200, body: "{}" }); persist(); render(); } }, "＋ Route"),
              routes.length ? el("button", { class: "ff-btn sm ghost", style: { marginLeft: "6px" }, onClick: () => { save("mock-collection.json", JSON.stringify(routes, null, 2), "application/json"); toast("Collection exportée", "ok"); } }, "⬇️ JSON") : null])
          ]),
          routes.length ? el("div", {}, routes.map((r, i) => el("div", { style: { border: "2px solid var(--pg-sky2)", borderRadius: "12px", padding: "12px", margin: "10px 0" } }, [
            el("div", { class: "ff-row" }, [
              el("div", { class: "ff-field", style: { flex: "0 0 110px" } }, [el("label", "Méthode"), el("select", { class: "ff-select", onChange: (e) => { r.method = e.target.value; persist(); } }, ["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => el("option", { selected: r.method === m }, m)))]),
              el("div", { class: "ff-field ff-col" }, [el("label", "Chemin"), el("input", { class: "ff-input", value: r.path, onInput: (e) => { r.path = e.target.value; persist(); } })]),
              el("div", { class: "ff-field", style: { flex: "0 0 100px" } }, [el("label", "Statut"), el("input", { class: "ff-input", type: "number", value: r.status, onInput: (e) => { r.status = +e.target.value; persist(); } })])
            ]),
            el("div", { class: "ff-field" }, [el("label", "Réponse (JSON)"), el("textarea", { class: "ff-input", rows: 3, value: r.body, spellcheck: false, style: { fontFamily: "ui-monospace,monospace", fontSize: ".85rem" }, onInput: (e) => { r.body = e.target.value; persist(); } })]),
            el("div", { class: "ff-btns" }, [el("button", { class: "ff-btn sm ghost", onClick: () => { try { JSON.parse(r.body); toast("JSON valide ✓", "ok"); } catch (x) { toast("JSON invalide", "err"); } } }, "Valider"),
              el("button", { class: "ff-btn sm ghost", onClick: () => { routes.splice(i, 1); persist(); render(); } }, "✕ Retirer")])
          ]))) : el("div", { class: "ff-empty" }, "Aucune route.")
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Tester une requête"),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-field", style: { flex: "0 0 110px" } }, [el("label", "Méthode"), el("select", { class: "ff-select", id: "tm" }, ["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => el("option", m)))]),
            el("div", { class: "ff-field ff-col" }, [el("label", "Chemin"), el("input", { class: "ff-input", id: "tp", value: "/api/produits" })])
          ]),
          el("button", { class: "ff-btn primary", onClick: test }, "▶ Envoyer"),
          el("div", { id: "tres", style: { marginTop: "10px" } })
        ])
      );
    }
    function test() {
      const m = document.getElementById("tm").value, p = document.getElementById("tp").value;
      const r = routes.find((x) => x.method === m && x.path === p);
      const box = document.getElementById("tres"); box.innerHTML = "";
      if (!r) { box.append(el("div", { class: "ff-chip", style: { background: "#fdecec", color: "var(--pg-err)", borderColor: "var(--pg-err)" } }, "404 — aucune route ne correspond")); return; }
      box.append(el("div", { class: "ff-chip", style: { background: "#dcfce7", color: "var(--pg-ok)", borderColor: "var(--pg-ok)" } }, r.status + " OK"),
        el("pre", { style: { background: "var(--pg-navy)", color: "#dbeafe", borderRadius: "12px", padding: "12px", overflow: "auto", marginTop: "8px" } }, (() => { try { return JSON.stringify(JSON.parse(r.body), null, 2); } catch (e) { return r.body; } })()));
    }
    root.append(out); render();
  }
});
