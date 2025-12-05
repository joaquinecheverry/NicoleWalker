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
      infoButton.classList.add("info-open");   // ✅ strike ON
    } else {
      infoPanel.classList.remove("active");
      infoButton.classList.remove("info-open"); // ✅ strike OFF
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
// RENDER GALLERY ROWS
// -----------------------------

function renderProjects(projects) {
  if (!main) return;
  main.innerHTML = "";

  projects.forEach(project => {
    const projectEl = document.createElement("div");
    projectEl.classList.add("project");

    const track = document.createElement("div");
    track.classList.add("project-track");

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    (project.media || []).forEach(item => {
      const rawSrc = typeof item === "string" ? item : item.url;
      const type =
        typeof item === "string"
          ? (rawSrc.endsWith(".mp4") || rawSrc.endsWith(".webm") ? "video" : "image")
          : (item.type || "image");

      const cell = document.createElement("div");
      cell.classList.add("project-item");

      let el;

      if (type === "video") {
        el = document.createElement("video");
        el.src = rawSrc;
        el.loop = true;
        el.muted = true;
        el.playsInline = true;

        if (!isMobile) {
          el.autoplay = true;
        } else {
          el.preload = "metadata";
        }
      } else {
        el = document.createElement("img");

        const sep = rawSrc.includes("?") ? "&" : "?";
        const targetW = isMobile ? 900 : 1600;
        const src = `${rawSrc}${sep}w=${targetW}&auto=format&q=80`;

        el.src = src;
        el.loading = "lazy";
      }

      cell.appendChild(el);
      track.appendChild(cell);
    });

    projectEl.appendChild(track);
    main.appendChild(projectEl);

    const mediaCount = (project.media || []).length;
    projectEl.style.overflowX = mediaCount <= 1 ? "hidden" : "auto";
  });

  // compute heights
  setProjectHeights();
  setTimeout(setProjectHeights, 200);   // iOS Safari safety
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

// kick it off
loadProjectsFromSanity();
