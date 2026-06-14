/* Compilateur Web → app autonome — fusionne HTML+CSS+JS en un seul .html portable. */
FF.register({
  id: "web2exe", title: "Web → App autonome", icon: "📦", tag: "Build",
  desc: "Fusionne HTML, CSS et JS en un seul fichier .html portable, ouvrable partout.",
  mount(root, ctx) {
    const { el, store, save, toast, copy } = ctx;
    const st = store("web2exe");
    let s = st.get("s", { title: "Mon app", html: "<h1>Bonjour 👋</h1>\n<button onclick=\"alert('FreeForge!')\">Cliquer</button>", css: "body{font-family:system-ui;text-align:center;padding:40px}", js: "console.log('démarré');" });
    function bundle() {
      return `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${s.title}</title>\n<style>\n${s.css}\n</style>\n</head>\n<body>\n${s.html}\n<script>\n${s.js}\n<\/script>\n</body>\n</html>`;
    }
    function fld(label, key, rows) { return el("div", { class: "ff-field" }, [el("label", label), el("textarea", { class: "ff-input", rows, spellcheck: false, style: { fontFamily: "ui-monospace,monospace", fontSize: ".85rem" }, value: s[key], onInput: (e) => { s[key] = e.target.value; st.set("s", s); } })]); }
    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Titre"), el("input", { class: "ff-input", value: s.title, onInput: (e) => { s.title = e.target.value; st.set("s", s); } })]),
        el("div", { class: "ff-row" }, [el("div", { class: "ff-col" }, [fld("HTML", "html", 8)]), el("div", { class: "ff-col" }, [fld("CSS", "css", 8)])]),
        fld("JavaScript", "js", 6),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: () => { save((s.title || "app").replace(/\W+/g, "-").toLowerCase() + ".html", bundle(), "text/html"); toast("App autonome générée", "ok"); } }, "📦 Générer le .html"),
          el("button", { class: "ff-btn ghost", onClick: () => copy(bundle()) }, "📋 Copier le code"),
          el("button", { class: "ff-btn ghost", onClick: () => { const w = window.open(); w.document.write(bundle()); w.document.close(); } }, "▶ Aperçu")
        ]),
        el("div", { class: "ff-note" }, "Le fichier produit est 100 % autonome (aucune dépendance) : double-clique pour l’ouvrir dans n’importe quel navigateur, sur n’importe quel appareil. Pour un vrai exécutable .exe/.apk, on l’emballera dans le pipeline natif.")
      ])
    );
  }
});
