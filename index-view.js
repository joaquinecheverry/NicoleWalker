// index-view.js
// Standalone Index orbit page using LOCAL images (thumb + full)

// ------------- IMPORT LOCAL LIST -------------
import { localPatternImages } from "./pattern-images.js";

// Shuffle a copy so order feels random each load
let patternSources = [...localPatternImages].sort(() => Math.random() - 0.5);

// 🔧 TUNING CONSTANTS
// Thumbnails (in memory, BEFORE orbit scaling)
const THUMB_MAX_DIM_DESKTOP = 100;
const THUMB_MAX_DIM_MOBILE  = 80;

// Full-image max size for zoom
const MAX_FULL_DIM_DESKTOP = 1700;
const MAX_FULL_DIM_MOBILE  = 1100;

// Concurrency: more = faster loading, but more bursty
const MAX_CONCURRENT_DESKTOP = 4;
const MAX_CONCURRENT_MOBILE  = 3;

// Sanity config (same project as the rest of the site)
const SANITY_PROJECT_ID  = "hk21ncs5";
const SANITY_DATASET     = "production";
const SANITY_API_VERSION = "2023-05-03";

// p5 instance
let patternSketch = null;

// --------------------------------------------------
// FETCH INDEX SETTINGS FROM SANITY
// --------------------------------------------------
async function fetchIndexSettingsFromSanity() {
  const query = `
    *[_type == "indexSettings"][0]{
      // try both possible field names
      xPatternMultiplier,
      yPatternMultiplier,
      xPattern,
      yPattern,
      radiusX,
      radiusY
    }
  `;
  const encoded = encodeURIComponent(query);
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encoded}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const settings = data.result || null;

    console.log("Index settings from Sanity:", settings); // 👈 debug
    return settings;
  } catch (err) {
    console.error("Failed to fetch index settings from Sanity:", err);
    return null;
  }
}


// ------------- P5 ORBIT VIEW -------------

function initPatternOrbitView(settings) {
  const wrap = document.getElementById("pattern-wrapper-index");
  if (!wrap) {
    console.error("pattern-wrapper-index not found");
    return;
  }

  if (!patternSources.length) {
    console.warn("No patternSources to draw");
    return;
  }

  // Figure out “mobile-ish” layout once at start
  const isMobileScreen = window.innerWidth < 768;
  const THUMB_MAX_DIM = isMobileScreen ? THUMB_MAX_DIM_MOBILE : THUMB_MAX_DIM_DESKTOP;
  const MAX_FULL_DIM  = isMobileScreen ? MAX_FULL_DIM_MOBILE  : MAX_FULL_DIM_DESKTOP;
  const MAX_CONCURRENT_LOADS = isMobileScreen
    ? MAX_CONCURRENT_MOBILE
    : MAX_CONCURRENT_DESKTOP;

  // Orbit parameters — driven by Sanity when present
  const rawX =
    settings?.xPatternMultiplier ??
    settings?.xPattern ??       // fallback field name
    8;

  const rawY =
    settings?.yPatternMultiplier ??
    settings?.yPattern ??       // fallback field name
    8;

  const rawRadiusX =
    typeof settings?.radiusX === "number" ? settings.radiusX : 0.45;
  const rawRadiusY =
    typeof settings?.radiusY === "number" ? settings.radiusY : 0.43;

  let xPatternValue = Number(rawX);
  let yPatternValue = Number(rawY);
  let radiusX       = Number(rawRadiusX);
  let radiusY       = Number(rawRadiusY);


  patternSketch = new p5((p) => {
    let imgs = [];             // thumb images
    let fullResImgs = [];      // cache per index
    let offset = 0;
    let mouseXPos = 0;
    let mouseYPos = 0;
    let hoverScales = [];
    let selectedImage = null;
    let loadingFullRes = false;
    let appearStartTimes = [];
    let modalImg = null;       // current full-res in the modal

    // ---------- SETUP ----------
    p.setup = () => {
      const w = wrap.offsetWidth || window.innerWidth;
      const h = wrap.offsetHeight || window.innerHeight;
      p.createCanvas(w, h).parent(wrap);

      // lower frame rate = less CPU, smoother on mobile
      p.frameRate(20);
      p.pixelDensity(1);

      const n = patternSources.length;
      imgs = new Array(n).fill(null);
      fullResImgs = new Array(n).fill(null);
      hoverScales = new Array(n).fill(1.0);
      appearStartTimes = new Array(n).fill(null);

      let nextIndexToLoad = 0;
      let currentlyLoading = 0;

      function kickOffLoads() {
        while (currentlyLoading < MAX_CONCURRENT_LOADS && nextIndexToLoad < n) {
          const i = nextIndexToLoad++;
          const srcObj = patternSources[i];
          if (!srcObj || !srcObj.thumb) continue;

          const thumbUrl = srcObj.thumb;
          currentlyLoading++;

          p.loadImage(
            thumbUrl,
            (loadedImg) => {
              if (
                loadedImg.width > THUMB_MAX_DIM ||
                loadedImg.height > THUMB_MAX_DIM
              ) {
                const ratio = Math.min(
                  THUMB_MAX_DIM / loadedImg.width,
                  THUMB_MAX_DIM / loadedImg.height
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

      // start loading thumbs
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

    // ---------- FULL-RES LOADER (for modal) ----------
    function loadFullFor(index) {
      // already have it
      if (fullResImgs[index]) {
        modalImg = fullResImgs[index];
        return;
      }

      const srcObj = patternSources[index];
      const fullUrl = (srcObj && srcObj.full) || srcObj.thumb;
      if (!fullUrl) {
        console.warn("No fullUrl for index", index);
        return;
      }

      loadingFullRes = true;
      modalImg = null;
      const thisIndex = index;

      p.loadImage(
        fullUrl,
        (loadedImg) => {
          if (
            loadedImg.width > MAX_FULL_DIM ||
            loadedImg.height > MAX_FULL_DIM
          ) {
            const ratio = Math.min(
              MAX_FULL_DIM / loadedImg.width,
              MAX_FULL_DIM / loadedImg.height
            );
            loadedImg.resize(
              loadedImg.width * ratio,
              loadedImg.height * ratio
            );
          }

          fullResImgs[thisIndex] = loadedImg;
          modalImg = loadedImg;
          loadingFullRes = false;
        },
        (err) => {
          console.error("Failed to load full:", fullUrl, err);
          loadingFullRes = false;
          modalImg = imgs[thisIndex] || null;
        }
      );
    }

    function handleClickOrTap() {
      const infoPanel = document.getElementById("InfoContent");
      if (infoPanel && infoPanel.classList.contains("active")) {
        return;
      }

      if (selectedImage !== null) {
        selectedImage = null;
        loadingFullRes = false;
        modalImg = null;
        return false;
      }

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

        const maxSize = isMobileScreen ? 60 : 85;
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
          loadFullFor(i);
          return false;
        }
      }
    }

    p.mousePressed = () => {
      return handleClickOrTap();
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
        modalImg = null;
        return;
      }

      loadFullFor(selectedImage);
    };

    // ---------- DRAW LOOP ----------
    p.draw = () => {
      p.background(255);

      if (
        p.width !== (wrap.offsetWidth || window.innerWidth) ||
        p.height !== (wrap.offsetHeight || window.innerHeight)
      ) {
        p.resizeCanvas(
          wrap.offsetWidth || window.innerWidth,
          wrap.offsetHeight || window.innerHeight
        );
      }

      const isMobileCanvas = p.width < 768;
      offset += isMobileCanvas ? 0.007 : 0.01;

      const now = p.millis();
      let anyHovering = false;

      const orbitScale = isMobileCanvas ? 0.9 : 1.0;
      const maxSizeBase = isMobileCanvas ? 36 : 70;

      p.smooth();

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

        const hoverTargetScale = isHoveringNow ? 1.25 : 1.0;
        hoverScales[i] += (hoverTargetScale - hoverScales[i]) * 0.5;

        const w = baseW * (0.8 + 0.2 * appear) * hoverScales[i];
        const h = baseH * (0.8 + 0.2 * appear) * hoverScales[i];

        if (isHoveringNow) anyHovering = true;

        p.tint(255, 255 * appear);
        p.imageMode(p.CENTER);
        p.image(img, x, y, w, h);
      }

      p.noTint();

      if (anyHovering || selectedImage !== null) {
        p.cursor("pointer");
      } else {
        p.cursor("default");
      }

      // ---------- MODAL FULL-SCREEN IMAGE ----------
      if (selectedImage !== null) {
        const img = modalImg || imgs[selectedImage];
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

        if (loadingFullRes || !modalImg) {
          p.drawingContext.filter = "blur(8px)";
          p.smooth();
          p.imageMode(p.CENTER);
          p.image(img, p.width / 2, p.height / 2, modalW, modalH);
          p.drawingContext.filter = "none";

          p.fill(0);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("Loading...", p.width / 2, p.height / 2);
          p.noSmooth();
        } else {
          p.smooth();
          p.imageMode(p.CENTER);
          p.image(modalImg, p.width / 2, p.height / 2, modalW, modalH);
          p.noSmooth();
        }
      }
    };
  });
}

// ------------- BOOT -------------

document.addEventListener("DOMContentLoaded", async () => {
  // Info toggle for INDEX page (mirror home)
  const infoBtn   = document.getElementById("InfoButton");
  const infoPanel = document.getElementById("InfoContent");

  if (infoBtn && infoPanel) {
    infoBtn.addEventListener("click", (e) => {
      e.preventDefault?.();

      const willOpen = !infoPanel.classList.contains("active");

      if (willOpen) {
        infoPanel.classList.add("active");
        infoBtn.classList.add("info-open");
      } else {
        infoPanel.classList.remove("active");
        infoBtn.classList.remove("info-open");
      }
    });
  }

  // 1) fetch settings from Sanity
  const settings = await fetchIndexSettingsFromSanity();
  // 2) init orbit with those settings (fallback to defaults if null)
  initPatternOrbitView(settings);
});
