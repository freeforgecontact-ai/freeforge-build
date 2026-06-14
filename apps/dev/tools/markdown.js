/* Éditeur Markdown vers PDF — aperçu live + export PDF/HTML/MD. */
FF.register({
  id: "markdown", title: "Éditeur Markdown → PDF", icon: "📝", tag: "Doc",
  desc: "Écris en Markdown, vois l’aperçu en direct, exporte en PDF, HTML ou .md.",
  mount(root, ctx) {
    const { el, store, save, print, copy } = ctx;
    const st = store("markdown");
    let src = st.get("src", "# Mon document\n\nBonjour **FreeForge** !\n\n## Liste\n- Premier\n- Deuxième\n\n> Une citation.\n\n`code` et [un lien](https://pgrg.ca).\n");
    function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function md(t) {
      let lines = t.split("\n"), html = "", inList = false, inCode = false;
      const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
      for (let l of lines) {
        if (l.trim().startsWith("```")) { inCode = !inCode; html += inCode ? "<pre><code>" : "</code></pre>"; continue; }
        if (inCode) { html += esc(l) + "\n"; continue; }
        if (/^\s*[-*]\s+/.test(l)) { if (!inList) { html += "<ul>"; inList = true; } html += "<li>" + inline(l.replace(/^\s*[-*]\s+/, "")) + "</li>"; continue; }
        if (inList) { html += "</ul>"; inList = false; }
        if (/^#{1,6}\s/.test(l)) { const n = l.match(/^#+/)[0].length; html += `<h${n}>` + inline(l.replace(/^#+\s/, "")) + `</h${n}>`; }
        else if (/^>\s?/.test(l)) html += "<blockquote>" + inline(l.replace(/^>\s?/, "")) + "</blockquote>";
        else if (/^---+$/.test(l.trim())) html += "<hr>";
        else if (l.trim() === "") html += "";
        else html += "<p>" + inline(l) + "</p>";
      }
      if (inList) html += "</ul>";
      return html;
    }
    const preview = el("div", { class: "prose", style: { padding: "4px 2px" } });
    function upd() { preview.innerHTML = md(src); }
    const ta = el("textarea", { class: "ff-input", rows: 16, value: src, spellcheck: false, style: { fontFamily: "ui-monospace,monospace", fontSize: ".9rem" }, onInput: (e) => { src = e.target.value; st.set("src", src); upd(); } });
    root.append(
      el("div", { class: "ff-btns", style: { marginBottom: "12px" } }, [
        el("button", { class: "ff-btn accent", onClick: () => { const d = el("div", { class: "prose" }); d.innerHTML = md(src); print("Document", d); } }, "🖨️ PDF"),
        el("button", { class: "ff-btn ghost", onClick: () => save("document.md", src, "text/markdown") }, "⬇️ .md"),
        el("button", { class: "ff-btn ghost", onClick: () => save("document.html", "<!doctype html><meta charset=utf-8><body style='max-width:760px;margin:auto;font-family:system-ui;padding:24px'>" + md(src), "text/html") }, "⬇️ .html")
      ]),
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [el("div", { class: "ff-panel" }, [el("h2", "Markdown"), ta])]),
        el("div", { class: "ff-col" }, [el("div", { class: "ff-panel" }, [el("h2", "Aperçu"), preview])])
      ])
    );
    upd();
  }
});
