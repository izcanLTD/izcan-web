// Catalog Zoom - Click to Zoom with Magnifier Cursor
let currentZoom = 1;
let isZoomed = false;

function initializeCatalogZoom() {
    const flipbook = document.getElementById('flipbook');
    const flipbookContainer = document.querySelector('.flipbook-container');

    if (!flipbook || !flipbookContainer) {
        console.log('Flipbook not found, will retry...');
        setTimeout(initializeCatalogZoom, 500);
        return;
    }

    console.log('Catalog zoom initialized');

    // Add magnifier cursor on hover
    flipbookContainer.style.cursor = 'zoom-in';

    // Click to toggle zoom - use normal event listener, not capture
    flipbookContainer.addEventListener('click', function (e) {
        // Only zoom if clicking on the container or pages, not on turn.js controls
        if (e.target.closest('.catalog-controls')) {
            return;
        }

        if (!isZoomed) {
            // Zoom in to 2x
            currentZoom = 2;
            flipbook.style.transform = `scale(${currentZoom})`;
            flipbook.style.transformOrigin = 'center center';
            flipbook.style.transition = 'transform 0.3s ease';
            flipbookContainer.style.cursor = 'zoom-out';
            flipbookContainer.style.overflow = 'auto';
            isZoomed = true;
            console.log('Zoomed in');
        } else {
            // Zoom out
            currentZoom = 1;
            flipbook.style.transform = 'scale(1)';
            flipbookContainer.style.cursor = 'zoom-in';
            flipbookContainer.style.overflow = 'hidden';
            isZoomed = false;
            console.log('Zoomed out');
        }
    });

    // Reset zoom when modal closes
    const modal = document.getElementById('catalog-modal');
    if (modal) {
        const observer = new MutationObserver(() => {
            if (!modal.classList.contains('active') && isZoomed) {
                currentZoom = 1;
                flipbook.style.transform = 'scale(1)';
                flipbookContainer.style.cursor = 'zoom-in';
                flipbookContainer.style.overflow = 'hidden';
                isZoomed = false;
                console.log('Zoom reset on modal close');
            }
        });

        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCatalogZoom);
} else {
    initializeCatalogZoom();
}
