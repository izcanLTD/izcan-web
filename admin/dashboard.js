import { supabase } from '../src/supabase.js';

// Auth Check
const { data: { user } } = await supabase.auth.getUser();
if (!user) window.location.href = './index.html';

document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = './index.html';
});

/* --- Navigation --- */
const navItems = document.querySelectorAll('.nav-item[data-tab]');
const sections = document.querySelectorAll('.content-section');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(item.dataset.tab).classList.add('active');
    });
});

/* --- Generic Modal Logic --- */
function setupModal(modalId, openBtnId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = modal.querySelector('.close-modal');

    if (openBtn) openBtn.addEventListener('click', () => {
        if (modalId === 'slider-modal') resetSliderForm();
        if (modalId === 'gallery-modal') resetGalleryForm();
        modal.classList.add('show');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
    return modal;
}

const prodModal = setupModal('product-modal', 'open-add-modal');
const sliderModal = setupModal('slider-modal', 'open-slider-modal');
const galleryModal = setupModal('gallery-modal', 'open-gallery-modal');
const catalogModal = setupModal('catalog-modal', 'open-catalog-modal');

/* ---------------- SLIDER LOGIC ---------------- */
const sliderList = document.getElementById('slider-list-admin');
const addSliderForm = document.getElementById('add-slider-form');
const sliderTypeSelect = document.getElementById('slider-type');
const groupImage = document.getElementById('group-image');
const groupVideo = document.getElementById('group-video');

if (sliderTypeSelect) {
    sliderTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'video') {
            groupImage.classList.add('hidden');
            groupVideo.classList.remove('hidden');
        } else {
            groupImage.classList.remove('hidden');
            groupVideo.classList.add('hidden');
        }
    });
}

function resetSliderForm() {
    addSliderForm.reset();
    document.getElementById('slider-id').value = '';
    document.getElementById('slider-modal-title').textContent = 'Yeni Slayt Ekle';
    document.getElementById('current-image-text').textContent = '';
    document.getElementById('current-video-text').textContent = '';
    groupImage.classList.remove('hidden');
    groupVideo.classList.add('hidden');
}

async function loadSlider() {
    if (!sliderList) return;
    sliderList.innerHTML = '<div class="loading-spinner"></div>';

    const { data, error } = await supabase.from('slides').select('*').order('display_order', { ascending: true });

    if (error) { console.error(error); return; }

    sliderList.innerHTML = '';
    data.forEach(slide => {
        const div = document.createElement('div');
        div.className = 'product-card';

        let thumbnail = slide.image_url;
        if (slide.media_type === 'video') {
            thumbnail = 'https://via.placeholder.com/300x200?text=VIDEO';
        }

        div.innerHTML = `
            <div class="card-actions" style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                <button class="edit-btn user-select-none" data-id="${slide.id}" data-type="slides"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn user-select-none" data-id="${slide.id}" data-type="slides"><i class="fa-solid fa-trash"></i></button>
            </div>
            <img src="${thumbnail}" alt="${slide.title}">
            <div class="card-details">
                <h3>${slide.title || 'Başlıksız'}</h3>
                <p>Tip: ${slide.media_type || 'image'} | Sıra: ${slide.display_order}</p>
            </div>
        `;
        sliderList.appendChild(div);
    });
}

// Edit Slide
async function openEditSlide(id) {
    const { data, error } = await supabase.from('slides').select('*').eq('id', id).single();
    if (error) { alert('Hata: ' + error.message); return; }

    document.getElementById('slider-id').value = data.id;
    document.getElementById('slider-title').value = data.title || '';
    document.getElementById('slider-subtitle').value = data.subtitle || '';
    document.getElementById('slider-order').value = data.display_order || 0;
    document.getElementById('slider-modal-title').textContent = 'Slayt Düzenle';

    sliderTypeSelect.value = data.media_type || 'image';
    sliderTypeSelect.dispatchEvent(new Event('change'));

    if (data.media_type === 'image') {
        document.getElementById('current-image-text').textContent = 'Mevcut: ' + data.image_url?.split('/').pop();
    } else {
        document.getElementById('current-image-text').textContent = '';
        if (data.video_url) {
            document.getElementById('current-video-text').textContent = 'Mevcut Video: ' + data.video_url.split('/').pop();
        }
    }
    sliderModal.classList.add('show');
}

if (addSliderForm) {
    addSliderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = addSliderForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';

        try {
            const id = document.getElementById('slider-id').value;
            const type = sliderTypeSelect.value;
            const title = document.getElementById('slider-title').value;
            const subtitle = document.getElementById('slider-subtitle').value;
            const order = document.getElementById('slider-order').value;
            const imageFile = document.getElementById('slider-image').files[0];
            const videoFile = document.getElementById('slider-video').files[0];

            let updates = { title, subtitle, display_order: order, media_type: type };

            if (type === 'image' && imageFile) {
                const path = `${Date.now()}_${imageFile.name}`;
                const { error } = await supabase.storage.from('images').upload(path, imageFile);
                if (error) throw error;
                const { data } = supabase.storage.from('images').getPublicUrl(path);
                updates.image_url = data.publicUrl;
                updates.video_url = null;
            }

            if (type === 'video' && videoFile) {
                if (videoFile.size > 50 * 1024 * 1024) throw new Error('Video 50MB\'dan küçük olmalıdır.');
                const path = `videos/${Date.now()}_${videoFile.name}`;
                const { error } = await supabase.storage.from('images').upload(path, videoFile);
                if (error) throw error;
                const { data } = supabase.storage.from('images').getPublicUrl(path);
                updates.video_url = data.publicUrl;
            }

            if (type === 'video' && !updates.image_url && !id) {
                updates.image_url = 'https://placehold.co/1920x1080/000000/FFFFFF?text=Video';
            }

            if (id) {
                const { error } = await supabase.from('slides').update(updates).eq('id', id);
                if (error) throw error;
                alert('Güncellendi!');
            } else {
                if (type === 'image' && !updates.image_url) throw new Error('Resim seçmelisiniz.');
                if (type === 'video' && !updates.video_url) throw new Error('Video seçmelisiniz.');
                const { error } = await supabase.from('slides').insert([updates]);
                if (error) throw error;
                alert('Eklendi!');
            }

            resetSliderForm();
            sliderModal.classList.remove('show');
            loadSlider();
        } catch (err) { alert('Hata: ' + err.message); }
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Kaydet'; }
    });
}

/* ---------------- GALLERY LOGIC ---------------- */
const galleryList = document.getElementById('gallery-list-admin');
const addGalleryForm = document.getElementById('add-gallery-form');
const galleryTypeSelect = document.getElementById('gallery-type');
const galleryGroupImage = document.getElementById('gallery-group-image');
const galleryGroupVideo = document.getElementById('gallery-group-video');

if (galleryTypeSelect) {
    galleryTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'video') {
            galleryGroupImage.classList.add('hidden');
            galleryGroupVideo.classList.remove('hidden');
        } else {
            galleryGroupImage.classList.remove('hidden');
            galleryGroupVideo.classList.add('hidden');
        }
    });
}

function resetGalleryForm() {
    addGalleryForm.reset();
    document.getElementById('gallery-id').value = '';
    document.getElementById('gallery-modal-title').textContent = 'Galeriye Ekle';
    galleryGroupImage.classList.remove('hidden');
    galleryGroupVideo.classList.add('hidden');
}

async function loadGallery() {
    if (!galleryList) return;
    galleryList.innerHTML = '<div class="loading-spinner"></div>';

    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    galleryList.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'product-card';

        // Render content
        let contentHtml = '';
        if (item.media_type === 'video') {
            // For Admin preview, maybe just a video tag or placeholder
            contentHtml = `<video src="${item.video_url}" muted style="width:100%;height:100%;object-fit:cover;"></video>`;
        } else {
            contentHtml = `<img src="${item.image_url}" alt="Gallery">`;
        }

        div.innerHTML = `
            <div class="card-actions" style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; z-index:10;">
                <button class="delete-btn" data-id="${item.id}" data-type="gallery"><i class="fa-solid fa-trash"></i></button>
            </div>
            ${contentHtml}
             <div class="card-details">
                <p>Tip: ${item.media_type || 'image'}</p>
                <p>${item.caption || ''}</p>
            </div>
        `;
        galleryList.appendChild(div);
    });
}

if (addGalleryForm) {
    addGalleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = addGalleryForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';

        try {
            const id = document.getElementById('gallery-id').value;
            const type = galleryTypeSelect.value;
            const caption = document.getElementById('gallery-caption').value;
            const imageFile = document.getElementById('gallery-image').files[0];
            const videoFile = document.getElementById('gallery-video').files[0];

            let updates = { caption, media_type: type };

            if (type === 'image' && imageFile) {
                const path = `gallery/${Date.now()}_${imageFile.name}`;
                const { error } = await supabase.storage.from('images').upload(path, imageFile);
                if (error) throw error;
                const { data } = supabase.storage.from('images').getPublicUrl(path);
                updates.image_url = data.publicUrl;
                updates.video_url = null;
            }

            if (type === 'video' && videoFile) {
                if (videoFile.size > 50 * 1024 * 1024) throw new Error('Video 50MB\'dan küçük olmalıdır.');
                const path = `gallery_videos/${Date.now()}_${videoFile.name}`;
                const { error } = await supabase.storage.from('images').upload(path, videoFile);
                if (error) throw error;
                const { data } = supabase.storage.from('images').getPublicUrl(path);
                updates.video_url = data.publicUrl;
            }

            if (type === 'video' && !updates.image_url && !id) {
                updates.image_url = 'https://placehold.co/600x600/000000/FFFFFF?text=Video';
            }

            // Insert Only (Edit for gallery usually just caption, but we keep simple)
            if (type === 'image' && !updates.image_url) throw new Error('Resim seçmelisiniz.');
            if (type === 'video' && !updates.video_url) throw new Error('Video seçmelisiniz.');

            const { error } = await supabase.from('gallery').insert([updates]);
            if (error) throw error;
            alert('Eklendi!');

            resetGalleryForm();
            galleryModal.classList.remove('show');
            loadGallery();
        } catch (err) { alert('Hata: ' + err.message); }
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Kaydet'; }
    });
}

/* ---------------- GLOBAL EVENTS ---------------- */
document.addEventListener('click', async (e) => {
    // Edit
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
        const type = editBtn.dataset.type;
        const id = editBtn.dataset.id;
        if (type === 'slides') openEditSlide(id);
    }

    // Delete
    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
        const id = delBtn.dataset.id;
        const type = delBtn.dataset.type;
        if (confirm('Silmek istediğinize emin misiniz?')) {
            const { error } = await supabase.from(type).delete().eq('id', id);
            if (!error) {
                if (type === 'products') loadProducts();
                if (type === 'slides') loadSlider();
                if (type === 'gallery') loadGallery();
                if (type === 'catalog_pages') loadCatalog();
            } else { alert('Hata: ' + error.message); }
        }
    }
});

/* --- PRODUCT LOGIC --- */
const addProductForm = document.getElementById('add-product-form');
if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = addProductForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';

        try {
            const title = document.getElementById('prod-title').value;
            const category = document.getElementById('prod-category').value;
            const description = document.getElementById('prod-desc').value;
            const imageFile = document.getElementById('prod-image').files[0];

            if (!imageFile) {
                alert('Lütfen bir görsel seçin!');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Kaydet';
                return;
            }

            // Upload image to Supabase Storage
            const path = `products/${Date.now()}_${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(path, imageFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

            // Insert product to database
            const { error: insertError } = await supabase.from('products').insert({
                title,
                category,
                description,
                image_url: urlData.publicUrl
            });

            if (insertError) throw insertError;

            alert('Ürün başarıyla eklendi!');
            prodModal.classList.remove('show');
            addProductForm.reset();
            loadProducts();
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kaydet';
        }
    });
}

/* --- Initialize Other Sections --- */
async function loadProducts() {
    const productList = document.getElementById('product-list-admin');
    if (!productList) return;
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    productList.innerHTML = '';
    data?.forEach(prod => {
        productList.innerHTML += `
            <div class="product-card">
                 <button class="delete-btn" data-id="${prod.id}" data-type="products"><i class="fa-solid fa-trash"></i></button>
                 <img src="${prod.image_url}" alt="${prod.title}">
                 <div class="card-details"><h3>${prod.title}</h3></div>
            </div>`;
    });
}

/* --- CATALOG LOGIC --- */
const catalogList = document.getElementById('catalog-list-admin');
const addCatalogForm = document.getElementById('add-catalog-form');

async function loadCatalog() {
    if (!catalogList) return;
    const { data } = await supabase.from('catalog_pages').select('*').order('page_number', { ascending: true });
    catalogList.innerHTML = '';
    data?.forEach(page => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <button class="delete-btn" data-id="${page.id}" data-type="catalog_pages"><i class="fa-solid fa-trash"></i></button>
            <img src="${page.image_url}" alt="Sayfa ${page.page_number}">
            <div class="card-details"><h3>Sayfa ${page.page_number}</h3></div>
        `;
        catalogList.appendChild(div);
    });
}

if (addCatalogForm) {
    addCatalogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = addCatalogForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';

        try {
            const pageNumber = document.getElementById('catalog-page-number').value;
            const imageFile = document.getElementById('catalog-image').files[0];

            if (!imageFile) {
                alert('Lütfen bir görsel seçin!');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Kaydet';
                return;
            }

            // Upload image
            const path = `catalog/${Date.now()}_${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(path, imageFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

            // Insert catalog page
            const { error: insertError } = await supabase.from('catalog_pages').insert({
                page_number: parseInt(pageNumber),
                image_url: urlData.publicUrl
            });

            if (insertError) throw insertError;

            alert('Katalog sayfası eklendi!');
            catalogModal.classList.remove('show');
            addCatalogForm.reset();
            loadCatalog();
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kaydet';
        }
    });
}

/* --- Content Logic --- */
const contentForm = document.getElementById('content-form');
if (contentForm) {
    document.getElementById('save-content-btn').addEventListener('click', async () => {
        const formData = new FormData(contentForm);
        const updates = [];
        for (let [key, value] of formData.entries()) {
            updates.push({ key, value, section: key.split('_')[0] });
        }
        await supabase.from('site_content').upsert(updates);
        alert('Kaydedildi!');
    });
    const { data } = await supabase.from('site_content').select('*');
    data?.forEach(item => {
        const el = document.getElementsByName(item.key)[0];
        if (el) el.value = item.value;
    });
}

// Init
loadProducts();
loadSlider();
loadGallery();
loadCatalog();
