// HOME PAGE JS: gallery + info only

// -----------------------------
// INFO TOGGLE & "HOME" BEHAVIOUR
// -----------------------------

const infoButton = document.getElementById("InfoButton");
const infoPanel  = document.getElementById("InfoContent");
const titleEl    = document.getElementById("Title");
const main       = document.getElementById("main-column");

// unified Info toggle for HOME
if (infoButton && infoPanel) {
  infoButton.addEventListener("click", (e) => {
    e.preventDefault?.();

    const willOpen = !infoPanel.classList.contains("active");

    if (willOpen) {
      infoPanel.classList.add("active");
      infoButton.classList.add("info-open");   // strike ON
    } else {
      infoPanel.classList.remove("active");
      infoButton.classList.remove("info-open"); // strike OFF
    }
  });
}

// Clicking "Nicole Walker" just scrolls to top of gallery
if (titleEl) {
  titleEl.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// -----------------------------
// GLOBALS FOR HORIZONTAL AUTO-SCROLL
// -----------------------------
let autoScrollRows = [];
const autoScrollState = new WeakMap(); // row -> { amplitude, disabled, lastAutoScrollLeft, isAutoUpdating }

// On scroll, recompute positions (simple + robust)
window.addEventListener("scroll", updateAutoScrollFromScroll, { passive: true });

// On resize, re-measure and re-apply
window.addEventListener("resize", () => {
  setupAutoScrollHints();
  updateAutoScrollFromScroll();
});

// -----------------------------
// AUTO-SCROLL INITIALIZATION
// -----------------------------
function setupAutoScrollHints() {
  const allRows = Array.from(
    document.querySelectorAll(".project.has-multiple")
  );

  if (!allRows.length) {
    autoScrollRows = [];
    return;
  }

  // Use ALL multi-image rows (including the first one)
  autoScrollRows = allRows;

  // Clear any previous state
  autoScrollRows.forEach((row) => autoScrollState.delete(row));

  autoScrollRows.forEach((row) => {
    const maxScroll = row.scrollWidth - row.clientWidth;
    if (maxScroll <= 5) {
      autoScrollState.set(row, null);
      row.scrollLeft = 0;
      return;
    }

    const isMobile = window.innerWidth <= 768;
    let amplitude;

    if (maxScroll <= 40) {
      // very small overflow: allow full travel
      amplitude = maxScroll;
    } else {
      if (isMobile) {
        // MOBILE: very subtle hint
        const factor = 0.25 + Math.random() * 0.2; // 0.25–0.45
        amplitude = Math.min(maxScroll * factor, 70);
      } else {
        // DESKTOP: noticeable but not too much
        const factor = 0.45 + Math.random() * 0.25; // 0.45–0.70
        amplitude = Math.min(maxScroll * factor, 350);
      }
    }

    const state = {
      amplitude,
      disabled: false,
      lastAutoScrollLeft: 0,
      isAutoUpdating: false,
    };
    autoScrollState.set(row, state);

    // start everything at the left edge
    row.scrollLeft = 0;

    // ========= NEW: STRONGER USER-INTENT DETECTION =========
    const disableRow = () => {
      const s = autoScrollState.get(row);
      if (!s || s.disabled) return;
      s.disabled = true;
      autoScrollState.set(row, s);
    };

    // 1) Horizontal wheel (trackpad / mouse) → user override
    row.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaX) > 10) {
          disableRow();
        }
      },
      { passive: true }
    );

    // 2) Touch horizontal swipe on the row → user override (mobile)
    let touchStartX = null;
    let touchStartY = null;

    row.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      },
      { passive: true }
    );

    row.addEventListener(
      "touchmove",
      (e) => {
        if (touchStartX == null || touchStartY == null) return;
        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;

        // clear horizontal intent threshold: mostly horizontal & > 15px
        if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy)) {
          disableRow();
          touchStartX = touchStartY = null;
        }
      },
      { passive: true }
    );

    // (Optional) scroll listener kept only for safety, but no longer disables;
    // we rely on wheel/touch for user intent so we don't mis-detect.
    row.addEventListener(
      "scroll",
      () => {
        const s = autoScrollState.get(row);
        if (!s || s.disabled) return;
        if (s.isAutoUpdating) return;
        // we could track lastManualScrollLeft here if needed later
      },
      { passive: true }
    );
  });

  // apply initial positions based on current scroll (will be 0 at top)
  updateAutoScrollFromScroll();
}

// -----------------------------
// AUTO-SCROLL POSITION UPDATE
// -----------------------------
function updateAutoScrollFromScroll() {
  if (!autoScrollRows.length) return;

  const scrollY = window.scrollY || window.pageYOffset || 0;

  const TOP_LOCK = 40; // dead zone at very top
  if (scrollY < TOP_LOCK) {
    autoScrollRows.forEach((row) => {
      const state = autoScrollState.get(row);
      if (!state || state.disabled) return;

      state.isAutoUpdating = true;
      row.scrollLeft = 0;
      state.lastAutoScrollLeft = 0;
      state.isAutoUpdating = false;
      autoScrollState.set(row, state);
    });
    return;
  }

  const vh = window.innerHeight || document.documentElement.clientHeight;

  // focus band a bit above center
  const focusY = vh * 0.35;

  // how wide the band of influence is
  const maxDist = vh; // slightly wider band → slower change

  // GLOBAL RAMP:
  const RAMP_RANGE = 300;
  let global = (scrollY - TOP_LOCK) / RAMP_RANGE;
  if (global < 0) global = 0;
  if (global > 1) global = 1;

  autoScrollRows.forEach((row) => {
    const state = autoScrollState.get(row);
    if (!state || state.disabled) return; // 🔒 don't touch user-overridden rows

    const rect = row.getBoundingClientRect();
    const rowCenter = rect.top + rect.height / 2;

    const dist = Math.abs(rowCenter - focusY);

    // local 0–1 based on distance from focus band
    let t = 1 - dist / maxDist;
    if (t < 0) t = 0;

    // smoother easing (smoothstep)
    t = t * t * (3 - 2 * t);

    // final strength = global ramp * local band
    const strength = global * t;

    const target = state.amplitude * strength;

    // Mark as programmatic so scroll listener doesn't treat it as user input
    state.isAutoUpdating = true;
    row.scrollLeft = target;
    state.lastAutoScrollLeft = target;
    state.isAutoUpdating = false;
    autoScrollState.set(row, state);
  });
}

// -----------------------------
// RENDER GALLERY ROWS
// -----------------------------
function renderProjects(projects) {
  if (!main) return;
  main.innerHTML = "";

  projects.forEach((project) => {
    const projectEl = document.createElement("div");
    projectEl.classList.add("project");

    const track = document.createElement("div");
    track.classList.add("project-track");

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    (project.media || []).forEach((item) => {
      const rawSrc = typeof item === "string" ? item : item.url;
      const type =
        typeof item === "string"
          ? (rawSrc.endsWith(".mp4") || rawSrc.endsWith(".webm")
              ? "video"
              : "image")
          : (item.type || "image");

      const cell = document.createElement("div");
      cell.classList.add("project-item");

      let el;

      if (type === "video") {
        const video = document.createElement("video");
        video.src = rawSrc;
        video.loop = true;

        // 🔇 always muted, no audio
        video.muted = true;
        video.volume = 0;

        video.playsInline = true;
        video.preload = "metadata";
        video.controls = false;   // no native UI

        const play = () => {
          if (video.paused) {
            video.play().catch((err) =>
              console.warn("Video play failed:", err)
            );
          }
        };

        const pause = () => {
          if (!video.paused) {
            video.pause();
          }
        };

        const mqHoverDesktop = window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        );

        if (mqHoverDesktop.matches) {
          // 🖱️ DESKTOP: play on hover, pause on leave
          video.addEventListener("mouseenter", play);
          video.addEventListener("mouseleave", pause);
        } else {
          // 📱 MOBILE / TOUCH: tap to toggle play/pause
          // also try to ignore horizontal swipe/scroll vs tap
          let startX = null;
          let startY = null;
          let moved = false;

          video.addEventListener(
            "touchstart",
            (e) => {
              const t = e.touches[0];
              startX = t.clientX;
              startY = t.clientY;
              moved = false;
            },
            { passive: true }
          );

          video.addEventListener(
            "touchmove",
            (e) => {
              if (startX == null || startY == null) return;
              const t = e.touches[0];
              const dx = t.clientX - startX;
              const dy = t.clientY - startY;
              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true; // treat as scroll/drag, not tap
              }
            },
            { passive: true }
          );

          video.addEventListener(
            "touchend",
            (e) => {
              if (moved) {
                // user was scrolling, don't toggle play
                startX = startY = null;
                return;
              }
              e.preventDefault();
              if (video.paused) {
                play();
              } else {
                pause();
              }
              startX = startY = null;
            },
            { passive: false }
          );

          // Fallback for some touch devices / emulators:
          video.addEventListener("click", () => {
            if (video.paused) play();
            else pause();
          });
        }

        el = video;
      } else {
        const img = document.createElement("img");
        const sep = rawSrc.includes("?") ? "&" : "?";

        // slightly reduced width + quality for bandwidth
        const targetW = isMobile ? 500 : 1500;
        img.src = `${rawSrc}${sep}w=${targetW}&auto=format&q=65`;
        img.loading = "lazy";

        el = img;
      }

      cell.appendChild(el);
      track.appendChild(cell);
    });

    projectEl.appendChild(track);

    const mediaCount = (project.media || []).length;
    projectEl.style.overflowX = mediaCount <= 1 ? "hidden" : "auto";

    // mark projects that actually have horizontal content
    if (mediaCount > 1) {
      projectEl.classList.add("has-multiple");
    }

    main.appendChild(projectEl);
  });

  // compute heights
  setProjectHeights();
  setTimeout(setProjectHeights, 200); // iOS Safari safety

  // set up interactive auto-scroll on multi-image rows
  setupAutoScrollHints();
}

// -----------------------------
// MATCH ROW HEIGHT TO FIRST IMAGE
// -----------------------------
function setProjectHeights() {
  const projects = document.querySelectorAll(".project");

  projects.forEach(projectEl => {
    const firstMedia = projectEl.querySelector(
      ".project-item:first-child img, .project-item:first-child video"
    );
    if (!firstMedia) return;

    projectEl.style.height = "auto";
    firstMedia.style.width = "";
    firstMedia.style.height = "";

    function applyHeightFromDimensions(naturalW, naturalH) {
      if (!naturalW || !naturalH) return;

      const rowWidth =
        projectEl.clientWidth ||
        window.innerWidth ||
        document.documentElement.clientWidth;

      const ratio = naturalH / naturalW;
      const targetHeight = Math.round(rowWidth * ratio);

      projectEl.style.height = targetHeight + "px";
      firstMedia.style.width = rowWidth + "px";
      firstMedia.style.height = targetHeight + "px";
    }

    if (firstMedia.tagName === "IMG") {
      if (firstMedia.complete && firstMedia.naturalWidth && firstMedia.naturalHeight) {
        applyHeightFromDimensions(firstMedia.naturalWidth, firstMedia.naturalHeight);
      } else {
        firstMedia.addEventListener(
          "load",
          () => applyHeightFromDimensions(firstMedia.naturalWidth, firstMedia.naturalHeight),
          { once: true }
        );
      }
    } else if (firstMedia.tagName === "VIDEO") {
      const video = firstMedia;
      if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
        applyHeightFromDimensions(video.videoWidth, video.videoHeight);
      } else {
        video.addEventListener(
          "loadedmetadata",
          () => applyHeightFromDimensions(video.videoWidth, video.videoHeight),
          { once: true }
        );
      }
    }
  });
}

window.addEventListener("resize", setProjectHeights);

// -----------------------------
// LOAD PROJECTS FROM SANITY
// -----------------------------
async function loadProjectsFromSanity() {
  const projectId  = "hk21ncs5";       // your project id
  const dataset    = "production";
  const apiVersion = "2023-05-03";

  const query = `
    *[_type == "photoCollection"] | order(order asc) {
      _id,
      title,
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

  const encodedQuery = encodeURIComponent(query);
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodedQuery}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const collections = data.result || [];

    const projects = collections.map(col => ({
      type: "mixed",
      media: col.media || []
    }));

    renderProjects(projects);

    setTimeout(setProjectHeights, 600);
  } catch (err) {
    console.error("Error loading projects from Sanity:", err);
  }
}

// When coming back from the Index page (via back/forward cache),
// re-fetch + re-render so auto-scroll re-initializes
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    loadProjectsFromSanity();
  }
});

// kick it off
loadProjectsFromSanity();
