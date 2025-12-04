


// Add to your script.js file
document.getElementById("InfoButton").addEventListener("click", () => {
    const infoPanel = document.getElementById("InfoContent");
    infoPanel.classList.toggle("active");
});

function closeIndexView() {
    const wrap = document.getElementById("pattern-wrapper");

    if (wrap) {
        // hide overlay and clear mobile grid
        wrap.style.display = "none";
        wrap.classList.remove("mobile-index");
        wrap.innerHTML = "";
    }

    // remove index-open (white bg + scroll lock)
    document.documentElement.classList.remove("index-open");
    document.body.classList.remove("index-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    // restore nav color
    const nav = document.getElementById("nav");
    if (nav) nav.classList.remove("pattern-active");

    // kill p5 sketch if it exists
    if (patternSketch) {
        patternSketch.remove();
        patternSketch = null;
    }

    // mark pattern as closed so Index can open again
    patternStarted = false;

    // recalc gallery row heights after unlocking layout
    setTimeout(() => {
        setProjectHeights();
    }, 0);
}



document.getElementById("Title").addEventListener("click", () => {
    // always force-close Index mode (desktop or mobile)
    closeIndexView();

    // close Info panel
    const infoPanel = document.getElementById("InfoContent");
    if (infoPanel) {
        infoPanel.classList.remove("active");
    }

    // scroll to top like fresh load
    window.scrollTo({ top: 0, behavior: "smooth" });
});



// -----------------------------
// LOAD PROJECTS FROM SANITY
// -----------------------------

const main = document.getElementById('main-column');

// For the Index pattern view
window.patternSources = [];



// -----------------------------
// GALLERY SLIDER HELPERS
// -----------------------------

// Move all media for a project side-by-side, with a continuous "offset"





function renderProjects(projects) {
    main.innerHTML = ''; // clear existing

    projects.forEach(project => {
        const projectEl = document.createElement('div');
        projectEl.classList.add('project');

        const track = document.createElement('div');
        track.classList.add('project-track');

const isMobile = window.matchMedia("(max-width: 768px)").matches;

project.media.forEach(item => {
    const rawSrc = typeof item === 'string' ? item : item.url;
    const type =
        typeof item === 'string'
            ? (rawSrc.endsWith('.mp4') || rawSrc.endsWith('.webm') ? 'video' : 'image')
            : (item.type || 'image');

    const cell = document.createElement('div');
    cell.classList.add('project-item');

    let el;

    if (type === 'video') {
        el = document.createElement('video');
        el.src = rawSrc;
        el.loop = true;
        el.muted = true;
        el.playsInline = true;

        //  don’t autoplay all videos on mobile
        if (!isMobile) {
            el.autoplay = true;
        } else {
            el.preload = 'metadata';
        }
    } else {
        el = document.createElement('img');

        // add Sanity transforms safely (works whether or not there's already a '?')
        const sep = rawSrc.includes('?') ? '&' : '?';
        const targetW = isMobile ? 900 : 1600;
        const src = `${rawSrc}${sep}w=${targetW}&auto=format&q=80`;

        el.src = src;
        el.loading = 'lazy';   //  built-in lazy loading
    }

    cell.appendChild(el);
    track.appendChild(cell);
});


        projectEl.appendChild(track);
        main.appendChild(projectEl);

        // NEW: if this shoot only has one media item, disable horizontal scroll
        const mediaCount = project.media.length || 0;
        if (mediaCount <= 1) {
            projectEl.style.overflowX = 'hidden';
        } else {
            projectEl.style.overflowX = 'auto';
        }
    });

    // After rendering, compute heights from natural dimensions
    setProjectHeights();
    // After rendering media, wait a bit and recalc the heights
setTimeout(() => {
    setProjectHeights();
}, 200);  // 200–300ms is the sweet spot for iOS Safari

}


function setProjectHeights() {
    const projects = document.querySelectorAll('.project');

    projects.forEach(projectEl => {
        const firstMedia = projectEl.querySelector(
            '.project-item:first-child img, .project-item:first-child video'
        );
        if (!firstMedia) return;

        // reset first (important when resizing)
        projectEl.style.height = 'auto';
        firstMedia.style.width = '';
        firstMedia.style.height = '';

        function applyHeightFromDimensions(naturalW, naturalH) {
            if (!naturalW || !naturalH) return;

            // actual row width in pixels (this is what we care about)
            const rowWidth =
                projectEl.clientWidth ||
                window.innerWidth ||
                document.documentElement.clientWidth;

            const ratio = naturalH / naturalW;
            const targetHeight = Math.round(rowWidth * ratio); // exact px height

            // 🔥 lock the row to this height
            projectEl.style.height = targetHeight + 'px';

            // 🔥 lock the first image to this SAME width/height
            firstMedia.style.width = rowWidth + 'px';
            firstMedia.style.height = targetHeight + 'px';
        }

        if (firstMedia.tagName === 'IMG') {
            if (firstMedia.complete && firstMedia.naturalWidth && firstMedia.naturalHeight) {
                // image already loaded (cache etc.)
                applyHeightFromDimensions(firstMedia.naturalWidth, firstMedia.naturalHeight);
            } else {
                firstMedia.addEventListener(
                    'load',
                    () => {
                        applyHeightFromDimensions(firstMedia.naturalWidth, firstMedia.naturalHeight);
                    },
                    { once: true }
                );
            }
        } else if (firstMedia.tagName === 'VIDEO') {
            const video = firstMedia;
            if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
                applyHeightFromDimensions(video.videoWidth, video.videoHeight);
            } else {
                video.addEventListener(
                    'loadedmetadata',
                    () => {
                        applyHeightFromDimensions(video.videoWidth, video.videoHeight);
                    },
                    { once: true }
                );
            }
        }
    });
}


window.addEventListener('resize', () => {
    setProjectHeights();
});


// -----------------------------
// MANUAL HORIZONTAL SWIPE
// -----------------------------



// -----------------------------
// MANUAL HORIZONTAL SWIPE (CONTINUOUS)
// -----------------------------

function enableHorizontalScrollForProjects() {
    const projects = document.querySelectorAll('.project');

    projects.forEach(project => {
        const mediaElements = project.querySelectorAll('.alt');
        if (mediaElements.length <= 1) return;

        project.addEventListener('wheel', (e) => {
            const absX = Math.abs(e.deltaX);
            const absY = Math.abs(e.deltaY);

            // Only react to fairly horizontal gestures
            if (absX <= absY * 1.5) return;
            if (absX < 5) return; // ignore tiny noise

            e.preventDefault();

            const count = mediaElements.length;
            const maxOffset = Math.max(0, count - 1);

            const current = parseFloat(project.dataset.offset || '0');

            // deltaX is in pixels; moving by window.innerWidth px = 1 full image
            const deltaOffset = e.deltaX / window.innerWidth;

            let next = current + deltaOffset;
            next = Math.max(0, Math.min(next, maxOffset));

            lastHorizontalInteraction = Date.now();
            setProjectOffset(project, next);
        }, { passive: false });
    });
}






// 2. Fetch collections from Sanity
async function loadProjectsFromSanity() {
    const projectId  = 'hk21ncs5';
    const dataset    = 'production';
    const apiVersion = '2023-05-03';

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

    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const collections = data.result || [];

        // 🔍 Detect mobile vs desktop
        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        // 🔧 Different settings per device
        const thumbWidth = isMobile ? 100 : 100;   // smaller on mobile for smooth motion
        const fullWidth  = isMobile ? 900 : 900; // still sharp when zoomed
        const maxCount   = isMobile ? 150 : 150;    // fewer images on mobile for performance

        // Collect image URLs for the Index pattern view
        window.patternSources = collections
          .flatMap(col => col.media || [])
          .filter(item => item && item.type === 'image')
          .map(item => ({
            thumb: `${item.url}?w=${thumbWidth}&auto=format&q=80`,
            full:  `${item.url}?w=${fullWidth}&auto=format&q=90`
          }))
          .sort(() => 0.5 - Math.random())
          .slice(0, maxCount);

        // map into the format renderProjects expects
        const projects = collections.map(col => ({
            type: 'mixed',
            media: col.media || []
        }));

        renderProjects(projects);
        // Failsafe for slow iOS image decoding
setTimeout(() => {
    setProjectHeights();
}, 600);
    } catch (err) {
        console.error('Error loading projects from Sanity:', err);
    }
}


// 3. Kick it off
loadProjectsFromSanity();


// -----------------------------
// AUTO-SCROLL ON VERTICAL
// -----------------------------

let lastHorizontalInteraction = 0; // defined here so both systems can share it

window.addEventListener('scroll', () => {
    const projects = document.querySelectorAll('.project');

    projects.forEach(project => {
        const mediaElements = project.querySelectorAll('.alt');
        if (mediaElements.length <= 1) return;

        // If user just interacted horizontally, don't fight them immediately
        if (Date.now() - lastHorizontalInteraction < 400) return;

        const rect = project.getBoundingClientRect();
        const projectHeight = rect.height;
        const windowHeight = window.innerHeight;

        // 0 → 1 as the project moves through the viewport
        let raw = (windowHeight - rect.top) / (windowHeight + projectHeight);
        raw = Math.max(0, Math.min(1, raw));

        // soften sensitivity so it feels medium, not hyper fast
        let progress = raw * 0.6 + 0.2;
        progress = Math.max(0, Math.min(1, progress));

        const count = mediaElements.length;
        const maxOffset = Math.max(0, count - 1);

        const targetOffset = progress * maxOffset;

        // small smoothing so it doesn't jerk
        const current = parseFloat(project.dataset.offset || '0');
        const blended = current + (targetOffset - current) * 0.15;

        setProjectOffset(project, blended);
    });
});




// -----------------------------
// IMAGE-PATTERN SYSTEM
// -----------------------------

let patternSketch = null;
let patternStarted = false;
let scrollYBeforeIndex = 0;   // NEW: remember scroll position

// defaults (used if Sanity doc missing fields)
let xPatternValue = 8;
let yPatternValue = 8;
let radiusX = 0.45;
let radiusY = 0.43;


// Load Index pattern settings from Sanity
async function loadIndexSettingsFromSanity() {
    const projectId  = 'hk21ncs5';      // same as above
    const dataset    = 'production';    // change if needed
    const apiVersion = '2023-05-03';

    const query = `
      *[_type == "indexSettings"][0]{
        xPattern,
        yPattern,
        radiusX,
        radiusY
      }
    `;

    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const settings = data.result;

        if (settings) {
            if (typeof settings.xPattern === 'number') xPatternValue = settings.xPattern;
            if (typeof settings.yPattern === 'number') yPatternValue = settings.yPattern;
            if (typeof settings.radiusX === 'number') radiusX = settings.radiusX;
            if (typeof settings.radiusY === 'number') radiusY = settings.radiusY;
        }
    } catch (err) {
        console.error('Error loading index settings from Sanity:', err);
    }
}

// call this somewhere near where you call loadProjectsFromSanity()
loadIndexSettingsFromSanity();


document.getElementById("Index").addEventListener("click", () => {
    if (patternStarted) return;
    patternStarted = true;

    const wrap = document.getElementById("pattern-wrapper");
    const isMobile = window.innerWidth < 768;  // basic mobile check

    // remember scroll and lock
    scrollYBeforeIndex = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add("index-open");
    document.body.classList.add("index-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYBeforeIndex}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    document.getElementById("nav").classList.add("pattern-active");

    // -----------------------------
    // ✅ MOBILE: SIMPLE GRID INDEX
    // -----------------------------
    if (isMobile) {
        wrap.style.display = "block";
        wrap.classList.add("mobile-index");

        // build a simple vertical grid from patternSources
        const sources = (window.patternSources && window.patternSources.length)
            ? window.patternSources
            : [];

        // full-screen grid
        const grid = document.createElement("div");
        grid.className = "mobile-index-grid";

        sources.forEach(srcObj => {
            let url = null;

            if (typeof srcObj === "string") {
                url = srcObj;
            } else if (srcObj) {
                url = srcObj.full || srcObj.thumb || null;
            }
            if (!url) return;

            const img = document.createElement("img");
            img.src = url;
            grid.appendChild(img);
        });

        wrap.innerHTML = "";
        wrap.appendChild(grid);

        // no p5 on mobile → return here
        return;
    }

    // -----------------------------
    // 💻 DESKTOP: ORIGINAL P5 ORBIT
    // -----------------------------
    wrap.style.display = "block";

    patternSketch = new p5((p) => {

        // --------------------------
        // STATE
        // --------------------------
        let imgs = [];
        let fullResImgs = [];
        let offset = 0;
        let mouseXPos = 0;
        let mouseYPos = 0;
        let hoverScales = [];
        let selectedImage = null;
        let loadingFullRes = false;
        let appearStartTimes = [];

        const sources = (window.patternSources && window.patternSources.length)
            ? window.patternSources
            : [];

        // --------------------------
        // SETUP
        // --------------------------
        p.setup = () => {
            const w = wrap.offsetWidth;
            const h = wrap.offsetHeight;
            p.createCanvas(w, h).parent(wrap);
            p.frameRate(30);
            p.pixelDensity(1);

            const n = sources.length;
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
                    const srcObj = sources[i];
                    if (!srcObj || !srcObj.thumb) continue;
                    const thumbUrl = srcObj.thumb;

                    currentlyLoading++;

                    p.loadImage(
                        thumbUrl,
                        (loadedImg) => {
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
            const w = wrap.offsetWidth;
            const h = wrap.offsetHeight;
            p.resizeCanvas(w, h);
        };

        // --------------------------
        // INPUT
        // --------------------------
        p.mouseMoved = () => {
            mouseXPos = p.mouseX;
            mouseYPos = p.mouseY;
        };

        p.mouseClicked = () => {
            if (selectedImage !== null) {
                selectedImage = null;
                loadingFullRes = false;
                return;
            }

            for (let i = sources.length - 1; i >= 0; i--) {
                const img = imgs[i];
                if (!img) continue;

                const pos = i + offset;
                const x =
                    p.width / 2 +
                    Math.cos((pos * xPatternValue * Math.PI) / sources.length) *
                        (p.width * radiusX);
                const y =
                    p.height / 2 +
                    Math.sin((pos * yPatternValue * Math.PI) / sources.length) *
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
                        const srcObj = sources[i];
                        const fullUrl = srcObj && srcObj.full ? srcObj.full : (srcObj ? srcObj.thumb : null);
                        if (!fullUrl) continue;

                        loadingFullRes = true;
                        p.loadImage(
                            fullUrl,
                            (loadedImg) => {
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
                selectedImage = (selectedImage - 1 + sources.length) % sources.length;
            } else if (p.keyCode === p.RIGHT_ARROW) {
                selectedImage = (selectedImage + 1) % sources.length;
            } else if (p.keyCode === p.ESCAPE) {
                selectedImage = null;
                loadingFullRes = false;
                return;
            }

            if (selectedImage !== null && !fullResImgs[selectedImage]) {
                loadingFullRes = true;
                const srcObj = sources[selectedImage];
                const fullUrl = srcObj && srcObj.full ? srcObj.full : (srcObj ? srcObj.thumb : null);
                if (!fullUrl) return;

                p.loadImage(
                    fullUrl,
                    (loadedImg) => {
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

        // --------------------------
        // DRAW
        // --------------------------
        p.draw = () => {
            p.background(255);

            if (p.width !== wrap.offsetWidth || p.height !== wrap.offsetHeight) {
                p.resizeCanvas(wrap.offsetWidth, wrap.offsetHeight);
            }

            const isMobileCanvas = p.width < 768;
            offset += isMobileCanvas ? 0.007 : 0.01;

            const now = p.millis();
            let anyHovering = false;

            const isMobile = p.width < 700;
            const orbitScale = isMobile ? 0.9 : 1.0;
            const maxSizeBase = isMobile ? 30 : 80;

            for (let i = 0; i < sources.length; i++) {
                const img = imgs[i];
                if (!img) continue;

                const pos = i + offset;
                const x =
                    p.width / 2 +
                    Math.cos((pos * xPatternValue * Math.PI) / sources.length) *
                        (p.width * radiusX * orbitScale);
                const y =
                    p.height / 2 +
                    Math.sin((pos * yPatternValue * Math.PI) / sources.length) *
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

                let isHoveringNow =
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

            if (selectedImage !== null) {
                const img = fullResImgs[selectedImage] || imgs[selectedImage] || null;

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
});
