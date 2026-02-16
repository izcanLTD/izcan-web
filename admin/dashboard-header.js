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
const replyModal = setupModal('reply-modal', null); // No open button, opened programmatically
