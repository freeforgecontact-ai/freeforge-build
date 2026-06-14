/* Concepteur de Cartes de Vœux — Canvas, fond, emoji, titre, message, export PNG */
FF.register({
  id: "cartes-voeux", title: "Concepteur de Cartes de Vœux", icon: "🎉", tag: "Image",
  desc: "Crée une carte de vœux sur Canvas : fond couleur/dégradé, emoji, titre et message. Exporte PNG.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("cartes-voeux");

    let s = st.get("state", {
      bgType: "gradient", bg1: "#0f4c81", bg2: "#f97316",
      gradAngle: 135,
      emoji: "🎉", emojiSize: 72,
      title: "Bonne Fête!", titleSize: 52, titleColor: "#ffd23f",
      message: "Avec toute mon affection\net mes meilleurs vœux!", msgSize: 28, msgColor: "#ffffff",
      fontTitle: "Fredoka, Trebuchet MS, sans-serif",
      fontMsg: "Nunito, Segoe UI, sans-serif"
    });

    const canvas = el("canvas", {
      style: "max-width:100%;border:3px solid var(--pg-navy);border-radius:14px;display:block;margin:0 auto"
    });
    canvas.width = 800; canvas.height = 500;

    function persist() { st.set("state", s); }

    function draw() {
      const c = canvas.getContext("2d");
      if (!c) return;
      // Fond
      if (s.bgType === "gradient") {
        const angle = (s.gradAngle * Math.PI) / 180;
        const x1 = canvas.width / 2 - Math.cos(angle) * canvas.width / 2;
        const y1 = canvas.height / 2 - Math.sin(angle) * canvas.height / 2;
        const x2 = canvas.width / 2 + Math.cos(angle) * canvas.width / 2;
        const y2 = canvas.height / 2 + Math.sin(angle) * canvas.height / 2;
        const grad = c.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, s.bg1);
        grad.addColorStop(1, s.bg2);
        c.fillStyle = grad;
      } else {
        c.fillStyle = s.bg1;
      }
      c.fillRect(0, 0, canvas.width, canvas.height);

      // Emoji
      c.font = s.emojiSize + "px serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(s.emoji, canvas.width / 2, canvas.height * 0.22);

      // Titre
      c.font = "bold " + s.titleSize + "px " + s.fontTitle;
      c.fillStyle = s.titleColor;
      c.shadowColor = "rgba(0,0,0,0.3)";
      c.shadowBlur = 8;
      c.fillText(s.title, canvas.width / 2, canvas.height * 0.5);
      c.shadowBlur = 0;

      // Message (multi-lignes)
      c.font = s.msgSize + "px " + s.fontMsg;
      c.fillStyle = s.msgColor;
      const lines = s.message.split("\n");
      const lineH = s.msgSize * 1.5;
      const startY = canvas.height * 0.68;
      lines.forEach(function(line, i) {
        c.fillText(line, canvas.width / 2, startY + i * lineH);
      });
    }

    function inp(key, label, type, extra) {
      const attrs = Object.assign({ class: "ff-input", type: type || "text", value: s[key] }, extra || {});
      const input = el("input", attrs);
      input.onchange = input.oninput = function(e) {
        s[key] = type === "number" ? +e.target.value : e.target.value;
        persist(); draw();
      };
      return el("div", { class: "ff-field" }, [el("label", label), input]);
    }

    function colorInp(key, label) {
      const input = el("input", {
        type: "color", value: s[key], class: "ff-input", style: "height:44px;padding:4px;cursor:pointer"
      });
      input.oninput = function(e) { s[key] = e.target.value; persist(); draw(); };
      return el("div", { class: "ff-field" }, [el("label", label), input]);
    }

    const bgSeg = el("div", { class: "ff-seg" }, [
      el("button", { class: s.bgType === "gradient" ? "on" : "", text: "Dégradé", onClick: function() {
        s.bgType = "gradient"; persist(); draw();
        bgSeg.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        this.classList.add("on");
      }}),
      el("button", { class: s.bgType === "solid" ? "on" : "", text: "Uni", onClick: function() {
        s.bgType = "solid"; persist(); draw();
        bgSeg.querySelectorAll("button").forEach(function(b) { b.classList.remove("on"); });
        this.classList.add("on");
      }})
    ]);

    draw();

    root.append(
      el("div", { class: "ff-row" }, [
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Fond"),
            el("div", { class: "ff-field" }, [el("label", "Type"), bgSeg]),
            colorInp("bg1", "Couleur 1"),
            colorInp("bg2", "Couleur 2 (dégradé)"),
            inp("gradAngle", "Angle du dégradé (°)", "number", { min: "0", max: "360" })
          ]),
          el("div", { class: "ff-panel" }, [
            el("h2", "Emoji"),
            inp("emoji", "Emoji", "text"),
            inp("emojiSize", "Taille (px)", "number", { min: "24", max: "200" })
          ])
        ]),
        el("div", { class: "ff-col" }, [
          el("div", { class: "ff-panel" }, [
            el("h2", "Titre"),
            inp("title", "Texte du titre", "text"),
            inp("titleSize", "Taille (px)", "number", { min: "16", max: "120" }),
            colorInp("titleColor", "Couleur du titre")
          ]),
          el("div", { class: "ff-panel" }, [
            el("h2", "Message"),
            el("div", { class: "ff-field" }, [
              el("label", "Message (\\n pour sauts de ligne)"),
              el("textarea", {
                class: "ff-input", style: "height:80px",
                text: s.message,
                onInput: function(e) { s.message = e.target.value; persist(); draw(); }
              })
            ]),
            inp("msgSize", "Taille du message (px)", "number", { min: "12", max: "80" }),
            colorInp("msgColor", "Couleur du message")
          ]),
          el("div", { class: "ff-btns" }, [
            el("button", { class: "ff-btn primary", onClick: function() {
              canvas.toBlob(function(blob) {
                save("carte-voeux.png", blob, "image/png");
                toast("Carte exportée !", "ok");
              }, "image/png");
            }}, "⬇️ Exporter PNG")
          ])
        ])
      ]),
      el("div", { class: "ff-panel" }, [el("h2", "Aperçu"), canvas])
    );
  }
});
