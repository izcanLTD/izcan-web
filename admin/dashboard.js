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

// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

/* --- Products Logic --- */
const productList = document.getElementById('product-list-admin');
const addProductForm = document.getElementById('add-product-form');

async function loadProducts() {
    productList.innerHTML = '<p class="text-center">Yükleniyor...</p>';
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
        div.className = 'admin-prod-card';
        div.innerHTML = `
            <img src="${prod.image_url}" alt="${prod.title}">
            <h4>${prod.title}</h4>
            <p class="text-muted text-sm">${prod.category}</p>
            <button class="admin-prod-delete" data-id="${prod.id}">X</button>
        `;
        productList.appendChild(div);
    });

    // Delete Event Listeners
    document.querySelectorAll('.admin-prod-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                const id = e.target.dataset.id;
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
        // 1. Upload Image
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        // 3. Insert into DB
        const { error: insertError } = await supabase
            .from('products')
            .insert([{
                title,
                category,
                description: desc,
                image_url: publicUrl
            }]);

        if (insertError) throw insertError;

        alert('Ürün başarıyla eklendi!');
        addProductForm.reset();
        loadProducts();

    } catch (err) {
        alert('Hata: ' + err.message);
    } finally {
        submitBtn.textContent = 'Ürünü Ekle';
        submitBtn.disabled = false;
    }
});

/* --- Content Logic --- */
const contentForm = document.getElementById('content-form');

async function loadContent() {
    const { data, error } = await supabase.from('site_content').select('*');
    if (!error && data) {
        data.forEach(item => {
            const el = document.getElementsByName(item.key)[0];
            if (el) el.value = item.value;
        });
    }
}

contentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contentForm);
    const updates = [];

    for (let [key, value] of formData.entries()) {
        updates.push({
            key: key,
            value: value,
            section: key.split('_')[0] // 'hero', 'about' etc
        });
    }

    const { error } = await supabase.from('site_content').upsert(updates);

    if (error) alert('Hata: ' + error.message);
    else alert('Değişiklikler kaydedildi!');
});

// Init
loadProducts();
loadContent();
