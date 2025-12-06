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

// rAF throttle for smoother horizontal motion on fast vertical scroll
let lastKnownScrollY = 0;
let scrollTicking = false;

window.addEventListener(
  "scroll",
  () => {
    lastKnownScrollY = window.scrollY || window.pageYOffset || 0;

    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateAutoScrollFromScroll(lastKnownScrollY);
        scrollTicking = false;
      });
    }
  },
  { passive: true }
);

// ⛔️ IMPORTANT:
// We do NOT call setupAutoScrollHints() on resize anymore,
// so Safari's URL bar show/hide doesn't wipe per-row state.


// -----------------------------
// AUTO-SCROLL SETUP
// -----------------------------

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

    // Track our own last auto scroll position so we can detect user overrides
    const state = {
      amplitude,
      disabled: false,
      lastAutoScrollLeft: 0,
      isAutoUpdating: false,   // track when we are moving it via JS
    };
    autoScrollState.set(row, state);

    // start everything at the left edge
    row.scrollLeft = 0;

    // ✅ Any scroll that diverges from lastAutoScrollLeft by a bit = user input
    row.addEventListener(
      "scroll",
      () => {
        const s = autoScrollState.get(row);
        if (!s || s.disabled) return;

        // If WE are the ones updating scrollLeft, ignore this event
        if (s.isAutoUpdating) return;

        const current = row.scrollLeft;
        const diff = Math.abs(current - (s.lastAutoScrollLeft ?? 0));

        // Only real user movement (away from our last auto value)
        // should freeze auto-scroll for this row.
        if (diff > 5) {
          s.disabled = true;
          autoScrollState.set(row, s);
        }
      },
      { passive: true }
    );
  });

  // apply initial positions based on current scroll (will be 0 at top)
  updateAutoScrollFromScroll();
}

/**
 * Link each row's vertical position in the viewport -> its horizontal offset.
 * - When a row's center is near the middle of the screen, it scrolls most.
 * - When it's near the top/bottom or off-screen, it goes back toward the left.
 * - Each row uses its own amplitude, so they don't all move the same amount.
 */
function updateAutoScrollFromScroll(passedScrollY) {
  if (!autoScrollRows.length) return;

  const scrollY =
    typeof passedScrollY === "number"
      ? passedScrollY
      : (window.scrollY || window.pageYOffset || 0);

  const TOP_LOCK = 40; // dead zone at very top
  if (scrollY < TOP_LOCK) {
    autoScrollRows.forEach((row) => {
      const state = autoScrollState.get(row);
      if (!state || state.disabled) return;

      state.isAutoUpdating = true;       //  mark as auto
      row.scrollLeft = 0;
      state.lastAutoScrollLeft = 0;
      state.isAutoUpdating = false;      // done
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

    // Mark this as our own programmatic scroll so the `scroll` listener
    // doesn't treat it as user input.
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
    const mqHoverDesktop = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

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
        video.setAttribute("muted", "");           // important for iOS

        // inline playback on iOS
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");

        // more eager preload so we actually get a visible first frame on mobile
        video.preload = "auto";

        video.controls = false;   // no native UI

        // 👇 NEW: force Safari to decode & paint a frame once data is ready
        if (!mqHoverDesktop.matches) {
          video.addEventListener(
            "loadeddata",
            () => {
              try {
                // Nudge currentTime slightly so iOS draws a frame
                if (video.currentTime === 0) {
                  video.currentTime = 0.01;
                }
              } catch (e) {
                // ignore if it complains
              }
            },
            { once: true }
          );
        }

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
