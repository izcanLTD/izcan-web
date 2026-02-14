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

/* --- Modal Logic --- */
const modal = document.getElementById('product-modal');
const openModalBtn = document.getElementById('open-add-modal');
const closeModalBtn = document.querySelector('.close-modal');

if (openModalBtn) openModalBtn.addEventListener('click', () => modal.classList.add('show'));
if (closeModalBtn) closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

/* --- Products Logic --- */
const productList = document.getElementById('product-list-admin');
const addProductForm = document.getElementById('add-product-form');

async function loadProducts() {
    if (!productList) return;
    productList.innerHTML = '<div class="loading-spinner"></div>';

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    productList.innerHTML = '';
    data.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <button class="delete-btn" data-id="${prod.id}"><i class="fa-solid fa-trash"></i></button>
            <img src="${prod.image_url}" alt="${prod.title}">
            <div class="card-details">
                <h3>${prod.title}</h3>
                <p>${prod.category}</p>
            </div>
        `;
        productList.appendChild(div);
    });

    // Delete Event Listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent card click
            if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                const id = e.target.closest('.delete-btn').dataset.id;
                await deleteProduct(id);
            }
        });
    });
}

async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) loadProducts();
    else alert('Silme başarısız: ' + error.message);
}

if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('prod-title').value;
        const category = document.getElementById('prod-category').value;
        const desc = document.getElementById('prod-desc').value;
        const file = document.getElementById('prod-image').files[0];
        const submitBtn = addProductForm.querySelector('button');

        if (!file) {
            alert('Lütfen bir görsel seçin.');
            return;
        }

        submitBtn.textContent = 'Yükleniyor...';
        submitBtn.disabled = true;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);

            const { error: insertError } = await supabase.from('products').insert([{
                title, category, description: desc, image_url: publicUrl
            }]);

            if (insertError) throw insertError;

            alert('Ürün eklendi!');
            addProductForm.reset();
            modal.classList.remove('show');
            loadProducts();

        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            submitBtn.textContent = 'Kaydet';
            submitBtn.disabled = false;
        }
    });
}

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
            updates.push({
                key: key,
                value: value,
                section: key.split('_')[0]
            });
        }

        const { error } = await supabase.from('site_content').upsert(updates);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            // Optional: Success notification
            setTimeout(() => alert('Değişiklikler başarıyla kaydedildi!'), 100);
        }

        saveContentBtn.disabled = false;
        saveContentBtn.innerHTML = '<i class="fa-solid fa-save"></i> Değişiklikleri Kaydet';
    });
}

// Init
loadProducts();
loadContent();
