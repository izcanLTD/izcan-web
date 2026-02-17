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
let scale = 1.5; // Initial scale, will be adjusted responsively
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

async function openCatalogViewer(url, title) {
    const modal = document.getElementById('catalog-modal');
    const modalTitle = document.getElementById('modal-title');
    const loadingMsg = document.getElementById('loading-msg');

    if (!modal || !canvas) return;

    modalTitle.textContent = title;
    modal.classList.add('active');

    // Reset state
    pdfDoc = null;
    pageNum = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    loadingMsg.style.display = 'block';
    canvas.style.display = 'none';

    // Ensure responsive scale based on screen width
    updateScale();

    try {
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;

        document.getElementById('page-indicator').textContent = `Sayfa ${pageNum} / ${pdfDoc.numPages}`;
        loadingMsg.style.display = 'none';
        canvas.style.display = 'block';

        renderPage(pageNum);
        updateButtons();
    } catch (error) {
        console.error('Error loading PDF:', error);
        loadingMsg.textContent = 'Katalog yüklenirken hata oluştu.';
    }
}

function updateScale() {
    if (window.innerWidth < 768) {
        scale = 0.6; // Smaller scale for mobile
    } else if (window.innerWidth < 1200) {
        scale = 1.0; // Medium scale for tablets/laptops
    } else {
        scale = 1.5; // Full scale for desktops
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

// Event Listeners
document.getElementById('prev-page')?.addEventListener('click', onPrevPage);
document.getElementById('next-page')?.addEventListener('click', onNextPage);

document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('catalog-modal').classList.remove('active');
    pdfDoc = null;
});

// Handle Window Resize
window.addEventListener('resize', () => {
    if (pdfDoc) {
        updateScale();
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
    document.addEventListener('DOMContentLoaded', loadCatalogs);
} else {
    loadCatalogs();
}
