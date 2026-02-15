import './style.css'
import { supabase } from './src/supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    setupMobileMenu();
    setupHeaderScroll();

    await loadContent();
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
                if (el) el.innerHTML = item.value;
            }
        });
    }
}

/* --- SLIDER --- */
async function loadSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer) return;

    const controls = sliderContainer.querySelector('.slider-controls');

    const { data: slides, error } = await supabase
        .from('slides')
        .select('*')
        .order('display_order', { ascending: true });

    if (error || !slides || slides.length === 0) {
        initSliderLogic();
        return;
    }

    sliderContainer.innerHTML = '';

    slides.forEach((slide, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = `slide ${index === 0 ? 'active' : ''}`;

        let backgroundHtml = '';
        if (slide.media_type === 'video' && slide.video_url) {
            backgroundHtml = `
                <video autoplay muted loop playsinline class="slide-video">
                    <source src="${slide.video_url}" type="video/mp4">
                </video>
                <div class="overlay"></div>
            `;
        } else {
            slideDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${slide.image_url}')`;
        }

        slideDiv.innerHTML = `
            ${backgroundHtml}
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
        sliderContainer.innerHTML += `
            <div class="slider-controls">
                <button class="prev-slide">❮</button>
                <button class="next-slide">❯</button>
            </div>
        `;
    }

    initSliderLogic();
}

function initSliderLogic() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');
    let currentSlide = 0;
    const slideInterval = 8000;

    if (!slides.length) return;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    if (nextBtn) {
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
    const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(8);
    const grid = document.querySelector('.product-grid');
    if (grid && products) {
        grid.innerHTML = '';
        products.forEach(prod => {
            grid.innerHTML += `
                <div class="product-card">
                    <div class="card-image"><img src="${prod.image_url}" alt="${prod.title}"></div>
                    <div class="card-content">
                        <h3>${prod.title}</h3>
                        <p>${prod.category}</p>
                        <a href="#" class="link-arrow">İncele →</a>
                    </div>
                </div>`;
        });
    }
}

/* --- GALLERY --- */
async function loadGallery() {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).limit(8);
    const grid = document.querySelector('.gallery-grid');
    if (grid && data) {
        grid.innerHTML = '';
        data.forEach((item, index) => {
            let content = '';
            if (item.media_type === 'video' && item.video_url) {
                content = `<video src="${item.video_url}" muted loop onmouseover="this.play()" onmouseout="this.pause()" style="width:100%;height:100%;object-fit:cover;"></video>`;
            } else {
                content = `<img src="${item.image_url}" alt="${item.caption || 'Gallery Image'}">`;
            }
            grid.innerHTML += `<div class="gallery-item item-${index + 1}">${content}</div>`;
        });
    }
}

/* --- UTILS --- */
function setupMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    const menu = document.getElementById('nav-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('open');
            document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
        });
        menu.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
            menu.classList.remove('open');
            document.body.style.overflow = '';
        }));
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
    document.querySelectorAll('.product-card, .section-title').forEach(el => observer.observe(el));
}
