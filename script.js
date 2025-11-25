// Add to your script.js file
document.getElementById("InfoButton").addEventListener("click", () => {
    const infoPanel = document.getElementById("InfoContent");
    infoPanel.classList.toggle("active");
});

document.getElementById("Title").addEventListener("click", () => {
    if (patternStarted) {
        const wrap = document.getElementById("pattern-wrapper");
        wrap.style.display = "none";
        patternStarted = false;
        // Remove class from nav to restore white text
        document.getElementById("nav").classList.remove("pattern-active");
        if (patternSketch) {
            patternSketch.remove();
            patternSketch = null;
        }
    }
    
    const infoPanel = document.getElementById("InfoContent");
    if (infoPanel.classList.contains("active")) {
        infoPanel.classList.remove("active");
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

const projects = [
    {
        type: "video",
        media: ["Selects/YUNGLEANMYAGENDA.mp4"]
    },
    {
        type: "image",
        media: ["Selects/GUSTAFNILSON2.jpg", "Selects/GUSTAFNILSON1.jpg"] 
    },
    {
        type: "image",
        media: ["Selects/SCALED6.jpg"]    
    },
    {
        type: "video",
        media: ["Selects/Ecco2k & bladee - Amygdala (Official Video) - drain gang (1080p, h264).mp4"]  
    },
    {
        type: "video",
        media: ["Selects/Starz - Yung Lean.mp4"]
    },
    {
        type: "image",
        media: ["Selects/ULTRALOVE1.jpg"]
    },
    {
        type: "image",
        media: ["Selects/VN_KK2-1140x1536.jpg", "Selects/VN_KK4-1536x1152.jpg", "Selects/VN_KK5-1536x1183.jpg", "Selects/VN_KK6-1124x1536.jpg"]
    },
    {
        type: "image",
        media: ["Selects/VN_Nuda_2-scaled.jpg", "Selects/VN_Nuda_7-scaled.jpg", "Selects/VN_Nuda_15-scaled.jpg", "Selects/VN_Nuda_17-scaled.jpg", "Selects/VN_Nuda_23-scaled.jpg"]
    },
    {
        type: "image",
        media: ["Selects/VN_Stars-4-768x1024.jpg", "Selects/VN_Stars-12-768x1024.jpg", "Selects/VN_Stars-20.jpg"]
    },
    {
        type: "image",
        media: ["Selects/VN_YL-Merch-22-Winter_Final_6-scaled.jpg"]
    },
    {
        type: "image",
        media: ["Selects/VNKIDS-2-1024x683.jpg", "Selects/VNKIDS-7.jpg", "Selects/VNKIDS-12-.jpg"]
    },
    {
        type: "image",
        media: ["Selects/xumYbS3Q.jpeg"]
    },
    {
        type: "image",
        media: ["Selects/YL5-scaled.jpeg"]
    },
    {
        type: "video",
        media: ["Selects/Yung Lean - Babyface Maniacs .mp4"]
    },
    {
        type: "image",
        media: ["Selects/HODAKOVA23-1152x1536.jpeg", "Selects/HODAKOVA29-1152x1536.jpeg", "Selects/HODAKOVA31-1152x1536.jpeg"]
    },
    {
        type: "image",
        media: ["Selects/IMG_0761.jpg"]
    },
    {
        type: "image",
        media: ["Selects/INU1.jpg", "Selects/INU2.jpg", "Selects/INU3.jpg", "Selects/INU4.jpg"]
    },
    {
        type: "image",
        media: ["Selects/NUDAPAPER.jpg"]
    },
    {
        type: "image",
        media: ["Selects/NUM1.tif", "Selects/NUM2", "Selects/NUM2.tif", "Selects/NUM3", "Selects/NUM4", "Selects/NUM5"]
    },
    {
        type: "image",
        media: ["Selects/NW_ASB__0036.jpg", "Selects/NW_ASB__0062.jpg", "Selects/NW_ASB__0067.jpg", "Selects/NW_ASB__0082.jpg", "Selects/NW_ASB__0083.jpg", "Selects/NW_ASB__0103.jpg", "Selects/NW_ASB__0109.jpg", "Selects/NW_ASB__0144.jpg"]
    },
    {
        type: "image",
        media: ["Selects/OFFICECOVER.jpg"]
    },
    {
        type: "image",
        media: ["Selects/OLLD_4047 copy.jpeg", "Selects/OLLD_5028 copy.jpeg", "Selects/OLLD_5255 copy.jpeg", "Selects/OLLD_5260 copy.jpeg", "Selects/OLLD.jpeg"]
    },
    {
        type: "image",
        media: ["Selects/032cHEELS4.jpg", "Selects/032cHEELS5.webp", "Selects/032cHEELS6.webp", "Selects/032cHEELS7.jpg", "Selects/032cHEELS8.webp", "Selects/032cHEELS9.jpg", "Selects/032cHEELS10.webp", "Selects/032cHEELS11.webp", "Selects/032cHEELS12.webp", "Selects/032cHEELS13.webp", "Selects/032cHEELS14.jpg"]
    },
    {
        type: "video",
        media: ["Selects/A virtual project by HAAL - Studio Bon.mp4"]
    },
    {
        type: "video",
        media: ["Selects/Big Anonymous, the film (by El Perro del Mar).mp4"]
    },
    {
        type: "image",
        media: ["Selects/BLBA_1668_1-scaled.jpg", "Selects/BLBA_1784-scaled.jpg", "Selects/BLBA_2003-scaled.jpg", "Selects/BLBA_2185-scaled.jpg"]
    },
    {
        type: "image",
        media: ["Selects/BLBALD.jpeg", "Selects/BLBALD2.jpg"]
    },
    {
        type: "image",
        media: ["Selects/CARCYCOVER.jpg"]
    },
    {
        type: "video",
        media: ["Selects/DJ Billybool - BLOMSTE...OOL (1080p, h264).mp4"]
    },
    {
        type: "image",
        media: ["Selects/EDIT1.jpg"]
    },
    {
        type: "video",
        media: ["Selects/El Perro del Mar - Dream...l Mar (1080p, h264).mp4"]
    },
    {
        type: "image",
        media: ["Selects/GOODLUCK1.jpg"]
    },
    {
        type: "image",
        media: ["Selects/HEAT_SINGLES_06-07.jpg", "Selects/HEAT_SINGLES_10-11.jpg"]
    }
];

const main = document.getElementById('main-column');

projects.forEach(project => {
    const container = document.createElement('div');
    container.classList.add('project');

    project.media.forEach((src, i) => {
        let el;

        if (src.endsWith('.mp4') || src.endsWith('.webm')) {
            el = document.createElement('video');
            el.src = src;
            el.autoplay = true;
            el.loop = true;
            el.muted = true;
            el.playsInline = true;
        } else {
            el = document.createElement('img');
            el.src = src;
        }

        el.classList.add('alt');
        if (i === 0) el.classList.add('active');

        container.appendChild(el);
    });

    main.appendChild(container);
});

// Auto-scroll through projects with multiple images
window.addEventListener('scroll', () => {
    const projects = document.querySelectorAll('.project');
    
    projects.forEach(project => {
        const mediaElements = project.querySelectorAll('.alt');
        
        if (mediaElements.length <= 1) return;
        
        const rect = project.getBoundingClientRect();
        const projectHeight = rect.height;
        const windowHeight = window.innerHeight;
        
        // Calculate how far through the viewport the project is
        let scrollProgress = (windowHeight - rect.top) / (windowHeight + projectHeight);
        scrollProgress = Math.max(0, Math.min(1, scrollProgress));
        
        const mediaIndex = Math.floor(scrollProgress * mediaElements.length);
        const clampedIndex = Math.min(mediaIndex, mediaElements.length - 1);
        
        mediaElements.forEach((el, i) => {
            if (i === clampedIndex) {
                el.classList.add('active');
                el.classList.remove('passed');
            } else if (i < clampedIndex) {
                el.classList.remove('active');
                el.classList.add('passed');
            } else {
                el.classList.remove('active');
                el.classList.remove('passed');
            }
        });
    });
});



// -----------------------------
// IMAGE-PATTERN SYSTEM
// -----------------------------

let patternSketch = null;
let patternStarted = false;
let xPatternValue = 8;
let yPatternValue = 8;
let radiusX = 0.4;
let radiusY = 0.35;

// Add event listeners for the pattern controls
document.getElementById("xPattern").addEventListener("input", (e) => {
    xPatternValue = parseFloat(e.target.value);
});

document.getElementById("yPattern").addEventListener("input", (e) => {
    yPatternValue = parseFloat(e.target.value);
});

document.getElementById("radiusX").addEventListener("input", (e) => {
    radiusX = parseFloat(e.target.value);
});

document.getElementById("radiusY").addEventListener("input", (e) => {
    radiusY = parseFloat(e.target.value);
});

// click to activate
document.getElementById("Index").addEventListener("click", () => {
    if (patternStarted) return;

    patternStarted = true;

    const wrap = document.getElementById("pattern-wrapper");
    wrap.style.display = "block";
    
    // Add class to nav to change text color to black
    document.getElementById("nav").classList.add("pattern-active");

    // start p5 *now*, when wrapper is visible
    patternSketch = new p5((p) => {

        let imgs = [];
        let fullResImgs = []; // Store full resolution images
        let txt = "NIC0LEWALKERINDEX";
        let offset = 0;
        let mouseXPos = 0;
        let mouseYPos = 0;
        let hoverScales = []; // Track scale for each image
        let selectedImage = null; // Track clicked image
        let loadingFullRes = false; // Track if loading full res image

        // load small set of your images
        const sources = [
            "Selects/GUSTAFNILSON2.jpg",
            "Selects/GUSTAFNILSON1.jpg",
            "Selects/SCALED6.jpg",
            "Selects/ULTRALOVE1.jpg",
            "Selects/VN_KK2-1140x1536.jpg",
            "Selects/VN_KK4-1536x1152.jpg",
            "Selects/VN_KK5-1536x1183.jpg",
            "Selects/VN_KK6-1124x1536.jpg",
            "Selects/VN_Nuda_2-scaled.jpg",
            "Selects/VN_Nuda_7-scaled.jpg",
            "Selects/VN_Nuda_15-scaled.jpg",
            "Selects/VN_Nuda_17-scaled.jpg",
            "Selects/VN_Nuda_23-scaled.jpg",
            "Selects/VN_Stars-4-768x1024.jpg",
            "Selects/VN_Stars-12-768x1024.jpg",
            "Selects/VN_Stars-20.jpg",
            "Selects/VN_YL-Merch-22-Winter_Final_6-scaled.jpg",
            "Selects/VNKIDS-2-1024x683.jpg",
            "Selects/VNKIDS-7.jpg",
            "Selects/VNKIDS-12-.jpg",
            "Selects/xumYbS3Q.jpeg",
            "Selects/YL5-scaled.jpeg",
            "Selects/HODAKOVA23-1152x1536.jpeg",
            "Selects/HODAKOVA29-1152x1536.jpeg",
            "Selects/HODAKOVA31-1152x1536.jpeg",
            "Selects/IMG_0761.jpg",
            "Selects/INU1.jpg",
            "Selects/INU2.jpg",
            "Selects/INU3.jpg",
            "Selects/INU4.jpg",
            "Selects/NUDAPAPER.jpg",
            "Selects/NW_ASB__0036.jpg",
            "Selects/NW_ASB__0062.jpg",
            "Selects/NW_ASB__0067.jpg",
            "Selects/NW_ASB__0082.jpg",
            "Selects/NW_ASB__0083.jpg",
            "Selects/NW_ASB__0103.jpg",
            "Selects/NW_ASB__0109.jpg",
            "Selects/NW_ASB__0144.jpg",
            "Selects/OFFICECOVER.jpg",
            "Selects/OLLD_4047 copy.jpeg",
            "Selects/OLLD_5028 copy.jpeg",
            "Selects/OLLD_5255 copy.jpeg",
            "Selects/OLLD_5260 copy.jpeg",
            "Selects/OLLD.jpeg",
            "Selects/032cHEELS4.jpg",
            "Selects/032cHEELS5.webp",
            "Selects/032cHEELS6.webp",
            "Selects/032cHEELS7.jpg",
            "Selects/032cHEELS8.webp",
            "Selects/032cHEELS9.jpg",
            "Selects/032cHEELS10.webp",
            "Selects/032cHEELS11.webp",
            "Selects/032cHEELS12.webp",
            "Selects/032cHEELS13.webp",
            "Selects/032cHEELS14.jpg",
            "Selects/BLBA_1668_1-scaled.jpg",
            "Selects/BLBA_1784-scaled.jpg",
            "Selects/BLBA_2003-scaled.jpg",
            "Selects/BLBA_2185-scaled.jpg",
            "Selects/BLBALD.jpeg",
            "Selects/BLBALD2.jpg",
            "Selects/CARCYCOVER.jpg",
            "Selects/EDIT1.jpg",
            "Selects/GOODLUCK1.jpg",
            "Selects/HEAT_SINGLES_06-07.jpg",
            "Selects/HEAT_SINGLES_10-11.jpg"
        ];

        
        p.preload = () => {
            // Load images at reduced size for pattern
            sources.forEach(src => {
                let im = p.loadImage(src, 
                    (loadedImg) => {
                        // Resize to max 200px for pattern display
                        const maxDim = 200;
                        if (loadedImg.width > maxDim || loadedImg.height > maxDim) {
                            const ratio = Math.min(maxDim / loadedImg.width, maxDim / loadedImg.height);
                            loadedImg.resize(loadedImg.width * ratio, loadedImg.height * ratio);
                        }
                    },
                    () => { console.log('Failed to load:', src); }
                );
                imgs.push(im);
                fullResImgs.push(null); // Initialize as null
            });
        };

        p.setup = () => {
            const w = wrap.offsetWidth;
            const h = wrap.offsetHeight - 40;
            p.createCanvas(w, h).parent(wrap);
            p.frameRate(30);
            p.pixelDensity(1); // Reduce pixel density for better performance
            
            // Initialize hover scales for each image
            hoverScales = new Array(sources.length).fill(1.0);
        };
        
        // Keyboard navigation
        p.keyPressed = () => {
            if (selectedImage === null) return;
            
            if (p.keyCode === p.LEFT_ARROW) {
                // Go to previous image
                selectedImage = (selectedImage - 1 + sources.length) % sources.length;
                
                // Load full resolution if not already loaded
                if (fullResImgs[selectedImage] === null) {
                    loadingFullRes = true;
                    p.loadImage(sources[selectedImage], 
                        (loadedImg) => {
                            fullResImgs[selectedImage] = loadedImg;
                            loadingFullRes = false;
                        },
                        () => {
                            console.log('Failed to load full res:', sources[selectedImage]);
                            loadingFullRes = false;
                        }
                    );
                }
            } else if (p.keyCode === p.RIGHT_ARROW) {
                // Go to next image
                selectedImage = (selectedImage + 1) % sources.length;
                
                // Load full resolution if not already loaded
                if (fullResImgs[selectedImage] === null) {
                    loadingFullRes = true;
                    p.loadImage(sources[selectedImage], 
                        (loadedImg) => {
                            fullResImgs[selectedImage] = loadedImg;
                            loadingFullRes = false;
                        },
                        () => {
                            console.log('Failed to load full res:', sources[selectedImage]);
                            loadingFullRes = false;
                        }
                    );
                }
            } else if (p.keyCode === p.ESCAPE || p.key === 'Escape') {
                // Close modal with Escape key
                selectedImage = null;
                loadingFullRes = false;
            }
        };

        p.windowResized = () => {
            const w = wrap.offsetWidth;
            const h = wrap.offsetHeight - 40;
            p.resizeCanvas(w, h);
        };

        // Track mouse position
        p.mouseMoved = () => {
            mouseXPos = p.mouseX;
            mouseYPos = p.mouseY;
        };

        // Handle clicks
        p.mouseClicked = () => {
            // If modal is open, close it
            if (selectedImage !== null) {
                selectedImage = null;
                loadingFullRes = false;
                return;
            }

            // Check if clicked on an image
            for (let i = 0; i < imgs.length; i++) {   
                let pos = i + offset;
                let x = p.width / 2 + Math.cos(pos * xPatternValue * Math.PI / imgs.length) * (p.width * radiusX);
                let y = p.height / 2 + Math.sin(pos * yPatternValue * Math.PI / imgs.length) * (p.height * radiusY);
                
                let img = imgs[i];
                const maxSize = 130;
                const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                const w = img.width * ratio * hoverScales[i];
                const h = img.height * ratio * hoverScales[i];
                
                // Check if click is within image bounds
                if (p.mouseX > x - w/2 && p.mouseX < x + w/2 &&
                    p.mouseY > y - h/2 && p.mouseY < y + h/2) {
                    selectedImage = i;
                    
                    // Load full resolution if not already loaded
                    if (fullResImgs[i] === null) {
                        loadingFullRes = true;
                        p.loadImage(sources[i], 
                            (loadedImg) => {
                                fullResImgs[i] = loadedImg;
                                loadingFullRes = false;
                            },
                            () => {
                                console.log('Failed to load full res:', sources[i]);
                                loadingFullRes = false;
                            }
                        );
                    }
                    break;
                }
            }
        };

        // In the p.draw() function, replace the hover logic section with this:

p.draw = () => {
    p.background(255);
    
    // Always animate pattern
    offset += 0.01;

    // Draw all images in pattern
    for (let i = 0; i < imgs.length; i++) {   
        let pos = i + offset;

        let x = p.width / 2 + Math.cos(pos * xPatternValue * Math.PI / imgs.length) * (p.width * radiusX);
        let y = p.height / 2 + Math.sin(pos * yPatternValue * Math.PI / imgs.length) * (p.height * radiusY);

        let img = imgs[i];

        const maxSize = 80;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        
        // Calculate image bounds
        const baseW = img.width * ratio;
        const baseH = img.height * ratio;
        
        // Check if mouse is hovering over this image
        let isHovering = false;
        if (selectedImage === null) {
            isHovering = mouseXPos > x - baseW/2 && 
                        mouseXPos < x + baseW/2 &&
                        mouseYPos > y - baseH/2 && 
                        mouseYPos < y + baseH/2;
        }
        
        // Set target scale: 1.3 if hovering, 1.0 if not
        let targetScale = isHovering ? 1.3 : 1.0;
        
        // Smooth animation towards target scale
        hoverScales[i] += (targetScale - hoverScales[i]) * 0.5;
        
        const w = baseW * hoverScales[i];
        const h = baseH * hoverScales[i];

        // Change cursor to pointer when hovering
        if (isHovering) {
            p.cursor('pointer');
        }

        // No tinting - keep full opacity
        p.noTint();

        p.imageMode(p.CENTER);
        p.image(img, x, y, w, h);
    }
    
    // Reset cursor to default if not hovering any image
    let anyHovering = false;
    for (let i = 0; i < imgs.length; i++) {
        let pos = i + offset;
        let x = p.width / 2 + Math.cos(pos * xPatternValue * Math.PI / imgs.length) * (p.width * radiusX);
        let y = p.height / 2 + Math.sin(pos * yPatternValue * Math.PI / imgs.length) * (p.height * radiusY);
        let img = imgs[i];
        const maxSize = 130;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        const baseW = img.width * ratio;
        const baseH = img.height * ratio;
        
        if (selectedImage === null && 
            mouseXPos > x - baseW/2 && mouseXPos < x + baseW/2 &&
            mouseYPos > y - baseH/2 && mouseYPos < y + baseH/2) {
            anyHovering = true;
            break;
        }
    }
    
    if (!anyHovering && selectedImage === null) {
        p.cursor('default');
    }
    
    // Draw modal if an image is selected
    if (selectedImage !== null) {
        p.cursor('pointer'); // Show pointer in modal to indicate it's clickable
        
        // Calculate modal image size (same for both low-res and full-res)
        let img = fullResImgs[selectedImage] || imgs[selectedImage];
        let maxWidth = p.width * 0.9;
        let maxHeight = p.height * 0.9;
        let ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        let modalW = img.width * ratio;
        let modalH = img.height * ratio;
        
        // Show loading state with blurred low-res preview
        if (loadingFullRes || fullResImgs[selectedImage] === null) {
            // Draw blurred low-res version at full modal size
            p.drawingContext.filter = 'blur(8px)';
            p.noTint();
            p.imageMode(p.CENTER);
            p.image(imgs[selectedImage], p.width / 2, p.height / 2, modalW, modalH);
            p.drawingContext.filter = 'none';
            
            // Loading text overlay
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(20);
            p.text('Loading...', p.width / 0, p.height / 0);
        } else {
            // Draw full resolution image (sharp)
            p.noTint();
            p.imageMode(p.CENTER);
            p.image(fullResImgs[selectedImage], p.width / 2, p.height / 2, modalW, modalH);
        }
    }
};
        
        
        
    });
});