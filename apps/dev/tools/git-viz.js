/* Git Command Visualizer — simulateur de graphe de commits + aide-mémoire. */
FF.register({
  id: "git-viz", title: "Git Command Visualizer", icon: "🌳", tag: "Dev",
  desc: "Visualise commits, branches et fusions, avec un aide-mémoire des commandes Git.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("gitviz");
    let g = st.get("g", null);
    if (!g) g = { commits: [{ id: "c1", parents: [], branch: "main" }], branches: { main: "c1" }, head: "main", n: 1, cols: { main: 0 }, ncol: 1 };
    const COLORS = ["#0f4c81", "#f97316", "#1aa06d", "#9333ea", "#e11d48", "#0891b2"];
    const out = el("div");
    function persist() { st.set("g", g); }
    function commit() { const id = "c" + (++g.n); g.commits.push({ id, parents: [g.branches[g.head]], branch: g.head }); g.branches[g.head] = id; persist(); render(); }
    function branch() { const name = prompt("Nom de la branche :", "feature"); if (!name || g.branches[name]) return; g.branches[name] = g.branches[g.head]; g.cols[name] = g.ncol++; g.head = name; persist(); render(); }
    function checkout() { const names = Object.keys(g.branches); const name = prompt("Aller sur la branche :\n" + names.join(", "), names[0]); if (g.branches[name]) { g.head = name; persist(); render(); } }
    function merge() { const others = Object.keys(g.branches).filter((b) => b !== g.head); const name = prompt("Fusionner quelle branche dans " + g.head + " ?\n" + others.join(", "), others[0]); if (!g.branches[name]) return; const id = "c" + (++g.n); g.commits.push({ id, parents: [g.branches[g.head], g.branches[name]], branch: g.head, merge: true }); g.branches[g.head] = id; persist(); render(); }
    function reset() { localStorage.removeItem("ff:gitviz:g"); g = null; mountFresh(); }
    function mountFresh() { ctx.clear(out); g = { commits: [{ id: "c1", parents: [], branch: "main" }], branches: { main: "c1" }, head: "main", n: 1, cols: { main: 0 }, ncol: 1 }; persist(); render(); }
    function draw() {
      const rowH = 56, colW = 70, pad = 30;
      const idx = {}; g.commits.forEach((c, i) => idx[c.id] = i);
      const W = pad * 2 + g.ncol * colW, H = pad * 2 + (g.commits.length - 1) * rowH + 20;
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", `0 0 ${Math.max(W, 200)} ${Math.max(H, 120)}`); svg.setAttribute("width", "100%"); svg.style.maxHeight = "420px";
      const cx = (c) => pad + (g.cols[c.branch] || 0) * colW; const cy = (c) => H - pad - idx[c.id] * rowH;
      g.commits.forEach((c) => c.parents.forEach((p) => { const pc = g.commits[idx[p]]; if (!pc) return; const ln = document.createElementNS(ns, "line"); ln.setAttribute("x1", cx(c)); ln.setAttribute("y1", cy(c)); ln.setAttribute("x2", cx(pc)); ln.setAttribute("y2", cy(pc)); ln.setAttribute("stroke", COLORS[(g.cols[c.branch] || 0) % COLORS.length]); ln.setAttribute("stroke-width", "3"); svg.appendChild(ln); }));
      g.commits.forEach((c) => { const ci = document.createElementNS(ns, "circle"); ci.setAttribute("cx", cx(c)); ci.setAttribute("cy", cy(c)); ci.setAttribute("r", c.merge ? 11 : 9); ci.setAttribute("fill", COLORS[(g.cols[c.branch] || 0) % COLORS.length]); ci.setAttribute("stroke", "#0a3559"); ci.setAttribute("stroke-width", "2.5"); svg.appendChild(ci); });
      Object.keys(g.branches).forEach((b) => { const head = g.commits[idx[g.branches[b]]]; const t = document.createElementNS(ns, "text"); t.setAttribute("x", cx(head) + 16); t.setAttribute("y", cy(head) + 4); t.setAttribute("font-size", "12"); t.setAttribute("font-weight", "800"); t.setAttribute("fill", "#0a3559"); t.textContent = b + (b === g.head ? " ◄ HEAD" : ""); svg.appendChild(t); });
      return svg;
    }
    function render() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: commit }, "git commit"),
            el("button", { class: "ff-btn ghost", onClick: branch }, "git branch"),
            el("button", { class: "ff-btn ghost", onClick: checkout }, "git checkout"),
            el("button", { class: "ff-btn accent", onClick: merge }, "git merge"),
            el("button", { class: "ff-btn ghost", onClick: reset }, "↺ Réinitialiser")
          ]),
          el("div", { style: { marginTop: "8px" } }, ["Branche active : ", el("span", { class: "ff-chip" }, g.head), " · ", g.commits.length + " commits"])
        ]),
        el("div", { class: "ff-panel" }, [el("h2", "Graphe"), draw()]),
        el("div", { class: "ff-panel" }, [el("h2", "Aide-mémoire"), el("table", { class: "ff-table" }, [
          ["git init", "Crée un dépôt"], ["git add .", "Indexe les changements"], ["git commit -m \"…\"", "Enregistre un instantané"],
          ["git branch x", "Crée la branche x"], ["git checkout x", "Bascule sur x"], ["git merge x", "Fusionne x dans la branche active"],
          ["git pull / push", "Synchronise avec le distant"], ["git log --oneline --graph", "Voit l’historique en graphe"]
        ].map(([c, d]) => el("tr", [el("td", el("code", c)), el("td", d)])))])
      );
    }
    root.append(out); render();
  }
});
