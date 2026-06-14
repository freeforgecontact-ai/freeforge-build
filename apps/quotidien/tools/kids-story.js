/* Kids Story Weaver — histoires à embranchements, éditeur de scènes, mode lecture. */
FF.register({
  id: "kids-story", title: "Kids Story Weaver", icon: "📖", tag: "Enfants",
  desc: "Histoires «dont tu es le héros» avec embranchements. Édite et ajoute tes scènes.",
  mount(root, ctx) {
    const { el, store, toast } = ctx;
    const st = store("kids-story");
    const out = el("div");

    const STORIES_DEFAULT = [
      {
        id: "s1", title: "La Forêt Magique", icon: "🌲",
        scenes: [
          { id: "s1_start", text: "Tu te promènes dans une forêt magique quand tu arrives à un carrefour. Le soleil filtre entre les arbres gigantesques. Un écureuil bavard saute sur ton épaule !", choices: [{ text: "Suivre le sentier qui brille", next: "s1_left" }, { text: "Explorer la grotte mystérieuse", next: "s1_right" }] },
          { id: "s1_left", text: "Le sentier brillant te mène vers une rivière arc-en-ciel ! Des poissons dorés sautent joyeusement. Une fée apparaît et t'offre un vœu magique.", choices: [{ text: "Demander de voler", next: "s1_fly" }, { text: "Demander de parler aux animaux", next: "s1_animals" }] },
          { id: "s1_right", text: "Dans la grotte, tu découvres une carte au trésor ! Des cristaux lumineux éclairent le chemin. Au fond, un vieux dragon dort paisiblement.", choices: [{ text: "Réveiller doucement le dragon", next: "s1_dragon" }, { text: "Prendre la carte et partir", next: "s1_map" }] },
          { id: "s1_fly", text: "Tu t'envoles au-dessus des nuages roses ! Tu vois toute la forêt magique d'en haut : des châteaux de bonbons, des montagnes de chocolat et un arc-en-ciel permanent. Tu rentres chez toi le cœur léger. 🎉 FIN - Super aventure !", choices: [] },
          { id: "s1_animals", text: "Maintenant tu comprends tous les animaux ! L'écureuil te raconte l'histoire secrète de la forêt. Les oiseaux chantent ta chanson préférée. Tu deviens le gardien de la forêt magique pour toujours ! 🌟 FIN - Belle fin !", choices: [] },
          { id: "s1_dragon", text: "Le dragon ouvre un œil et sourit ! Il s'appelle Flocon et est très gentil. Il t'emmène voler jusqu'à un festin fabuleux où tous les animaux t'attendent ! 🐉 FIN - Fin épique !", choices: [] },
          { id: "s1_map", text: "La carte te guide vers un coffre rempli de graines magiques. Tu les plantes partout dans la forêt. Le lendemain, des fleurs géantes multicolores ont poussé — cadeau de la forêt ! 🌸 FIN - Fin fleurie !", choices: [] }
        ]
      },
      {
        id: "s2", title: "La Station Spatiale", icon: "🚀",
        scenes: [
          { id: "s2_start", text: "Tu es astronaute à bord de la station spatiale Étoile-7 quand une alarme retentit ! Un météore a endommagé le système de navigation. Tu dois choisir vite !", choices: [{ text: "Réparer le panneau de contrôle", next: "s2_repair" }, { text: "Appeler la base terrestre", next: "s2_call" }] },
          { id: "s2_repair", text: "Tu sors en combinaison dans le vide spatial ! Les étoiles t'entourent de toutes parts. Tu trouves le câble brisé — mais un petit alien curieux l'a coincé entre ses tentacules !", choices: [{ text: "Lui parler gentiment", next: "s2_friendly" }, { text: "Lui montrer tes outils brillants", next: "s2_tools" }] },
          { id: "s2_call", text: "La base répond ! Le professeur Étoile te guide. Il faut aller chercher le module de remplacement dans la soute. En chemin, tu découvres des œufs lumineux — des bébés aliens !", choices: [{ text: "Les protéger et continuer", next: "s2_eggs" }, { text: "Alerter l'équipage", next: "s2_crew" }] },
          { id: "s2_friendly", text: "L'alien s'appelle Zorp ! Il libère le câble et t'aide à réparer la station. Il t'apprend à lire les étoiles comme une carte. Tu rentres sur Terre en héros galactique ! 👽 FIN - Mission accomplie !", choices: [] },
          { id: "s2_tools", text: "Zorp est fasciné par ta clé magnétique ! Il t'échange contre une pierre précieuse de sa planète. Avec la pierre, le câble se répare tout seul ! 💎 FIN - Fin scintillante !", choices: [] },
          { id: "s2_eggs", text: "Tu protèges les œufs et répares la station ! La maman alien arrive et, reconnaissante, te donne un cristal de téléportation. Désormais tu peux visiter n'importe quelle planète ! 🌍 FIN - Fin universelle !", choices: [] },
          { id: "s2_crew", text: "L'équipage arrive avec des combinaisons spéciales. Ensemble vous créez une nurserie spatiale pour les bébés. La NASA fait la une : « Premiers aliens découverts » ! 📰 FIN - Fin historique !", choices: [] }
        ]
      },
      {
        id: "s3", title: "Le Château de Cristal", icon: "🏰",
        scenes: [
          { id: "s3_start", text: "Tu arrives devant un château de cristal qui flotte dans les nuages. Un pont de lumière mène à la porte dorée. Un gnome gardien te pose une devinette !", choices: [{ text: "Répondre à la devinette", next: "s3_riddle" }, { text: "Trouver une autre entrée", next: "s3_sneak" }] },
          { id: "s3_riddle", text: "« Je suis grand le matin, petit à midi, et grand le soir. Qu'est-je ? » Tu souris et répondres : « Une ombre ! » Le gnome applaudit et t'ouvre les portes du château !", choices: [{ text: "Aller à la salle des trésors", next: "s3_treasure" }, { text: "Explorer la tour magique", next: "s3_tower" }] },
          { id: "s3_sneak", text: "Tu fais le tour du château et trouves une porte dans un arc-en-ciel. La fée des couleurs te laisse entrer en échange d'un dessin fait avec les nuages.", choices: [{ text: "Dessiner un dragon", next: "s3_dragon" }, { text: "Dessiner ton animal préféré", next: "s3_animal" }] },
          { id: "s3_treasure", text: "La salle des trésors est pleine de livres magiques ! Chaque livre t'emmène dans une nouvelle aventure. Tu choisis celui des océans et plonges dans des mers inconnues. 📚 FIN - Fin bibliothèque !", choices: [] },
          { id: "s3_tower", text: "Au sommet de la tour, une vieille sorcière sympa t'apprend 3 sorts utiles : guérir les blessures, faire pousser des plantes, et parler toutes les langues ! 🌿 FIN - Fin magique !", choices: [] },
          { id: "s3_dragon", text: "Le dragon de nuages prend vie ! Il t'emmène sur son dos à travers le ciel. Vous devenez les meilleurs amis et tu peux le convoquer quand tu veux avec un sifflet d'argent ! 🐲 FIN - Fin d'amitié !", choices: [] },
          { id: "s3_animal", text: "Ton animal préféré apparaît en taille géante et te protège. Ensemble vous explorez tout le château et trouvez la chambre des rêves où tes souhaits peuvent se réaliser ! ✨ FIN - Fin des rêves !", choices: [] }
        ]
      }
    ];

    let stories = st.get("stories", STORIES_DEFAULT);
    let mode = "menu"; // menu | read | edit
    let currentStoryId = null;
    let currentSceneId = null;
    let editingStory = null;

    function persist() { st.set("stories", stories); }

    function findStory(id) { return stories.find(s => s.id === id); }
    function findScene(story, id) { return story && story.scenes.find(s => s.id === id); }

    function renderMenu() {
      ctx.clear(out);
      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" } }, [
            el("h2", { style: { margin: 0 } }, "Mes histoires"),
            el("button", { class: "ff-btn primary", onClick: () => {
              const newStory = {
                id: "s" + Date.now(),
                title: "Nouvelle histoire",
                icon: "📖",
                scenes: [{ id: "scene_" + Date.now(), text: "Il était une fois…", choices: [] }]
              };
              stories.push(newStory);
              persist();
              editingStory = JSON.parse(JSON.stringify(newStory));
              mode = "edit";
              renderEdit();
            }}, "＋ Créer")
          ]),
          el("div", { style: { display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" } },
            stories.map(s => el("div", { class: "ff-panel", style: { marginBottom: "0", cursor: "pointer" } }, [
              el("div", { style: { fontSize: "36px", marginBottom: "8px" } }, s.icon || "📖"),
              el("div", { style: { fontWeight: "800", fontSize: "1.1rem", color: "var(--pg-navy)", marginBottom: "4px" } }, s.title),
              el("div", { style: { color: "var(--pg-mut)", fontSize: ".85rem", marginBottom: "12px" } }, s.scenes.length + " scène(s)"),
              el("div", { class: "ff-btns" }, [
                el("button", { class: "ff-btn primary", onClick: () => { currentStoryId = s.id; currentSceneId = s.scenes[0].id; mode = "read"; renderRead(); } }, "▶ Lire"),
                el("button", { class: "ff-btn ghost", onClick: () => { editingStory = JSON.parse(JSON.stringify(s)); mode = "edit"; renderEdit(); } }, "✏️ Éditer"),
                s.id.startsWith("s") && !["s1", "s2", "s3"].includes(s.id) ? null : null,
                el("button", { class: "ff-btn sm ghost", style: { background: "#fee2e2" }, onClick: () => {
                  if (!confirm("Supprimer « " + s.title + " » ?")) return;
                  stories = stories.filter(x => x.id !== s.id);
                  persist(); renderMenu();
                }}, "✕")
              ])
            ]))
          )
        ])
      );
    }

    function renderRead() {
      ctx.clear(out);
      const story = findStory(currentStoryId);
      if (!story) { mode = "menu"; renderMenu(); return; }
      const scene = findScene(story, currentSceneId) || story.scenes[0];

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" } }, [
            el("button", { class: "ff-btn sm ghost", onClick: () => { mode = "menu"; renderMenu(); } }, "‹ Menu"),
            el("span", { style: { fontSize: "24px" } }, story.icon || "📖"),
            el("span", { style: { fontWeight: "800", color: "var(--pg-navy)", fontSize: "1.1rem" } }, story.title)
          ]),
          el("div", { style: { background: "linear-gradient(135deg, var(--pg-pale) 0%, #fff 100%)", border: "3px solid var(--pg-navy)", borderRadius: "16px", padding: "28px", marginBottom: "20px", fontSize: "1.1rem", lineHeight: "1.8", minHeight: "120px" } }, scene.text),
          scene.choices.length > 0
            ? el("div", [
              el("div", { style: { fontWeight: "800", color: "var(--pg-navy)", marginBottom: "10px" } }, "Que choisis-tu ?"),
              el("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
                scene.choices.map((choice, idx) => el("button", {
                  class: "ff-btn",
                  style: { background: idx === 0 ? "linear-gradient(135deg, var(--pg-blue), var(--pg-navy))" : "linear-gradient(135deg, var(--pg-org), var(--pg-org2))", textAlign: "left", justifyContent: "flex-start", padding: "14px 20px", fontSize: "1rem", borderRadius: "14px" },
                  onClick: () => {
                    const nextScene = findScene(story, choice.next);
                    if (nextScene) { currentSceneId = choice.next; renderRead(); }
                    else { toast("Scène « " + choice.next + " » introuvable", "err"); }
                  }
                }, ["→ ", choice.text]))
              )
            ])
            : el("div", [
              el("div", { style: { textAlign: "center", fontSize: "48px", margin: "10px 0" } }, "🎉"),
              el("div", { class: "ff-btns", style: { justifyContent: "center" } }, [
                el("button", { class: "ff-btn primary", onClick: () => { currentSceneId = story.scenes[0].id; renderRead(); } }, "🔄 Recommencer"),
                el("button", { class: "ff-btn ghost", onClick: () => { mode = "menu"; renderMenu(); } }, "‹ Menu")
              ])
            ])
        ])
      );
    }

    function renderEdit() {
      ctx.clear(out);
      const story = editingStory;

      function saveEdit() {
        const idx = stories.findIndex(s => s.id === story.id);
        if (idx >= 0) stories[idx] = JSON.parse(JSON.stringify(story));
        else stories.push(JSON.parse(JSON.stringify(story)));
        persist(); toast("Histoire enregistrée", "ok");
      }

      out.append(
        el("div", { class: "ff-panel" }, [
          el("div", { class: "ff-btns", style: { marginBottom: "14px" } }, [
            el("button", { class: "ff-btn ghost", onClick: () => { mode = "menu"; renderMenu(); } }, "‹ Menu"),
            el("button", { class: "ff-btn primary", onClick: saveEdit }, "💾 Enregistrer")
          ]),
          el("div", { class: "ff-row" }, [
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [el("label", "Titre"), el("input", { class: "ff-input", value: story.title, onInput: e => story.title = e.target.value })]),
            ]),
            el("div", { class: "ff-col" }, [
              el("div", { class: "ff-field" }, [el("label", "Icône (emoji)"), el("input", { class: "ff-input", value: story.icon, style: { fontSize: "1.5rem" }, onInput: e => story.icon = e.target.value })])
            ])
          ]),
          el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 10px" } }, [
            el("h2", { style: { margin: 0 } }, "Scènes"),
            el("button", { class: "ff-btn sm primary", onClick: () => {
              story.scenes.push({ id: "scene_" + Date.now(), text: "Nouvelle scène…", choices: [] });
              renderEdit();
            }}, "＋ Scène")
          ]),
          ...story.scenes.map((scene, si) => el("div", { style: { border: "2px solid var(--pg-sky2)", borderRadius: "12px", padding: "14px", marginBottom: "10px" } }, [
            el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } }, [
              el("span", { style: { fontWeight: "800", color: "var(--pg-navy)", fontSize: ".9rem" } }, "ID : " + scene.id),
              si > 0 ? el("button", { class: "ff-btn sm ghost", style: { background: "#fee2e2" }, onClick: () => { story.scenes.splice(si, 1); renderEdit(); } }, "✕ Supprimer") : null
            ]),
            el("div", { class: "ff-field" }, [el("label", "Texte de la scène"), el("textarea", { class: "ff-input", rows: 3, value: scene.text, onInput: e => scene.text = e.target.value })]),
            el("div", { style: { marginBottom: "6px", fontWeight: "800", fontSize: ".85rem", color: "var(--pg-navy)" } }, "Choix (" + scene.choices.length + ")"),
            ...scene.choices.map((choice, ci) => el("div", { style: { display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" } }, [
              el("input", { class: "ff-input", value: choice.text, placeholder: "Texte du choix", style: { flex: "2" }, onInput: e => choice.text = e.target.value }),
              el("input", { class: "ff-input", value: choice.next, placeholder: "ID scène cible", style: { flex: "1" }, onInput: e => choice.next = e.target.value }),
              el("button", { class: "ff-btn sm ghost", onClick: () => { scene.choices.splice(ci, 1); renderEdit(); } }, "✕")
            ])),
            el("button", { class: "ff-btn sm ghost", onClick: () => { scene.choices.push({ text: "Choix " + (scene.choices.length + 1), next: story.scenes[0].id }); renderEdit(); } }, "＋ Choix")
          ]))
        ])
      );
    }

    root.append(out);
    renderMenu();
  }
});
