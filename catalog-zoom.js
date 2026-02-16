// Catalog Zoom Functionality
let currentZoom = 1;
const ZOOM_STEP = 0.25;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

let isPanning = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;

function initializeZoomControls() {
    const flipbook = document.getElementById('flipbook');
    const flipbookContainer = document.querySelector('.flipbook-container');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const zoomLevel = document.getElementById('zoom-level');

    if (!flipbook || !zoomInBtn) {
        console.log('Zoom controls not found, will retry...');
        return;
    }

    // Zoom In
    zoomInBtn.addEventListener('click', () => {
        if (currentZoom < MAX_ZOOM) {
            currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
            applyZoom();
        }
    });

    // Zoom Out
    zoomOutBtn.addEventListener('click', () => {
        if (currentZoom > MIN_ZOOM) {
            currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
            applyZoom();
        }
    });

    // Reset Zoom
    zoomResetBtn.addEventListener('click', () => {
        currentZoom = 1;
        translateX = 0;
        translateY = 0;
        applyZoom();
    });

    // Mouse wheel zoom
    flipbookContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            // Zoom in
            if (currentZoom < MAX_ZOOM) {
                currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
                applyZoom();
            }
        } else {
            // Zoom out
            if (currentZoom > MIN_ZOOM) {
                currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
                applyZoom();
            }
        }
    });

    // Pan functionality when zoomed
    flipbookContainer.addEventListener('mousedown', (e) => {
        if (currentZoom > 1) {
            isPanning = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            flipbookContainer.classList.add('grabbing');
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            applyZoom();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            flipbookContainer.classList.remove('grabbing');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('catalog-modal');
        if (!modal || !modal.classList.contains('active')) return;

        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            if (currentZoom < MAX_ZOOM) {
                currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
                applyZoom();
            }
        } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            if (currentZoom > MIN_ZOOM) {
                currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
                applyZoom();
            }
        } else if (e.key === '0') {
            e.preventDefault();
            currentZoom = 1;
            translateX = 0;
            translateY = 0;
            applyZoom();
        }
    });

    function applyZoom() {
        flipbook.style.transform = `scale(${currentZoom}) translate(${translateX / currentZoom}px, ${translateY / currentZoom}px)`;
        zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;

        // Update button states
        zoomInBtn.disabled = currentZoom >= MAX_ZOOM;
        zoomOutBtn.disabled = currentZoom <= MIN_ZOOM;

        // Update container class
        if (currentZoom > 1) {
            flipbookContainer.classList.add('zoomed');
        } else {
            flipbookContainer.classList.remove('zoomed');
            translateX = 0;
            translateY = 0;
        }
    }
}

// Initialize when modal opens
window.addEventListener('DOMContentLoaded', () => {
    // Try to initialize immediately
    initializeZoomControls();

    // Also initialize when catalog modal becomes active
    const observer = new MutationObserver(() => {
        const modal = document.getElementById('catalog-modal');
        if (modal && modal.classList.contains('active')) {
            setTimeout(initializeZoomControls, 200);
        }
    });

    const modal = document.getElementById('catalog-modal');
    if (modal) {
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
});
