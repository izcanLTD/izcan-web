import { supabase } from '../src/supabase.js';

// Auth Check
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
    window.location.href = './index.html';
}

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

    if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('show'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
    return modal;
}

const prodModal = setupModal('product-modal', 'open-add-modal');
const sliderModal = setupModal('slider-modal', 'open-slider-modal');
const galleryModal = setupModal('gallery-modal', 'open-gallery-modal');

/* --- Products Logic --- */
const productList = document.getElementById('product-list-admin');
const addProductForm = document.getElementById('add-product-form');

async function loadProducts() {
    if (!productList) return;
    productList.innerHTML = '<div class="loading-spinner"></div>';

    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    productList.innerHTML = '';
    data.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <button class="delete-btn" data-id="${prod.id}" data-type="products"><i class="fa-solid fa-trash"></i></button>
            <img src="${prod.image_url}" alt="${prod.title}">
            <div class="card-details">
                <h3>${prod.title}</h3>
                <p>${prod.category}</p>
            </div>
        `;
        productList.appendChild(div);
    });
}

if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleGenericSubmit(e, 'products', prodModal, loadProducts, {
            title: document.getElementById('prod-title').value,
            category: document.getElementById('prod-category').value,
            description: document.getElementById('prod-desc').value,
        }, 'prod-image');
    });
}

/* --- Slider Logic --- */
const sliderList = document.getElementById('slider-list-admin');
const addSliderForm = document.getElementById('add-slider-form');

async function loadSlider() {
    if (!sliderList) return;
    sliderList.innerHTML = '<div class="loading-spinner"></div>';

    const { data, error } = await supabase.from('slides').select('*').order('display_order', { ascending: true });

    if (error) { console.error(error); return; }

    sliderList.innerHTML = '';
    data.forEach(slide => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <button class="delete-btn" data-id="${slide.id}" data-type="slides"><i class="fa-solid fa-trash"></i></button>
            <img src="${slide.image_url}" alt="${slide.title}">
            <div class="card-details">
                <h3>${slide.title || 'Başlıksız'}</h3>
                <p>Sıra: ${slide.display_order}</p>
            </div>
        `;
        sliderList.appendChild(div);
    });
}

if (addSliderForm) {
    addSliderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleGenericSubmit(e, 'slides', sliderModal, loadSlider, {
            title: document.getElementById('slider-title').value,
            subtitle: document.getElementById('slider-subtitle').value,
            display_order: document.getElementById('slider-order').value,
        }, 'slider-image');
    });
}

/* --- Gallery Logic --- */
const galleryList = document.getElementById('gallery-list-admin');
const addGalleryForm = document.getElementById('add-gallery-form');

async function loadGallery() {
    if (!galleryList) return;
    galleryList.innerHTML = '<div class="loading-spinner"></div>';

    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    galleryList.innerHTML = '';
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <button class="delete-btn" data-id="${item.id}" data-type="gallery"><i class="fa-solid fa-trash"></i></button>
            <img src="${item.image_url}" alt="Gallery">
             <div class="card-details">
                <p>${item.caption || ''}</p>
            </div>
        `;
        galleryList.appendChild(div);
    });
}

if (addGalleryForm) {
    addGalleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleGenericSubmit(e, 'gallery', galleryModal, loadGallery, {
            caption: document.getElementById('gallery-caption').value,
        }, 'gallery-image');
    });
}

/* --- Shared Helpers --- */
async function handleGenericSubmit(e, table, modalRef, refreshFn, extraData, fileInputId) {
    const file = document.getElementById(fileInputId).files[0];
    const submitBtn = e.target.querySelector('button');

    if (!file) { alert('Görsel seçmelisiniz.'); return; }

    submitBtn.textContent = 'Yükleniyor...';
    submitBtn.disabled = true;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);

        const { error: insertError } = await supabase.from(table).insert([{
            ...extraData,
            image_url: publicUrl
        }]);

        if (insertError) throw insertError;

        alert('Başarıyla eklendi!');
        e.target.reset();
        modalRef.classList.remove('show');
        refreshFn();

    } catch (err) {
        alert('Hata: ' + err.message);
    } finally {
        submitBtn.textContent = 'Kaydet';
        submitBtn.disabled = false;
    }
}

// Global Delete Handler
document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.delete-btn');
        const id = btn.dataset.id;
        const type = btn.dataset.type; // products, slides, gallery

        if (confirm('Silmek istediğinize emin misiniz?')) {
            const { error } = await supabase.from(type).delete().eq('id', id);
            if (!error) {
                if (type === 'products') loadProducts();
                if (type === 'slides') loadSlider();
                if (type === 'gallery') loadGallery();
            } else {
                alert('Silme hatası: ' + error.message);
            }
        }
    }
});

/* --- Content Logic --- */
const contentForm = document.getElementById('content-form');
const saveContentBtn = document.getElementById('save-content-btn');

async function loadContent() {
    const { data, error } = await supabase.from('site_content').select('*');
    if (!error && data) {
        data.forEach(item => {
            const el = document.getElementsByName(item.key)[0];
            if (el) el.value = item.value;
        });
    }
}

if (saveContentBtn && contentForm) {
    saveContentBtn.addEventListener('click', async () => {
        saveContentBtn.disabled = true;
        saveContentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

        const formData = new FormData(contentForm);
        const updates = [];

        for (let [key, value] of formData.entries()) {
            updates.push({ key, value, section: key.split('_')[0] });
        }

        const { error } = await supabase.from('site_content').upsert(updates);
        if (error) alert('Hata: ' + error.message);
        else setTimeout(() => alert('Kaydedildi!'), 100);

        saveContentBtn.disabled = false;
        saveContentBtn.innerHTML = '<i class="fa-solid fa-save"></i> Değişiklikleri Kaydet';
    });
}

// Init
loadProducts();
loadSlider();
loadGallery();
loadContent();
