// Catalog Page - Single Page View Implementation
async function loadCatalogs() {
    const catalogsGrid = document.getElementById('catalogs-grid');
    if (!catalogsGrid) return;

    try {
        // Wait for Supabase to be available
        if (!window.supabase) {
            setTimeout(loadCatalogs, 100);
            return;
        }

        const { data: catalogs, error } = await window.supabase
            .from('catalogs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading catalogs:', error);
            catalogsGrid.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; grid-column: 1/-1;">Kataloglar yüklenemedi.</p>';
            return;
        }

        if (!catalogs || catalogs.length === 0) {
            catalogsGrid.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; grid-column: 1/-1;">Henüz katalog eklenmemiş.</p>';
            return;
        }

        catalogsGrid.innerHTML = '';
        catalogs.forEach(catalog => {
            const card = document.createElement('div');
            card.className = 'catalog-card';
            card.innerHTML = `
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); height: 300px; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-file-pdf" style="font-size: 4rem; color: #c9a961;"></i>
                </div>
                <div class="catalog-card-content">
                    <h3>${catalog.name}</h3>
                    <p>${catalog.total_pages || 0} sayfa</p>
                    <button onclick="openCatalogViewer('${catalog.pdf_url}', '${catalog.name}')">
                        <i class="fa-solid fa-eye"></i> İncele
                    </button>
                </div>
            `;
            catalogsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error:', error);
        catalogsGrid.innerHTML = '<p style="color: var(--color-text-muted); text-align: center;">Bir hata oluştu.</p>';
    }
}

// PDF Viewer Logic
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let baseScale = 1.5; // Initial render scale
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Zoom & Pan State
let isZoomed = false;
let zoomScale = 1; // 1 = normal, 2.5 = zoomed
let panX = 0;
let panY = 0;
let isDragging = false;
let startX, startY;

async function openCatalogViewer(url, title) {
    const modal = document.getElementById('catalog-modal');
    const modalTitle = document.getElementById('modal-title');
    const loadingMsg = document.getElementById('loading-msg');
    const iconOverlay = document.getElementById('zoom-icon-overlay');

    if (!modal || !canvas) return;

    modalTitle.textContent = title;
    modal.classList.add('active');

    // Reset state
    pdfDoc = null;
    pageNum = 1;
    resetZoom();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    loadingMsg.style.display = 'block';
    canvas.style.display = 'none';
    if (iconOverlay) iconOverlay.style.display = 'none';

    // Ensure responsive scale based on screen width
    updateBaseScale();

    try {
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;

        document.getElementById('page-indicator').textContent = `Sayfa ${pageNum} / ${pdfDoc.numPages}`;
        loadingMsg.style.display = 'none';
        canvas.style.display = 'block';
        if (iconOverlay) iconOverlay.style.display = 'flex';

        renderPage(pageNum);
        updateButtons();
    } catch (error) {
        console.error('Error loading PDF:', error);
        loadingMsg.textContent = 'Katalog yüklenirken hata oluştu.';
    }
}

function updateBaseScale() {
    if (window.innerWidth < 768) {
        baseScale = 0.6; // Smaller scale for mobile
    } else if (window.innerWidth < 1200) {
        baseScale = 1.0; // Medium scale for tablets/laptops
    } else {
        baseScale = 1.5; // Full scale for desktops
    }
}

function renderPage(num) {
    pageRendering = true;

    // Fetch page
    pdfDoc.getPage(num).then(function (page) {
        // Calculate scale to fit container width/height
        const container = document.querySelector('.pdf-viewer-container');
        const containerWidth = container.clientWidth - 40; // padding
        const containerHeight = container.clientHeight - 40;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / unscaledViewport.width;
        const scaleY = containerHeight / unscaledViewport.height;

        // Use the smaller scale to fit entirely within container (contain)
        const fitScale = Math.min(scaleX, scaleY);

        const viewport = page.getViewport({ scale: fitScale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        // Wait for render to finish
        renderTask.promise.then(function () {
            pageRendering = false;

            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Update page counters
    document.getElementById('page-indicator').textContent = `Sayfa ${num} / ${pdfDoc.numPages}`;

    // Reset zoom on page turn
    resetZoom();
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
    updateButtons();
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
    updateButtons();
}

function updateButtons() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    prevBtn.disabled = pageNum <= 1;
    nextBtn.disabled = pageNum >= pdfDoc.numPages;
}

// --- Zoom & Pan Logic ---

function resetZoom() {
    isZoomed = false;
    zoomScale = 1;
    panX = 0;
    panY = 0;
    updateTransform();

    const container = document.querySelector('.pdf-viewer-container');
    container.style.cursor = 'zoom-in';

    const iconOverlay = document.getElementById('zoom-icon-overlay');
    if (iconOverlay) {
        iconOverlay.innerHTML = '<i class="fas fa-search-plus"></i>';
        iconOverlay.style.opacity = '0'; // Hide by default, show on hover via CSS
    }
}

function toggleZoom(e) {
    // Determine click position relative to the canvas to zoom towards that point
    // For simplicity in this iteration, we just toggle zoom to center or last position
    // (Advanced point-zoom requires more math specific to the transform origin)

    if (isZoomed) {
        // Zoom out
        resetZoom();
    } else {
        // Zoom in
        isZoomed = true;
        zoomScale = 2.5;
        updateTransform();

        const container = document.querySelector('.pdf-viewer-container');
        container.style.cursor = 'grab';

        const iconOverlay = document.getElementById('zoom-icon-overlay');
        if (iconOverlay) {
            iconOverlay.style.opacity = '0'; // Hide icon when zoomed
        }
    }
}

function updateTransform() {
    // Apply transform to the canvas
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    canvas.style.transition = isDragging ? 'none' : 'transform 0.3s ease'; // Disable transition during drag for performance
}

// Pan Logic (Desktop & Mobile)
function initZoomPanControls() {
    const container = document.querySelector('.pdf-viewer-container');

    if (!container) return; // Should not happen if loaded correctly

    // Click to toggle zoom
    container.addEventListener('click', (e) => {
        // Avoid triggering if dragging happened
        if (Math.abs(panX) > 5 || Math.abs(panY) > 5) return;
        if (!isDragging) {
            toggleZoom(e);
        }
    });

    // Mouse Down
    container.addEventListener('mousedown', (e) => {
        if (!isZoomed) return;
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        container.style.cursor = 'grabbing';
    });

    // Mouse Move
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !isZoomed) return;
        e.preventDefault();
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
    });

    // Mouse Up
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (isZoomed) container.style.cursor = 'grab';
        }
    });

    // Touch Events for Mobile
    container.addEventListener('touchstart', (e) => {
        if (!isZoomed) return;
        if (e.touches.length === 1) { // Single finger drag
            isDragging = true;
            startX = e.touches[0].clientX - panX;
            startY = e.touches[0].clientY - panY;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || !isZoomed) return;
        e.preventDefault(); // Prevent page scroll
        if (e.touches.length === 1) {
            panX = e.touches[0].clientX - startX;
            panY = e.touches[0].clientY - startY;
            updateTransform();
        }
    }, { passive: false });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });
}


// Event Listeners
document.getElementById('prev-page')?.addEventListener('click', (e) => { e.stopPropagation(); onPrevPage(); });
document.getElementById('next-page')?.addEventListener('click', (e) => { e.stopPropagation(); onNextPage(); });

document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('catalog-modal').classList.remove('active');
    pdfDoc = null;
});

// Handle Window Resize
window.addEventListener('resize', () => {
    if (pdfDoc) {
        updateBaseScale();
        renderPage(pageNum);
    }
});

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (!document.getElementById('catalog-modal').classList.contains('active')) return;

    if (e.key === 'ArrowLeft') onPrevPage();
    if (e.key === 'ArrowRight') onNextPage();
    if (e.key === 'Escape') document.getElementById('modal-close').click();
});

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadCatalogs();
        initZoomPanControls();
    });
} else {
    loadCatalogs();
    initZoomPanControls();
}
