// Simplified Catalog Zoom - Click to Zoom with Magnifier Cursor
let currentZoom = 1;
let isZoomed = false;

function initializeCatalogZoom() {
    const flipbook = document.getElementById('flipbook');
    const flipbookContainer = document.querySelector('.flipbook-container');

    if (!flipbook || !flipbookContainer) {
        console.log('Flipbook not found, will retry...');
        return;
    }

    // Add magnifier cursor on hover
    flipbookContainer.style.cursor = 'zoom-in';

    // Click to toggle zoom
    flipbookContainer.addEventListener('click', (e) => {
        e.stopPropagation();

        if (!isZoomed) {
            // Zoom in to 2x
            currentZoom = 2;
            flipbook.style.transform = `scale(${currentZoom})`;
            flipbook.style.transformOrigin = 'center center';
            flipbook.style.transition = 'transform 0.3s ease';
            flipbookContainer.style.cursor = 'zoom-out';
            flipbookContainer.style.overflow = 'auto';
            isZoomed = true;
            console.log('Zoomed in to 2x');
        } else {
            // Zoom out
            currentZoom = 1;
            flipbook.style.transform = 'scale(1)';
            flipbookContainer.style.cursor = 'zoom-in';
            flipbookContainer.style.overflow = 'hidden';
            isZoomed = false;
            console.log('Zoomed out to 1x');
        }
    });

    // Reset zoom when modal closes
    const modal = document.getElementById('catalog-modal');
    if (modal) {
        const observer = new MutationObserver(() => {
            if (!modal.classList.contains('active')) {
                currentZoom = 1;
                isZoomed = false;
                if (flipbook) {
                    flipbook.style.transform = 'scale(1)';
                }
                if (flipbookContainer) {
                    flipbookContainer.style.cursor = 'zoom-in';
                    flipbookContainer.style.overflow = 'hidden';
                }
            }
        });
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
}

// Initialize when modal opens
window.addEventListener('DOMContentLoaded', () => {
    initializeCatalogZoom();

    const observer = new MutationObserver(() => {
        const modal = document.getElementById('catalog-modal');
        if (modal && modal.classList.contains('active')) {
            setTimeout(initializeCatalogZoom, 300);
        }
    });

    const modal = document.getElementById('catalog-modal');
    if (modal) {
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
});
