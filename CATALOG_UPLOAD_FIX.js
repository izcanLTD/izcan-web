/* --- CATALOG LOGIC --- */
const catalogList = document.getElementById('catalog-list-admin');
const addCatalogForm = document.getElementById('add-catalog-form');

async function loadCatalog() {
    if (!catalogList) return;
    const { data } = await supabase.from('catalogs').select('*').order('created_at', { ascending: false });
    catalogList.innerHTML = '';
    data?.forEach(catalog => {
        const div = document.createElement('div');
        div.className = 'product-card';

        div.innerHTML = `
            <button class="delete-btn" data-id="${catalog.id}" data-type="catalogs"><i class="fa-solid fa-trash"></i></button>
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); height: 200px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <i class="fa-solid fa-file-pdf" style="font-size: 4rem; color: #c9a961;"></i>
            </div>
            <div class="card-details">
                <h3>${catalog.name}</h3>
                <p>${catalog.total_pages || 0} sayfa</p>
            </div>
        `;
        catalogList.appendChild(div);
    });
}

if (addCatalogForm) {
    addCatalogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = addCatalogForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Yükleniyor ve işleniyor...';

        try {
            const catalogNameInput = document.getElementById('catalog-name');
            const pdfFileInput = document.getElementById('catalog-pdf');

            if (!catalogNameInput || !pdfFileInput) {
                throw new Error('Form alanları bulunamadı');
            }

            const catalogName = catalogNameInput.value;
            const pdfFile = pdfFileInput.files[0];

            if (!pdfFile || !pdfFile.type.includes('pdf')) {
                alert('Lütfen bir PDF dosyası seçin!');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Yükle ve İşle';
                return;
            }

            // Sanitize filename
            const sanitizeFilename = (filename) => {
                const ext = filename.substring(filename.lastIndexOf('.'));
                const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));

                const sanitized = nameWithoutExt
                    .toLowerCase()
                    .replace(/ğ/g, 'g')
                    .replace(/ü/g, 'u')
                    .replace(/ş/g, 's')
                    .replace(/ı/g, 'i')
                    .replace(/ö/g, 'o')
                    .replace(/ç/g, 'c')
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');

                return sanitized + ext.toLowerCase();
            };

            const cleanFilename = sanitizeFilename(pdfFile.name);
            const path = `catalogs/${Date.now()}_${cleanFilename}`;

            // Upload PDF
            const { error: uploadError } = await supabase.storage.from('images').upload(path, pdfFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

            // Get PDF page count using PDF.js
            const pdf = await pdfjsLib.getDocument(urlData.publicUrl).promise;
            const totalPages = pdf.numPages;

            // Insert catalog
            const { error: insertError } = await supabase.from('catalogs').insert({
                name: catalogName,
                pdf_url: urlData.publicUrl,
                total_pages: totalPages
            });

            if (insertError) throw insertError;

            alert(`Katalog başarıyla yüklendi! (${totalPages} sayfa)`);
            catalogModal.classList.remove('show');
            addCatalogForm.reset();
            loadCatalog();
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Yükle ve İşle';
        }
    });
}
