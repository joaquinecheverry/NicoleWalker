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
// row -> { amplitude, disabled, lastAutoScrollLeft, isAutoUpdating, targetScrollLeft }
const autoScrollState = new WeakMap();

// rAF throttle for reading scrollY → smoother target updates
let lastKnownScrollY = 0;
let scrollTicking = false;

// rAF id for the smoothing loop
let autoScrollRafId = null;

// Scroll listener: only computes targets, not actual motion
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
      isAutoUpdating: false,
      targetScrollLeft: 0,
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

        if (diff > 5) {
          s.disabled = true;
          autoScrollState.set(row, s);
        }
      },
      { passive: true }
    );
  });

  // apply initial targets based on current scroll (will be 0 at top)
  updateAutoScrollFromScroll();

  // start the smoothing loop if not already running
  if (!autoScrollRafId) {
    autoScrollRafId = requestAnimationFrame(animateAutoScroll);
  }
}

/**
 * Compute each row's *target* horizontal offset from vertical scroll.
 * Actual movement toward that target is smoothed in animateAutoScroll().
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

      state.targetScrollLeft = 0;

      // snap to 0 at the very top so everything lines up cleanly
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

    // just update the target; actual scroll is animated
    state.targetScrollLeft = target;
    autoScrollState.set(row, state);
  });
}

// -----------------------------
// SMOOTH ANIMATION TOWARD TARGET
// -----------------------------
function animateAutoScroll() {
  if (!autoScrollRows.length) {
    autoScrollRafId = null;
    return;
  }

  const SMOOTHING = 0.12; // 0–1, higher = faster

  autoScrollRows.forEach((row) => {
    const state = autoScrollState.get(row);
    if (!state || state.disabled) return;

    const current = row.scrollLeft;
    const target  = state.targetScrollLeft ?? 0;
    const diff    = target - current;

    // close enough → snap & stop moving
    if (Math.abs(diff) < 0.5) {
      state.isAutoUpdating = true;
      row.scrollLeft = target;
      state.lastAutoScrollLeft = target;
      state.isAutoUpdating = false;
      autoScrollState.set(row, state);
      return;
    }

    const next = current + diff * SMOOTHING;

    state.isAutoUpdating = true;
    row.scrollLeft = next;
    state.lastAutoScrollLeft = next;
    state.isAutoUpdating = false;
    autoScrollState.set(row, state);
  });

  autoScrollRafId = requestAnimationFrame(animateAutoScroll);
}

// -----------------------------
// VIDEO AUTOPLAY (MUX) SETUP
// -----------------------------
let videoObserver = null;

function setupVideoAutoplay() {
  if (videoObserver) {
    videoObserver.disconnect();
    videoObserver = null;
  }

  const videos = document.querySelectorAll(".project-item video");
  if (!videos.length) return;

  videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) {
          // Autoplay when visible (muted, so browsers allow it)
          v.play().catch(() => {});
        } else {
          // Pause when off screen
          v.pause();
        }
      });
    },
    { threshold: 0.4 } // ~40% visible
  );

  videos.forEach((v) => videoObserver.observe(v));
}

/**
 * Turn ON sound for all videos after the user has interacted.
 * Also hides the "press for sound" overlay.
 */
function enableSound() {
  const videos = document.querySelectorAll(".project-item video");
  videos.forEach((v) => {
    v.muted = false;
    v.volume = 1;
    v.removeAttribute("muted");
  });

  const prompt = document.getElementById("soundPrompt");
  if (prompt) {
    prompt.style.opacity = "0";
    setTimeout(() => {
      if (prompt.parentNode) {
        prompt.parentNode.removeChild(prompt);
      }
    }, 250);
  }
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
      const isString = typeof item === "string";
      const rawSrc   = isString ? item : item.url;
      const muxId    = !isString ? item.muxPlaybackId : null;
      const poster   = !isString ? item.posterUrl : null;

      const type =
        isString
          ? (rawSrc && (rawSrc.endsWith(".mp4") || rawSrc.endsWith(".webm")
              ? "video"
              : "image"))
          : (item.type || "image");

      const cell = document.createElement("div");
      cell.classList.add("project-item");

      let el;

      if (type === "video") {
        const video = document.createElement("video");

        // Use Mux HLS URL when available
        if (muxId) {
          const source = document.createElement("source");
          source.src = `https://stream.mux.com/${muxId}.m3u8`;
          source.type = "application/x-mpegURL";
          video.appendChild(source);
        } else if (rawSrc) {
          video.src = rawSrc;
        }

        // Poster thumbnail (gives proper thumbnail + avoids tiny black video)
        if (poster) {
          const sep = poster.includes("?") ? "&" : "?";
          const targetW = isMobile ? 500 : 1500;
          video.poster = `${poster}${sep}w=${targetW}&auto=format&q=70`;
        }

        video.loop = true;

        // REQUIRED FOR TRUE AUTOPLAY EVERYWHERE
        video.muted = true;
        video.setAttribute("muted", "");
        video.volume = 0;

        video.autoplay = true;
        video.setAttribute("autoplay", "");

        // Inline playback (iOS)
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");

        // More eager preload so first frame shows quickly
        video.preload = "auto";

        // No native controls UI
        video.controls = false;

        // Make sure it fills the cell from the very start
        video.style.display   = "block";
        video.style.width     = "100%";
        video.style.height    = "100%";
        video.style.objectFit = "cover";

        // Force first frame paint (especially on iOS Safari)
        video.addEventListener(
          "loadeddata",
          () => {
            try {
              if (video.currentTime === 0) {
                video.currentTime = 0.01;
              }
            } catch (_) {}
          },
          { once: true }
        );

        // Optional: on desktop, allow hover pause/play if you ever want it
        if (mqHoverDesktop.matches) {
          video.addEventListener("mouseenter", () => {
            if (video.paused) {
              video.play().catch(() => {});
            }
          });
          video.addEventListener("mouseleave", () => {
            video.pause();
          });
        }

        el = video;
      } else {
        const img = document.createElement("img");
        const sep = rawSrc && rawSrc.includes("?") ? "&" : "?";
        const targetW = isMobile ? 725 : 1700;
        img.src = rawSrc
          ? `${rawSrc}${sep}w=${targetW}&auto=format&q=80`
          : "";
        img.loading = "lazy";

        // Fill the cell immediately, no tiny image phase
        img.style.display   = "block";
        img.style.width     = "100%";
        img.style.height    = "100%";
        img.style.objectFit = "cover";

        el = img;
      }

      cell.appendChild(el);
      track.appendChild(cell);
    });

    projectEl.appendChild(track);

    const mediaCount = (project.media || []).length;
    projectEl.style.overflowX = mediaCount <= 1 ? "hidden" : "auto";

    if (mediaCount > 1) {
      projectEl.classList.add("has-multiple");
    }

    main.appendChild(projectEl);
  });

  // ---------------------------------------
// ADD "PRESS FOR SOUND" OVERLAY ON FIRST VIDEO
// ---------------------------------------
setTimeout(() => {
  // only if we haven't already added it
  if (document.getElementById("soundPrompt")) return;

  const firstVideo = document.querySelector(".project-item video");
  if (!firstVideo) return;

  // attach to the exact cell that holds the first video
  const parentCell = firstVideo.closest(".project-item");
  if (!parentCell) return;

  // ensure the cell can position the overlay
  parentCell.style.position = "relative";

  const overlay = document.createElement("div");
  overlay.id = "soundPrompt";
  overlay.innerText = "press for sound";

  // center inside the video cell
  overlay.style.position = "absolute";
  overlay.style.left = "50%";
  overlay.style.top = "50%";
  overlay.style.transform = "translate(-50%, -50%)";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.color = "white";
  overlay.style.padding = "6px 10px";
  overlay.style.fontSize = "11px";
  overlay.style.letterSpacing = "0.5px";
  overlay.style.borderRadius = "4px";
  overlay.style.zIndex = "9999";
  overlay.style.pointerEvents = "none";
  overlay.style.opacity = "1";
  overlay.style.transition = "opacity 0.25s ease";

  parentCell.appendChild(overlay);
}, 100);


  // 1) quick first pass
  setProjectHeights();

  // 2) after media has a moment, refine heights + init scroll/autoplay
  setTimeout(() => {
    setProjectHeights();
    setupAutoScrollHints();
    updateAutoScrollFromScroll(lastKnownScrollY || 0);
    setupVideoAutoplay();
  }, 250);
}

// -----------------------------
// MATCH ROW HEIGHT TO FIRST IMAGE
// -----------------------------
function setProjectHeights() {
  const projects = document.querySelectorAll(".project");

  projects.forEach((projectEl) => {
    const items = projectEl.querySelectorAll(".project-item");
    if (!items.length) return;

    const firstMedia = items[0].querySelector("img, video");
    if (!firstMedia) return;

    // reset so we can recalc
    projectEl.style.height = "auto";

    function applyHeightsFromFirst(naturalW, naturalH) {
      if (!naturalW || !naturalH) return;

      const rowWidth =
        projectEl.clientWidth ||
        window.innerWidth ||
        document.documentElement.clientWidth;

      const ratio = naturalH / naturalW;
      const rowHeight = Math.round(rowWidth * ratio);

      // 1) fix the row height from the first image
      projectEl.style.height = rowHeight + "px";

      // 2) make EVERY item in this row share that height,
      //    and set its width based on its own aspect ratio
      items.forEach((item) => {
        const media = item.querySelector("img, video");
        if (!media) return;

        let mw, mh;

        if (media.tagName === "IMG") {
          mw = media.naturalWidth;
          mh = media.naturalHeight;
        } else {
          mw = media.videoWidth;
          mh = media.videoHeight;
        }

        if (!mw || !mh) return;

        const aspect = mw / mh;
        const itemWidth = Math.round(rowHeight * aspect);

        item.style.width = itemWidth + "px";   // 👈 side-by-side, same height
      });
    }

    // First media might not be loaded yet → same logic as before
    if (firstMedia.tagName === "IMG") {
      if (firstMedia.complete && firstMedia.naturalWidth && firstMedia.naturalHeight) {
        applyHeightsFromFirst(firstMedia.naturalWidth, firstMedia.naturalHeight);
      } else {
        firstMedia.addEventListener(
          "load",
          () => applyHeightsFromFirst(firstMedia.naturalWidth, firstMedia.naturalHeight),
          { once: true }
        );
      }
    } else if (firstMedia.tagName === "VIDEO") {
      const video = firstMedia;
      if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
        applyHeightsFromFirst(video.videoWidth, video.videoHeight);
      } else {
        video.addEventListener(
          "loadedmetadata",
          () => applyHeightsFromFirst(video.videoWidth, video.videoHeight),
          { once: true }
        );
      }
    }
  });
}


// On the first click/tap anywhere on the page, turn sound on for all videos
document.addEventListener(
  "click",
  () => {
    enableSound();   // unmute all videos + hide overlay
  },
  { once: true }      // only run this once
);

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
        "muxPlaybackId": muxVideo.asset->playbackId,
        "posterUrl": poster.asset->url
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

    // extra safety pass a bit later for slow networks
    setTimeout(() => {
      setProjectHeights();
      setupAutoScrollHints();
      updateAutoScrollFromScroll(lastKnownScrollY || 0);
      setupVideoAutoplay();
    }, 800);
  } catch (err) {
    console.error("Error loading projects from Sanity:", err);
  }
}

// When coming back from the Index page via back/forward cache
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    loadProjectsFromSanity();
  }
});

// kick it off
loadProjectsFromSanity();
