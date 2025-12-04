// index-view.js
// Standalone Index orbit page (no interaction with home scroll)

// ---------- SANITY FETCH ----------

const projectId = "hk21ncs5";
const dataset = "production";
const apiVersion = "2023-05-03";

let patternSources = [];   // { thumb, full }[]
let patternSketch = null;  // p5 instance

async function loadPatternImagesFromSanity() {
  const query = `
    *[_type == "photoCollection"] {
      "media": images[]{
        _type == "imageItem" => {
          "type": "image",
          "url": asset->url
        },
        _type == "videoItem" => {
          "type": "video",
          "url": file.asset->url
        }
      }
    }
  `;

  const url =
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}` +
    `?query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const collections = data.result || [];

    const thumbWidth = 100;
    const fullWidth = 900;
    const maxCount = 150;

    patternSources = collections
      .flatMap(col => col.media || [])
      .filter(item => item && item.type === "image")
      .map(item => ({
        thumb: `${item.url}?w=${thumbWidth}&auto=format&q=80`,
        full:  `${item.url}?w=${fullWidth}&auto=format&q=90`
      }))
      .sort(() => 0.5 - Math.random())
      .slice(0, maxCount);

    initPatternOrbitView();
  } catch (err) {
    console.error("Error loading pattern images:", err);
  }
}

// ---------- P5 ORBIT VIEW ----------

function initPatternOrbitView() {
  const wrap = document.getElementById("pattern-wrapper-index");
  if (!wrap) {
    console.error("pattern-wrapper-index not found");
    return;
  }

  if (!patternSources.length) {
    console.warn("No patternSources to draw");
    return;
  }

  // default params (can match your Sanity indexSettings if you want later)
  let xPatternValue = 8;
  let yPatternValue = 8;
  let radiusX = 0.45;
  let radiusY = 0.43;

  patternSketch = new p5(p => {
    let imgs = [];
    let fullResImgs = [];
    let offset = 0;
    let mouseXPos = 0;
    let mouseYPos = 0;
    let hoverScales = [];
    let selectedImage = null;
    let loadingFullRes = false;
    let appearStartTimes = [];

    p.setup = () => {
      const w = wrap.offsetWidth || window.innerWidth;
      const h = wrap.offsetHeight || window.innerHeight;
      p.createCanvas(w, h).parent(wrap);
      p.frameRate(30);
      p.pixelDensity(1);

      const n = patternSources.length;
      imgs = new Array(n).fill(null);
      fullResImgs = new Array(n).fill(null);
      hoverScales = new Array(n).fill(1.0);
      appearStartTimes = new Array(n).fill(null);

      let nextIndexToLoad = 0;
      let currentlyLoading = 0;
      const maxConcurrentLoads = 4;

      function kickOffLoads() {
        while (currentlyLoading < maxConcurrentLoads && nextIndexToLoad < n) {
          const i = nextIndexToLoad++;
          const srcObj = patternSources[i];
          if (!srcObj || !srcObj.thumb) continue;
          const thumbUrl = srcObj.thumb;

          currentlyLoading++;

          p.loadImage(
            thumbUrl,
            loadedImg => {
              const maxDim = 200;
              if (loadedImg.width > maxDim || loadedImg.height > maxDim) {
                const ratio = Math.min(
                  maxDim / loadedImg.width,
                  maxDim / loadedImg.height
                );
                loadedImg.resize(
                  loadedImg.width * ratio,
                  loadedImg.height * ratio
                );
              }
              imgs[i] = loadedImg;
              appearStartTimes[i] = p.millis();
              currentlyLoading--;
              kickOffLoads();
            },
            () => {
              console.log("Failed to load thumb:", thumbUrl);
              currentlyLoading--;
              kickOffLoads();
            }
          );
        }
      }

      kickOffLoads();
    };

    p.windowResized = () => {
      const w = wrap.offsetWidth || window.innerWidth;
      const h = wrap.offsetHeight || window.innerHeight;
      p.resizeCanvas(w, h);
    };

    p.mouseMoved = () => {
      mouseXPos = p.mouseX;
      mouseYPos = p.mouseY;
    };

    p.mouseClicked = () => {
      // close modal if open
      if (selectedImage !== null) {
        selectedImage = null;
        loadingFullRes = false;
        return;
      }

      // otherwise, see if we clicked a thumb
      for (let i = patternSources.length - 1; i >= 0; i--) {
        const img = imgs[i];
        if (!img) continue;

        const pos = i + offset;
        const x =
          p.width / 2 +
          Math.cos((pos * xPatternValue * Math.PI) / patternSources.length) *
            (p.width * radiusX);
        const y =
          p.height / 2 +
          Math.sin((pos * yPatternValue * Math.PI) / patternSources.length) *
            (p.height * radiusY);

        const maxSize = 80;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        const baseW = img.width * ratio;
        const baseH = img.height * ratio;

        const hoverScale = hoverScales[i] || 1;
        const appear = 1;
        const w = baseW * (0.8 + 0.2 * appear) * hoverScale;
        const h = baseH * (0.8 + 0.2 * appear) * hoverScale;

        const dx = p.mouseX - x;
        const dy = p.mouseY - y;
        const radius = Math.min(w, h) * 0.4;

        if (dx * dx + dy * dy <= radius * radius) {
          selectedImage = i;

          if (!fullResImgs[i]) {
            const srcObj = patternSources[i];
            const fullUrl = srcObj && (srcObj.full || srcObj.thumb);
            if (!fullUrl) continue;

            loadingFullRes = true;
            p.loadImage(
              fullUrl,
              loadedImg => {
                fullResImgs[i] = loadedImg;
                loadingFullRes = false;
              },
              () => {
                console.log("Failed to load full:", fullUrl);
                loadingFullRes = false;
              }
            );
          }
          break;
        }
      }
    };

    p.keyPressed = () => {
      if (selectedImage === null) return;

      if (p.keyCode === p.LEFT_ARROW) {
        selectedImage =
          (selectedImage - 1 + patternSources.length) % patternSources.length;
      } else if (p.keyCode === p.RIGHT_ARROW) {
        selectedImage = (selectedImage + 1) % patternSources.length;
      } else if (p.keyCode === p.ESCAPE) {
        selectedImage = null;
        loadingFullRes = false;
        return;
      }

      if (selectedImage !== null && !fullResImgs[selectedImage]) {
        loadingFullRes = true;
        const srcObj = patternSources[selectedImage];
        const fullUrl = srcObj && (srcObj.full || srcObj.thumb);
        if (!fullUrl) return;

        p.loadImage(
          fullUrl,
          loadedImg => {
            fullResImgs[selectedImage] = loadedImg;
            loadingFullRes = false;
          },
          () => {
            console.log("Failed to load full res:", fullUrl);
            loadingFullRes = false;
          }
        );
      }
    };

    p.draw = () => {
      p.background(255);

      if (p.width !== (wrap.offsetWidth || window.innerWidth) ||
          p.height !== (wrap.offsetHeight || window.innerHeight)) {
        p.resizeCanvas(
          wrap.offsetWidth || window.innerWidth,
          wrap.offsetHeight || window.innerHeight
        );
      }

      const isMobileCanvas = p.width < 768;
      offset += isMobileCanvas ? 0.007 : 0.01;

      const now = p.millis();
      let anyHovering = false;

      const isMobile = p.width < 700;
      const orbitScale = isMobile ? 0.9 : 1.0;
      const maxSizeBase = isMobile ? 30 : 80;

      for (let i = 0; i < patternSources.length; i++) {
        const img = imgs[i];
        if (!img) continue;

        const pos = i + offset;
        const x =
          p.width / 2 +
          Math.cos((pos * xPatternValue * Math.PI) / patternSources.length) *
            (p.width * radiusX * orbitScale);
        const y =
          p.height / 2 +
          Math.sin((pos * yPatternValue * Math.PI) / patternSources.length) *
            (p.height * radiusY * orbitScale);

        const maxSize = maxSizeBase;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        const baseW = img.width * ratio;
        const baseH = img.height * ratio;

        let appear = 1;
        const start = appearStartTimes[i];
        if (start !== null) {
          const elapsed = now - start;
          const duration = 400;
          const t = Math.min(1, Math.max(0, elapsed / duration));
          appear = t * t * (3 - 2 * t);
          if (t >= 1) appearStartTimes[i] = null;
        }

        const isHoveringNow =
          selectedImage === null &&
          mouseXPos > x - baseW / 2 &&
          mouseXPos < x + baseW / 2 &&
          mouseYPos > y - baseH / 2 &&
          mouseYPos < y + baseH / 2;

        const hoverTargetScale = isHoveringNow ? 1.3 : 1.0;
        hoverScales[i] += (hoverTargetScale - hoverScales[i]) * 0.5;

        const w = baseW * (0.8 + 0.2 * appear) * hoverScales[i];
        const h = baseH * (0.8 + 0.2 * appear) * hoverScales[i];

        if (isHoveringNow) anyHovering = true;

        p.tint(255, 255 * appear);
        p.imageMode(p.CENTER);
        p.image(img, x, y, w, h);
      }

      p.noTint();
      p.cursor(anyHovering || selectedImage !== null ? "pointer" : "default");

      // modal full-screen image
      if (selectedImage !== null) {
        const img = fullResImgs[selectedImage] || imgs[selectedImage];
        if (!img) {
          p.fill(0);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("Loading image...", p.width / 2, p.height / 2);
          return;
        }

        const maxWidth = p.width * 0.9;
        const maxHeight = p.height * 0.9;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const modalW = img.width * ratio;
        const modalH = img.height * ratio;

        if (loadingFullRes || !fullResImgs[selectedImage]) {
          p.drawingContext.filter = "blur(8px)";
          p.imageMode(p.CENTER);
          p.image(img, p.width / 2, p.height / 2, modalW, modalH);
          p.drawingContext.filter = "none";

          p.fill(0);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("Loading...", p.width / 2, p.height / 2);
        } else {
          p.imageMode(p.CENTER);
          p.image(fullResImgs[selectedImage], p.width / 2, p.height / 2, modalW, modalH);
        }
      }
    };
  });
}

// ---------- BOOT ----------

document.addEventListener("DOMContentLoaded", () => {
  loadPatternImagesFromSanity();
});
