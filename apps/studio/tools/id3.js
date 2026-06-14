/* Éditeur de Tags ID3 — écrit vraie balise ID3v2.3 (TIT2/TPE1/TALB/TYER/TCON) */
FF.register({
  id: "id3", title: "Éditeur de Tags ID3", icon: "🎵", tag: "Audio",
  desc: "Charge un MP3, édite les tags ID3v2.3 (titre, artiste, album, année, genre) et télécharge.",
  mount(root, ctx) {
    const { el, store, save, toast } = ctx;
    const st = store("id3");
    let audioBytes = null;
    let fileName = "audio.mp3";

    let tags = st.get("tags", { title: "", artist: "", album: "", year: "", genre: "" });

    function encodeISO(str) {
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        bytes.push(c < 256 ? c : 63); // '?' pour les chars hors latin-1
      }
      return new Uint8Array(bytes);
    }

    function makeFrame(id, text) {
      if (!text) return null;
      const textBytes = encodeISO(text);
      // Frame: 4 bytes ID + 4 bytes size + 2 bytes flags + 1 byte encoding + text bytes
      const frameSize = 1 + textBytes.length;
      const buf = new Uint8Array(10 + frameSize);
      for (let i = 0; i < 4; i++) buf[i] = id.charCodeAt(i);
      // Size big-endian 4 bytes
      buf[4] = (frameSize >> 24) & 0xff;
      buf[5] = (frameSize >> 16) & 0xff;
      buf[6] = (frameSize >> 8) & 0xff;
      buf[7] = frameSize & 0xff;
      buf[8] = 0; buf[9] = 0; // flags
      buf[10] = 0; // encoding: ISO-8859-1
      buf.set(textBytes, 11);
      return buf;
    }

    function buildID3v2(tags) {
      const frames = [];
      const map = { title: "TIT2", artist: "TPE1", album: "TALB", year: "TYER", genre: "TCON" };
      for (const [key, frameId] of Object.entries(map)) {
        const f = makeFrame(frameId, tags[key]);
        if (f) frames.push(f);
      }
      if (!frames.length) return new Uint8Array(0);
      const totalFrameSize = frames.reduce(function(a, f) { return a + f.length; }, 0);
      // Padding: 128 bytes
      const padding = 128;
      const tagSize = totalFrameSize + padding;
      // Encode tagSize en synchsafe (ID3v2.3)
      const ss = encodeSynchsafe(tagSize);
      const header = new Uint8Array(10);
      header[0] = 0x49; header[1] = 0x44; header[2] = 0x33; // "ID3"
      header[3] = 0x03; header[4] = 0x00; // version 2.3.0
      header[5] = 0x00; // flags
      header[6] = ss[0]; header[7] = ss[1]; header[8] = ss[2]; header[9] = ss[3];
      const result = new Uint8Array(10 + tagSize);
      result.set(header, 0);
      let offset = 10;
      frames.forEach(function(f) { result.set(f, offset); offset += f.length; });
      // padding: zeros (already zero from new Uint8Array)
      return result;
    }

    function encodeSynchsafe(n) {
      const b = [0, 0, 0, 0];
      b[3] = n & 0x7f; n >>= 7;
      b[2] = n & 0x7f; n >>= 7;
      b[1] = n & 0x7f; n >>= 7;
      b[0] = n & 0x7f;
      return b;
    }

    function stripExistingID3(bytes) {
      if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        const sz = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
        return bytes.slice(10 + sz);
      }
      return bytes;
    }

    function tagAndDownload() {
      if (!audioBytes) { toast("Charge un fichier MP3 d'abord", "err"); return; }
      st.set("tags", tags);
      const stripped = stripExistingID3(audioBytes);
      const id3 = buildID3v2(tags);
      const merged = new Uint8Array(id3.length + stripped.length);
      merged.set(id3, 0);
      merged.set(stripped, id3.length);
      save(fileName.replace(/\.mp3$/i, "") + "-tagged.mp3", new Blob([merged], { type: "audio/mpeg" }), "audio/mpeg");
      toast("MP3 tagué téléchargé !", "ok");
    }

    function field(key, label, placeholder) {
      const inp = el("input", {
        class: "ff-input", type: "text", value: tags[key], placeholder: placeholder || "",
        onInput: function(e) { tags[key] = e.target.value; }
      });
      return el("div", { class: "ff-field" }, [el("label", label), inp]);
    }

    const fileInput = el("input", {
      type: "file", accept: "audio/mpeg,.mp3", class: "ff-input",
      onChange: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        fileName = file.name;
        const reader = new FileReader();
        reader.onload = function(ev) {
          audioBytes = new Uint8Array(ev.target.result);
          toast("MP3 chargé (" + (audioBytes.length / 1024).toFixed(1) + " Ko)", "ok");
        };
        reader.readAsArrayBuffer(file);
      }
    });

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Fichier MP3"), fileInput]),
        el("div", { class: "ff-row" }, [
          el("div", { class: "ff-col" }, [
            field("title", "Titre (TIT2)", "Titre de la piste"),
            field("artist", "Artiste (TPE1)", "Nom de l'artiste"),
            field("album", "Album (TALB)", "Nom de l'album")
          ]),
          el("div", { class: "ff-col" }, [
            field("year", "Année (TYER)", "ex: 2024"),
            field("genre", "Genre (TCON)", "ex: Rock, Pop…")
          ])
        ]),
        el("div", { class: "ff-btns" }, [
          el("button", { class: "ff-btn primary", onClick: tagAndDownload }, "⬇️ Écrire les tags & Télécharger")
        ]),
        el("div", { class: "ff-note" }, "Format ID3v2.3 — texte en ISO-8859-1. Frames : TIT2, TPE1, TALB, TYER, TCON.")
      ])
    );
  }
});
