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
const autoScrollState = new WeakMap(); // row -> { amplitude }

// On scroll, recompute positions (simple + robust)
window.addEventListener("scroll", updateAutoScrollFromScroll, { passive: true });

// On resize, re-measure and re-apply
window.addEventListener("resize", () => {
  setupAutoScrollHints();
  updateAutoScrollFromScroll();
});



// Update horizontal positions when page scrolls


/**
 * Initialize per-row auto-scroll state AFTER projects are rendered.
 * Called at the end of renderProjects().
 */
function setupAutoScrollHints() {
  const allRows = Array.from(
    document.querySelectorAll(".project.has-multiple")
  );

  if (!allRows.length) {
    autoScrollRows = [];
    return;
  }

  autoScrollRows = allRows;

  // Clear old state
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
        // MOBILE: subtle hint
        const factor = 0.25 + Math.random() * 0.2; // 0.25–0.45
        amplitude = Math.min(maxScroll * factor, 70);
      } else {
        // DESKTOP: noticeable but not too much
        const factor = 0.45 + Math.random() * 0.25; // 0.45–0.70
        amplitude = Math.min(maxScroll * factor, 350);
      }
    }

    autoScrollState.set(row, { amplitude });

    // Always start at left edge on (re)build
    row.scrollLeft = 0;
  });

  // Position them based on current scroll immediately
  updateAutoScrollFromScroll();
}







/**
 * Link each row's vertical position in the viewport -> its horizontal offset.
 * - When a row's center is near the middle of the screen, it scrolls most.
 * - When it's near the top/bottom or off-screen, it goes back toward the left.
 * - Each row uses its own amplitude, so they don't all move the same amount.
 */
function updateAutoScrollFromScroll() {
  if (!autoScrollRows.length) return;

  const scrollY = window.scrollY || window.pageYOffset || 0;

  const TOP_LOCK = 40; // dead zone at very top
  const vh = window.innerHeight || document.documentElement.clientHeight;

  // focus band a bit above center
  const focusY = vh * 0.35;
  const maxDist = vh; // how wide the band of influence is

  // GLOBAL RAMP: fade the effect in over the first ~300px
  const RAMP_RANGE = 300;
  let global = (scrollY - TOP_LOCK) / RAMP_RANGE;
  if (global < 0) global = 0;
  if (global > 1) global = 1;

  autoScrollRows.forEach((row) => {
    const state = autoScrollState.get(row);
    if (!state) return;

    if (scrollY < TOP_LOCK) {
      // At the top: everything perfectly aligned
      row.scrollLeft = 0;
      return;
    }

    const rect = row.getBoundingClientRect();
    const rowCenter = rect.top + rect.height / 2;

    const dist = Math.abs(rowCenter - focusY);

    // local 0–1 based on distance from focus band
    let t = 1 - dist / maxDist;
    if (t < 0) t = 0;

    // smoothstep easing
    t = t * t * (3 - 2 * t);

    const strength = global * t;
    const target = state.amplitude * strength;

    row.scrollLeft = target;
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
// When we come back from the Index page via back/forward cache,
// the JS doesn't re-run automatically. Force a fresh gallery render
// so auto-scroll + video hover/tap re-initialize correctly.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // Re-fetch + re-render projects from Sanity
    loadProjectsFromSanity();
  }
});


// kick it off
loadProjectsFromSanity();