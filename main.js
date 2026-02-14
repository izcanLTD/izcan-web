import './style.css'
import { supabase } from './src/supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    setupMobileMenu();
    setupHeaderScroll();

    // 1. Load Texts
    await loadContent();

    // 2. Load Dynamic Components
    await loadSlider();
    await loadProducts();
    await loadGallery();

    setupIntersectionObserver();
});

/* --- TEXT CONTENT --- */
async function loadContent() {
    const { data, error } = await supabase.from('site_content').select('*');
    if (!error && data) {
        const keyMap = {
            'hero_title_1': 'hero-title',
            'hero_subtitle_1': 'hero-subtitle',
            'about_title': 'about-title',
            'about_text': 'about-text',
            'contact_address': 'contact-address',
            'contact_phone': 'contact-phone',
            'contact_email': 'contact-email'
        };

        data.forEach(item => {
            const elementId = keyMap[item.key];
            if (elementId) {
                const el = document.getElementById(elementId);
                // HTML rendering allowed for specific keys if needed, but be careful with XSS
                // For now innerHTML is used to allow <span class="text-gold">
                if (el) el.innerHTML = item.value;
            }
        });
    }
}

/* --- SLIDER --- */
async function loadSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer) return;

    // Remove existing static slides (keep controls)
    const controls = sliderContainer.querySelector('.slider-controls');

    const { data: slides, error } = await supabase
        .from('slides')
        .select('*')
        .order('display_order', { ascending: true });

    if (error || !slides || slides.length === 0) {
        console.warn('No slides found or error loading slides, keeping static fallback if any.');
        // If data is empty, we might want to keep static HTML or show a default.
        // For now, we assume if we have data, we replace.
        initSliderLogic(); // Init on existing static content
        return;
    }

    // Clear slides, keep controls
    sliderContainer.innerHTML = '';

    slides.forEach((slide, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `slide ${index === 0 ? 'active' : ''}`;
        slideDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${slide.image_url}')`;

        slideDiv.innerHTML = `
            <div class="container slide-content">
                <h1>${slide.title || ''}</h1>
                <p>${slide.subtitle || ''}</p>
                <div class="hero-btns">
                    <a href="#products" class="btn btn-primary">Ürünleri Gör</a>
                </div>
            </div>
        `;
        sliderContainer.appendChild(slideDiv);
    });

    if (controls) sliderContainer.appendChild(controls);
    else {
        // Re-add controls if they were lost
        sliderContainer.innerHTML += `
            <div class="slider-controls">
                <button class="prev-slide">❮</button>
                <button class="next-slide">❯</button>
            </div>
        `;
    }

    // Initialize logic AFTER adding elements
    initSliderLogic();
}

function initSliderLogic() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlide = 0;
    const slideInterval = 5000;

    if (!slides.length) return;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    if (nextBtn) {
        // Remove old listeners to prevent duplicates if re-init
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', () => { nextSlide(); resetTimer(); });
    }

    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', () => { prevSlide(); resetTimer(); });
    }

    let timer = setInterval(nextSlide, slideInterval);
    function resetTimer() { clearInterval(timer); timer = setInterval(nextSlide, slideInterval); }
}

/* --- PRODUCTS --- */
async function loadProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

    if (!error && products && products.length > 0) {
        const grid = document.querySelector('.product-grid');
        if (grid) {
            grid.innerHTML = '';
            products.forEach(prod => {
                const div = document.createElement('div');
                div.className = 'product-card';
                div.innerHTML = `
                    <div class="card-image"><img src="${prod.image_url}" alt="${prod.title}"></div>
                    <div class="card-content">
                        <h3>${prod.title}</h3>
                        <p>${prod.category}</p>
                        <a href="#" class="link-arrow">İncele →</a>
                    </div>
                `;
                grid.appendChild(div);
            });
        }
    }
}

/* --- GALLERY --- */
async function loadGallery() {
    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).limit(8);

    if (!error && data && data.length > 0) {
        const grid = document.querySelector('.gallery-grid');
        if (grid) {
            grid.innerHTML = '';
            data.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = `gallery-item item-${index + 1}`;
                div.innerHTML = `<img src="${item.image_url}" alt="${item.caption || 'Gallery Image'}">`;
                grid.appendChild(div);
            });
        }
    }
}

/* --- UTILS --- */
function setupMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    const menu = document.getElementById('nav-menu');
    const links = menu.querySelectorAll('.nav-link');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('open');
            toggle.textContent = menu.classList.contains('open') ? '✕' : '☰';
        });

        links.forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('open');
                toggle.textContent = '☰';
            });
        });
    }
}

function setupHeaderScroll() {
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }
}

function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.product-card, .section-title, .about-text');
    elements.forEach(el => observer.observe(el));
}
