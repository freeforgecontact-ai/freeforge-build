/* Vector SVG Editor — points pour tracer chemin, déplacer, fermer, fill/stroke, export SVG + composant JSX */
FF.register({
  id: "vector-svg", title: "Vector SVG Editor", icon: "✏️", tag: "SVG",
  desc: "Ajoute des points pour tracer un chemin, déplace-les, ferme, fill/stroke, exporte SVG et composant React JSX.",
  mount(root, ctx) {
    const { el, store, save, copy, toast } = ctx;
    const st = store("vector-svg");

    let points = st.get("points", []);
    let closed = st.get("closed", false);
    let fillColor = st.get("fill", "#0f4c81");
    let strokeColor = st.get("stroke", "#f97316");
    let strokeWidth = st.get("strokeW", 3);
    let mode = "add"; // "add" ou "move"
    let dragIdx = -1;
    let dragging = false;

    const W = 600, H = 380;
    const ns = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", "100%");
    svg.style.cssText = "background:#f8fafc;border:3px solid var(--pg-navy);border-radius:14px;touch-action:none;cursor:crosshair;max-height:400px";

    function persist() { st.set("points", points); st.set("closed", closed); st.set("fill", fillColor); st.set("stroke", strokeColor); st.set("strokeW", strokeWidth); }

    function getPos(e) {
      const r = svg.getBoundingClientRect();
      return {
        x: Math.round(((e.clientX - r.left) / r.width) * W),
        y: Math.round(((e.clientY - r.top) / r.height) * H)
      };
    }

    function buildPath() {
      if (!points.length) return "";
      let d = "M " + points[0].x + " " + points[0].y;
      for (let i = 1; i < points.length; i++) d += " L " + points[i].x + " " + points[i].y;
      if (closed) d += " Z";
      return d;
    }

    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (points.length === 0) {
        const hint = document.createElementNS(ns, "text");
        hint.setAttribute("x", W / 2); hint.setAttribute("y", H / 2);
        hint.setAttribute("text-anchor", "middle"); hint.setAttribute("font-size", "18");
        hint.setAttribute("fill", "#9ca3af"); hint.textContent = "Clique pour ajouter des points";
        svg.append(hint);
        return;
      }

      const d = buildPath();
      if (d) {
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", closed ? fillColor : "none");
        path.setAttribute("stroke", strokeColor);
        path.setAttribute("stroke-width", strokeWidth);
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("stroke-linecap", "round");
        svg.append(path);
      }

      // Points de contrôle
      points.forEach(function(pt, i) {
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", pt.x);
        circle.setAttribute("cy", pt.y);
        circle.setAttribute("r", 7);
        circle.setAttribute("fill", i === 0 ? "#ffd23f" : "#fff");
        circle.setAttribute("stroke", "#0a3559");
        circle.setAttribute("stroke-width", "2");
        circle.style.cursor = "move";
        circle.addEventListener("pointerdown", function(e) {
          if (mode !== "move") return;
          e.stopPropagation();
          dragIdx = i; dragging = true;
          svg.setPointerCapture(e.pointerId);
        });
        svg.append(circle);
      });
    }

    svg.addEventListener("click", function(e) {
      if (mode !== "add" || dragging) return;
      const p = getPos(e);
      points.push(p);
      persist(); draw();
    });

    svg.addEventListener("pointermove", function(e) {
      if (!dragging || dragIdx < 0) return;
      const p = getPos(e);
      points[dragIdx] = { x: Math.max(0, Math.min(W, p.x)), y: Math.max(0, Math.min(H, p.y)) };
      draw();
    });

    svg.addEventListener("pointerup", function() {
      if (dragging) { dragging = false; dragIdx = -1; persist(); }
    });

    function genSVGString() {
      const d = buildPath();
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '">\n' +
        '  <path d="' + d + '" fill="' + (closed ? fillColor : "none") + '" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '" stroke-linejoin="round" stroke-linecap="round"/>\n' +
        '</svg>';
    }

    function genJSX() {
      const d = buildPath();
      return 'const VectorIcon = () => (\n' +
        '  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '">\n' +
        '    <path\n' +
        '      d="' + d + '"\n' +
        '      fill="' + (closed ? fillColor : "none") + '"\n' +
        '      stroke="' + strokeColor + '"\n' +
        '      strokeWidth={' + strokeWidth + '}\n' +
        '      strokeLinejoin="round"\n' +
        '      strokeLinecap="round"\n' +
        '    />\n' +
        '  </svg>\n' +
        ');\n\nexport default VectorIcon;';
    }

    const modeSeg = el("div", { class: "ff-seg" }, [
      el("button", { class: "on", text: "✏️ Ajouter", onClick: function() {
        mode = "add"; svg.style.cursor = "crosshair";
        this.parentElement.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        this.classList.add("on");
      }}),
      el("button", { class: "", text: "✋ Déplacer", onClick: function() {
        mode = "move"; svg.style.cursor = "default";
        this.parentElement.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        this.classList.add("on");
      }})
    ]);

    const fillInput = el("input", { type: "color", value: fillColor, class: "ff-input", style: "height:40px;padding:4px",
      onInput: function(e) { fillColor = e.target.value; persist(); draw(); }
    });
    const strokeInput = el("input", { type: "color", value: strokeColor, class: "ff-input", style: "height:40px;padding:4px",
      onInput: function(e) { strokeColor = e.target.value; persist(); draw(); }
    });
    const strokeWInput = el("input", { type: "range", min: "1", max: "20", value: strokeWidth, class: "ff-input",
      onInput: function(e) { strokeWidth = +e.target.value; swLabel.textContent = strokeWidth + "px"; persist(); draw(); }
    });
    const swLabel = el("span", { text: strokeWidth + "px" });

    const closedChk = el("input", { type: "checkbox", checked: closed,
      onChange: function(e) { closed = e.target.checked; persist(); draw(); }
    });

    draw();

    root.append(
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Outils"),
            el("div", { class: "ff-field" }, [el("label", "Mode"), modeSeg]),
            el("div", { class: "ff-field" }, [el("label", [closedChk, " Fermer le chemin"])]),
            el("div", { class: "ff-field" }, [el("label", "Fill (chemin fermé)"), fillInput]),
            el("div", { class: "ff-field" }, [el("label", "Couleur stroke"), strokeInput]),
            el("div", { class: "ff-field" }, [el("label", ["Épaisseur : ", swLabel]), strokeWInput]),
            el("div", { class: "ff-btns" }, [
              el("button", { class: "ff-btn ghost", onClick: function() {
                if (points.length > 0) { points.pop(); persist(); draw(); }
              }}, "↩ Annuler dernier"),
              el("button", { class: "ff-btn ghost", style: "color:var(--pg-err)", onClick: function() {
                points = []; closed = false; persist(); draw();
              }}, "🗑 Effacer tout")
            ])
          ])
        ]),
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [el("h2", "Canvas"), svg]),
          el("div", { class: "ff-btns", style: "margin-top:8px" }, [
            el("button", { class: "ff-btn primary", onClick: function() {
              if (!points.length) { toast("Aucun point à exporter", "err"); return; }
              save("vecteur.svg", genSVGString(), "image/svg+xml");
            }}, "⬇️ Export SVG"),
            el("button", { class: "ff-btn accent", onClick: function() {
              if (!points.length) { toast("Aucun point", "err"); return; }
              copy(genSVGString()); toast("SVG copié !", "ok");
            }}, "📋 Copier SVG"),
            el("button", { class: "ff-btn gold", onClick: function() {
              if (!points.length) { toast("Aucun point", "err"); return; }
              copy(genJSX()); toast("Composant JSX copié !", "ok");
            }}, "⚛️ Copier composant React")
          ])
        ])
      ])
    );
  }
});
