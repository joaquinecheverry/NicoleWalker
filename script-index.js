// INDEX PAGE JS

const infoButton2 = document.getElementById("InfoButton");
const infoPanel2  = document.getElementById("InfoContent");
const title2      = document.getElementById("Title");
const indexGrid   = document.getElementById("index-grid");

// Toggle info
if (infoButton2 && infoPanel2) {
  infoButton2.addEventListener("click", () => {
    infoPanel2.classList.toggle("active");
  });
}

// Clicking "Nicole Walker" here just follows the <a> back home,
// so no extra JS needed.

// -----------------------------
// STYLE INDEX GRID VIA CSS CLASS
// -----------------------------

// Add a class to body so we can style differently
document.body.classList.add("index-page");

// -----------------------------
// LOAD IMAGES FROM SANITY
// -----------------------------

async function loadIndexImages() {
  const projectId  = "hk21ncs5";
  const dataset    = "production";
  const apiVersion = "2023-05-03";

  const query = `
    *[_type == "photoCollection"] | order(order asc) {
      "media": images[]{
        _type == "imageItem" => {
          "type": "image",
          "url": asset->url
        }
      }
    }
  `;

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const collections = data.result || [];

    const allImages = collections
      .flatMap(col => col.media || [])
      .filter(item => item && item.type === "image");

    renderIndexGrid(allImages);
  } catch (err) {
    console.error("Error loading index images from Sanity:", err);
  }
}

// -----------------------------
// RENDER INDEX GRID
// -----------------------------

function renderIndexGrid(images) {
  if (!indexGrid) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  indexGrid.innerHTML = "";

  images.forEach(item => {
    const rawSrc = item.url;
    const sep = rawSrc.includes("?") ? "&" : "?";
    const targetW = isMobile ? 900 : 900;
    const src = `${rawSrc}${sep}w=${targetW}&auto=format&q=80`;

    const img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    img.className = "index-thumb";

    indexGrid.appendChild(img);
  });
}

// kick it off
loadIndexImages();
