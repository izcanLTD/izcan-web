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

        // Load messages when Messages tab is clicked
        if (item.dataset.tab === 'messages') {
            loadMessages();
        }
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
                if (type === 'catalogs') loadCatalog();
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
            const timestamp = Date.now();
            const pdfPath = `catalogs/${timestamp}_${cleanFilename}`;

            // Upload PDF
            submitBtn.textContent = 'PDF yükleniyor...';
            const { error: uploadError } = await supabase.storage.from('images').upload(pdfPath, pdfFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('images').getPublicUrl(pdfPath);

            // Get PDF page count and generate thumbnail
            submitBtn.textContent = 'PDF işleniyor...';
            const pdf = await pdfjsLib.getDocument(urlData.publicUrl).promise;
            const totalPages = pdf.numPages;

            // Generate thumbnail from first page
            submitBtn.textContent = 'Önizleme oluşturuluyor...';
            const page = await pdf.getPage(1);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 0.5 });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // Convert canvas to blob
            const thumbnailBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });

            // Upload thumbnail
            submitBtn.textContent = 'Önizleme yükleniyor...';
            const thumbnailPath = `catalogs/thumbnails/${timestamp}_${cleanFilename.replace('.pdf', '.jpg')}`;
            const { error: thumbUploadError } = await supabase.storage.from('images').upload(thumbnailPath, thumbnailBlob);
            if (thumbUploadError) throw thumbUploadError;

            const { data: thumbUrlData } = supabase.storage.from('images').getPublicUrl(thumbnailPath);

            // Insert catalog with thumbnail
            submitBtn.textContent = 'Kaydediliyor...';
            const { error: insertError } = await supabase.from('catalogs').insert({
                name: catalogName,
                pdf_url: urlData.publicUrl,
                thumbnail_url: thumbUrlData.publicUrl,
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


/* ---------------- MESSAGES LOGIC ---------------- */
let allMessages = [];
let currentFilter = 'all';

async function loadMessages() {
    const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading messages:', error);
        return;
    }

    allMessages = data || [];
    renderMessages();
}

function renderMessages() {
    const messagesList = document.getElementById('messages-list');

    const filtered = currentFilter === 'all'
        ? allMessages
        : allMessages.filter(m => m.status === currentFilter);

    if (filtered.length === 0) {
        messagesList.innerHTML = '<p class="text-muted">Henüz mesaj yok.</p>';
        return;
    }

    messagesList.innerHTML = filtered.map(msg => {
        const date = new Date(msg.created_at).toLocaleString('tr-TR');
        return `
            <div class="message-card ${msg.status === 'unread' ? 'unread' : ''}" data-id="${msg.id}">
                <div class="message-header">
                    <div class="message-info">
                        <h3>${msg.name}</h3>
                        <div class="message-meta">
                            <span><i class="fa-solid fa-envelope"></i> ${msg.email}</span>
                            ${msg.phone ? `<span><i class="fa-solid fa-phone"></i> ${msg.phone}</span>` : ''}
                            <span><i class="fa-solid fa-clock"></i> ${date}</span>
                        </div>
                    </div>
                    <div class="message-actions">
                        <span class="status-badge ${msg.status}">${getStatusText(msg.status)}</span>
                        ${msg.status === 'unread' ?
                `<button onclick="toggleReadStatus('${msg.id}', 'read')"><i class="fa-solid fa-check"></i> Okundu</button>` :
                `<button onclick="toggleReadStatus('${msg.id}', 'unread')"><i class="fa-solid fa-envelope"></i> Okunmadı</button>`
            }
                        <button onclick="openReplyModal('${msg.id}')"><i class="fa-solid fa-reply"></i> Yanıtla</button>
                        <button onclick="deleteMessage('${msg.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="message-body">${msg.message}</div>
            </div>
        `;
    }).join('');
}

function getStatusText(status) {
    const statusMap = {
        'unread': 'Okunmadı',
        'read': 'Okundu',
        'replied': 'Cevaplandı'
    };
    return statusMap[status] || status;
}

window.toggleReadStatus = async function (messageId, newStatus) {
    const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

    if (error) {
        alert('Hata: ' + error.message);
        return;
    }

    await loadMessages();
};

window.openReplyModal = function (messageId) {
    const message = allMessages.find(m => m.id === messageId);
    if (!message) return;

    document.getElementById('reply-message-id').value = message.id;
    document.getElementById('reply-to-name').value = message.name;
    document.getElementById('reply-to-email').value = message.email;
    document.getElementById('reply-original-message').value = message.message;
    document.getElementById('reply-text').value = '';

    document.getElementById('reply-modal').classList.add('show');
};

window.deleteMessage = async function (messageId) {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

    if (error) {
        alert('Hata: ' + error.message);
        return;
    }

    await loadMessages();
};

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderMessages();
    });
});

// Reply form
const replyForm = document.getElementById('reply-form');
if (replyForm) {
    replyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = replyForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gönderiliyor...';

        try {
            const messageId = document.getElementById('reply-message-id').value;
            const message = allMessages.find(m => m.id === messageId);
            const replyText = document.getElementById('reply-text').value;

            // Send email via Cloudflare Worker
            const emailResponse = await fetch('/api/send-contact-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: message.name,
                    email: message.email,
                    phone: message.phone,
                    message: message.message,
                    replyText: replyText
                })
            });

            if (!emailResponse.ok) {
                throw new Error('Email gönderilemedi');
            }

            // Update message status
            const { error } = await supabase
                .from('contact_messages')
                .update({
                    status: 'replied',
                    replied_at: new Date().toISOString()
                })
                .eq('id', messageId);

            if (error) throw error;

            alert('Yanıt başarıyla gönderildi!');
            document.getElementById('reply-modal').classList.remove('show');
            await loadMessages();
        } catch (error) {
            console.error('Reply error:', error);
            alert('Hata: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gönder';
        }
    });
}
