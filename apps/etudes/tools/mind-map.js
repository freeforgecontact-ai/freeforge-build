/* Mind Map Vector Drawer — nœuds déplaçables, export SVG, persistance. */
FF.register({
  id: "mind-map", title: "Carte Mentale", icon: "🧠", tag: "Idéation",
  desc: "Construis une carte mentale, déplace les nœuds à la souris, exporte en SVG.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("mindmap");
    let nodes = st.get("nodes", [{ id: 1, t: "Sujet central", x: 300, y: 180, p: null }]);
    let nid = st.get("nid", 2), sel = 1;
    const ns = "http://www.w3.org/2000/svg";
    const W = 620, H = 380;
    function persist() { st.set("nodes", nodes); st.set("nid", nid); }
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", "100%"); svg.style.cssText = "background:#fff;border:3px solid var(--pg-navy);border-radius:14px;touch-action:none;max-height:420px";
    let drag = null;
    function pt(e) { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * W; const y = (e.clientY - r.top) / r.height * H; return { x, y }; }
    svg.addEventListener("pointermove", (e) => { if (!drag) return; const p = pt(e); drag.x = Math.max(40, Math.min(W - 40, p.x)); drag.y = Math.max(24, Math.min(H - 20, p.y)); draw(); });
    svg.addEventListener("pointerup", () => { if (drag) { drag = null; persist(); } });
    svg.addEventListener("pointerleave", () => { if (drag) { drag = null; persist(); } });
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      nodes.forEach((n) => { if (n.p == null) return; const par = nodes.find((x) => x.id === n.p); if (!par) return; const l = document.createElementNS(ns, "line"); l.setAttribute("x1", par.x); l.setAttribute("y1", par.y); l.setAttribute("x2", n.x); l.setAttribute("y2", n.y); l.setAttribute("stroke", "#7ec3ee"); l.setAttribute("stroke-width", "3"); svg.appendChild(l); });
      nodes.forEach((n) => {
        const g = document.createElementNS(ns, "g"); g.style.cursor = "grab";
        const w = Math.max(70, n.t.length * 8.5 + 20);
        const rect = document.createElementNS(ns, "rect"); rect.setAttribute("x", n.x - w / 2); rect.setAttribute("y", n.y - 16); rect.setAttribute("width", w); rect.setAttribute("height", 32); rect.setAttribute("rx", 10); rect.setAttribute("fill", n.id === sel ? "#ffd23f" : (n.p == null ? "#0f4c81" : "#eaf6ff")); rect.setAttribute("stroke", "#0a3559"); rect.setAttribute("stroke-width", "2.5");
        const t = document.createElementNS(ns, "text"); t.setAttribute("x", n.x); t.setAttribute("y", n.y + 5); t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", "13"); t.setAttribute("font-weight", "800"); t.setAttribute("fill", n.id === sel || n.p != null ? "#0a3559" : "#fff"); t.textContent = n.t;
        g.appendChild(rect); g.appendChild(t);
        g.addEventListener("pointerdown", (e) => { sel = n.id; drag = n; svg.setPointerCapture(e.pointerId); draw(); });
        svg.appendChild(g);
      });
    }
    const out = el("div");
    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: () => { const par = nodes.find((n) => n.id === sel) || nodes[0]; nodes.push({ id: nid, t: "Idée", x: par.x + 120, y: par.y + (Math.random() * 120 - 60), p: par.id }); sel = nid; nid++; persist(); draw(); } }, "＋ Sous-idée"),
          el("button", { class: "ff-btn ghost", onClick: () => { const n = nodes.find((x) => x.id === sel); if (!n) return; const v = prompt("Texte :", n.t); if (v != null) { n.t = v; persist(); draw(); } } }, "✏️ Renommer"),
          el("button", { class: "ff-btn ghost", onClick: () => { if (sel === nodes[0].id) return toast("Garde le nœud central", "err"); nodes = nodes.filter((x) => x.id !== sel && x.p !== sel); sel = nodes[0].id; persist(); draw(); } }, "🗑 Supprimer"),
          el("button", { class: "ff-btn accent", onClick: () => { const clone = svg.cloneNode(true); clone.setAttribute("xmlns", ns); save("carte-mentale.svg", '<?xml version="1.0"?>\n' + clone.outerHTML, "image/svg+xml"); toast("SVG exporté", "ok"); } }, "⬇️ Export SVG")
        ]), el("div", { class: "ff-note" }, "Clique un nœud pour le sélectionner, glisse-le pour le déplacer.")]),
        el("div", { class: "ff-panel" }, svg)
      );
      draw();
    }
    root.append(out); render();
  }
});
