/* Color Palette Extractor — quantification k-means réelle pour 6 couleurs dominantes */
FF.register({
  id: "palette", title: "Color Palette Extractor", icon: "🎨", tag: "Couleurs",
  desc: "Charge une image, extrait les 6 couleurs dominantes par quantification, affiche les swatches + hex.",
  mount(root, ctx) {
    const { el, store, copy, toast } = ctx;

    const canvas = el("canvas", { style: "display:none" });
    const swatchWrap = el("div", { style: "display:flex;flex-wrap:wrap;gap:14px;margin-top:16px" });
    const preview = el("img", { style: "max-width:100%;max-height:280px;border:3px solid var(--pg-navy);border-radius:14px;display:none" });

    function rgbToHex(r, g, b) {
      return "#" + [r, g, b].map(function(v) { return Math.round(v).toString(16).padStart(2, "0"); }).join("");
    }

    function colorDist(a, b) {
      return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
    }

    function kmeans(pixels, k, iterations) {
      // Init centroids via k-means++ style: pick spread-out pixels
      let centroids = [pixels[Math.floor(Math.random() * pixels.length)]];
      for (let i = 1; i < k; i++) {
        const dists = pixels.map(function(p) {
          return Math.min.apply(null, centroids.map(function(c) { return colorDist(p, c); }));
        });
        const sum = dists.reduce(function(a, b) { return a + b; }, 0);
        let rand = Math.random() * sum;
        for (let j = 0; j < dists.length; j++) {
          rand -= dists[j];
          if (rand <= 0) { centroids.push(pixels[j]); break; }
        }
        if (centroids.length <= i) centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
      }

      let assignments = new Array(pixels.length).fill(0);
      for (let iter = 0; iter < iterations; iter++) {
        // Assign
        for (let i = 0; i < pixels.length; i++) {
          let best = 0, bestD = Infinity;
          for (let j = 0; j < k; j++) {
            const d = colorDist(pixels[i], centroids[j]);
            if (d < bestD) { bestD = d; best = j; }
          }
          assignments[i] = best;
        }
        // Update centroids
        const sums = [];
        const counts = new Array(k).fill(0);
        for (let j = 0; j < k; j++) sums.push([0, 0, 0]);
        for (let i = 0; i < pixels.length; i++) {
          const j = assignments[i];
          sums[j][0] += pixels[i][0];
          sums[j][1] += pixels[i][1];
          sums[j][2] += pixels[i][2];
          counts[j]++;
        }
        for (let j = 0; j < k; j++) {
          if (counts[j] > 0) {
            centroids[j] = [sums[j][0] / counts[j], sums[j][1] / counts[j], sums[j][2] / counts[j]];
          }
        }
      }
      // Count per cluster
      const countResult = new Array(k).fill(0);
      assignments.forEach(function(a) { countResult[a]++; });
      return centroids.map(function(c, i) {
        return { r: c[0], g: c[1], b: c[2], count: countResult[i] };
      }).sort(function(a, b) { return b.count - a.count; });
    }

    function extractPalette(imgEl) {
      canvas.width = 120; canvas.height = 120;
      const c = canvas.getContext("2d");
      c.drawImage(imgEl, 0, 0, 120, 120);
      const imageData = c.getImageData(0, 0, 120, 120);
      const data = imageData.data;

      // Sample pixels (skip every 3rd to reduce noise)
      const pixels = [];
      for (let i = 0; i < data.length; i += 4 * 3) {
        if (data[i + 3] < 128) continue; // skip transparent
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }

      if (!pixels.length) { toast("Image vide ou transparente", "err"); return; }

      const colors = kmeans(pixels, 6, 12);

      while (swatchWrap.firstChild) swatchWrap.removeChild(swatchWrap.firstChild);
      colors.forEach(function(col) {
        const hex = rgbToHex(col.r, col.g, col.b);
        const pct = ((col.count / pixels.length) * 100).toFixed(1);
        const lightness = 0.299 * col.r + 0.587 * col.g + 0.114 * col.b;
        const textColor = lightness > 128 ? "#1f2937" : "#ffffff";
        const swatch = el("div", {
          style: "width:100px;text-align:center;cursor:pointer",
          onClick: function() { copy(hex); toast("Copié : " + hex, "ok"); }
        }, [
          el("div", {
            style: "width:100px;height:80px;border-radius:12px;background:" + hex + ";border:3px solid var(--pg-navy);margin-bottom:6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.8rem;color:" + textColor
          }, pct + " %"),
          el("div", { style: "font-family:monospace;font-size:.82rem;font-weight:800;color:var(--pg-navy)" }, hex),
          el("div", { class: "ff-btn sm ghost", style: "margin-top:4px;width:100%" }, "📋 Copier")
        ]);
        swatchWrap.append(swatch);
      });
      toast("Palette extraite !", "ok");
    }

    const fileInput = el("input", {
      type: "file", accept: "image/*", class: "ff-input",
      onChange: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = function() {
          preview.src = url; preview.style.display = "block";
          extractPalette(img);
        };
        img.src = url;
      }
    });

    root.append(
      el("div", { class: "ff-panel" }, [
        el("div", { class: "ff-field" }, [el("label", "Image à analyser"), fileInput]),
        el("div", { class: "ff-note" }, "Cliquer sur un swatch pour copier le code hex. Quantification k-means réelle (6 couleurs)."),
        preview,
        swatchWrap
      ]),
      canvas
    );
  }
});
