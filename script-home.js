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

// Clicking "Nicole Walker" = scroll to top on HOME
if (titleEl && document.body.classList.contains("home-page")) {
  titleEl.addEventListener("click", (e) => {
    // prevent any default if this is not a real link
    if (titleEl.tagName !== "A") {
      e.preventDefault?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}


// -----------------------------
// HORIZONTAL AUTO-SCROLL HINT
// -----------------------------

// same logic as before, but with a tiny per-row "current" state
// so fast scrolling is smoothed instead of jumpy
let autoScrollRows = [];
const autoScrollState = new WeakMap(); // row -> { amplitude, current }
let scrollRafId = null;

function setupAutoScrollHints() {
  const rows = Array.from(document.querySelectorAll(".project.has-multiple"));

  autoScrollRows = rows;
  if (!autoScrollRows.length) return;

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
        // MOBILE: subtle hint (shorter travel)
        const factor = 0.25 + Math.random() * 0.2; // 0.25–0.45
        amplitude = Math.min(maxScroll * factor, 70);
      } else {
        // DESKTOP: a bit stronger
        const factor = 0.45 + Math.random() * 0.25; // 0.45–0.70
        amplitude = Math.min(maxScroll * factor, 350);
      }
    }

    autoScrollState.set(row, {
      amplitude,
      current: 0,   // smoothed scrollLeft we control
    });

    // always start aligned left on rebuild
    row.scrollLeft = 0;
  });

  // initial positioning based on current scroll (often 0 at top)
  updateAutoScrollFromScroll();
}

function updateAutoScrollFromScroll() {
  if (!autoScrollRows.length) return;

  const scrollY = window.scrollY || window.pageYOffset || 0;

  const TOP_LOCK = 40; // small dead zone at top so first view is clean

  const vh = window.innerHeight || document.documentElement.clientHeight;
  const focusY = vh * 0.35; // band slightly above center
  const maxDist = vh;       // how wide the band of influence is

  // Global ramp: fade the effect in over the first ~300px of scroll
  const RAMP_RANGE = 300;
  let global = (scrollY - TOP_LOCK) / RAMP_RANGE;
  if (global < 0) global = 0;
  if (global > 1) global = 1;

  autoScrollRows.forEach((row) => {
    const state = autoScrollState.get(row);
    if (!state) return;

    if (scrollY < TOP_LOCK) {
      // At the very top → no peek
      state.current = 0;
      row.scrollLeft = 0;
      return;
    }

    const rect = row.getBoundingClientRect();
    const rowCenter = rect.top + rect.height / 2;

    // local 0–1 based on how close the row is to the focus band
    let t = 1 - Math.abs(rowCenter - focusY) / maxDist;
    if (t < 0) t = 0;

    // smoothstep easing → less jumpy
    t = t * t * (3 - 2 * t);

    const strength = global * t;
    const target = state.amplitude * strength;

    // 🔹 smooth toward target to avoid choppy jumps on fast scroll
    const alpha = 0.2; // 0–1, smaller = smoother/slower
    const current = state.current + (target - state.current) * alpha;

    state.current = current;
    row.scrollLeft = current;
  });

  // also drive video autoplay from the same scroll pass
  updateVideoAutoplay();
}

// rAF-throttled scroll handler (same behavior, smoother)
function onScroll() {
  if (scrollRafId !== null) return;
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null;
    updateAutoScrollFromScroll();
  });
}

// Hook scroll + resize
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  setProjectHeights();
  setupAutoScrollHints();
});

// Re-run hints when the page is shown again (covers some bfcache cases)
window.addEventListener("pageshow", () => {
  setupAutoScrollHints();
  updateAutoScrollFromScroll();
});


// -----------------------------
// MOBILE VIDEO AUTOPLAY ON SCROLL
// -----------------------------

let autoVideos = [];

function setupVideoAutoplay() {
  autoVideos = Array.from(document.querySelectorAll(".project-item video"));
  // nothing else to do here; we drive them from updateVideoAutoplay()
}

function updateVideoAutoplay() {
  if (!autoVideos.length) return;

  const isDesktopHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  // Only do scroll-based autoplay on touch / non-hover devices
  if (isDesktopHover) return;

  const vh = window.innerHeight || document.documentElement.clientHeight;

  autoVideos.forEach((video) => {
    const rect = video.getBoundingClientRect();
    const height = rect.height || 1;

    const visible =
      Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const ratio = visible / height;

    // If at least ~45% of the video is visible → play, else pause
    if (ratio > 0.45) {
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
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
        video.muted = true;   // no audio
        video.volume = 0;
        video.playsInline = true;
        video.preload = "auto";   // try to show first frame / thumbnail
        video.controls = false;   // no native controls

        // hover / tap behavior (same as before)
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
          // desktop → hover to play
          video.addEventListener("mouseenter", play);
          video.addEventListener("mouseleave", pause);
          // optional click toggle
          video.addEventListener("click", () => {
            if (video.paused) play();
            else pause();
          });
        } else {
          // mobile: we rely on scroll-based autoplay,
          // but keep tap-to-toggle as a fallback
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
                moved = true;
              }
            },
            { passive: true }
          );

          video.addEventListener(
            "touchend",
            (e) => {
              if (moved) {
                startX = startY = null;
                return;
              }
              e.preventDefault();
              if (video.paused) play();
              else pause();
              startX = startY = null;
            },
            { passive: false }
          );
        }

        el = video;
      } else {
        const img = document.createElement("img");
        const sep = rawSrc.includes("?") ? "&" : "?";

        // bandwidth-friendly sizing
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

    // horizontal scroll only if there's overflow
    projectEl.style.overflowX = mediaCount <= 1 ? "hidden" : "auto";

    if (mediaCount > 1) {
      projectEl.classList.add("has-multiple");
    }

    main.appendChild(projectEl);
  });

  // match each row's height to first media
  setProjectHeights();
  setTimeout(setProjectHeights, 200); // safety for slow loads

  // and (re)build auto-scroll hints for these rows
  setupAutoScrollHints();

  // collect videos for scroll-based autoplay
  setupVideoAutoplay();
}


// -----------------------------
// MATCH ROW HEIGHT TO FIRST IMAGE
// -----------------------------
function setProjectHeights() {
  const projects = document.querySelectorAll(".project");

  projects.forEach((projectEl) => {
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
      if (
        firstMedia.complete &&
        firstMedia.naturalWidth &&
        firstMedia.naturalHeight
      ) {
        applyHeightFromDimensions(
          firstMedia.naturalWidth,
          firstMedia.naturalHeight
        );
      } else {
        firstMedia.addEventListener(
          "load",
          () =>
            applyHeightFromDimensions(
              firstMedia.naturalWidth,
              firstMedia.naturalHeight
            ),
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
          () =>
            applyHeightFromDimensions(video.videoWidth, video.videoHeight),
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
  const projectId  = "hk21ncs5";
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

    const projects = collections.map((col) => ({
      type: "mixed",
      media: col.media || []
    }));

    renderProjects(projects);

    setTimeout(setProjectHeights, 600);
  } catch (err) {
    console.error("Error loading projects from Sanity:", err);
  }
}

// kick it off on initial load
loadProjectsFromSanity();
