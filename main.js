import './style.css'
import { supabase } from './src/supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    setupMobileMenu();
    setupHeaderScroll();

    // Fetch and apply content dynamically
    await loadContent();
    await loadProducts(); // If you want dynamic products

    setupSlider(); // Setup slider AFTER content is loaded
    setupIntersectionObserver();
});

async function loadContent() {
    const { data, error } = await supabase.from('site_content').select('*');
    if (!error && data) {
        // Map database keys to HTML IDs
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

async function loadProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

    if (!error && products.length > 0) {
        const grid = document.querySelector('.product-grid');
        grid.innerHTML = ''; // Clear static content

        products.forEach(prod => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <div class="card-image">
                  <img src="${prod.image_url}" alt="${prod.title}">
                </div>
                <div class="card-content">
                  <h3>${prod.title}</h3>
                  <p>${prod.category}</p>
                  <a href="#" class="link-arrow">Detayları Gör →</a>
                </div>
            `;
            grid.appendChild(div);
        });
    }
}

// Mobile Menu
function setupMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    const menu = document.getElementById('nav-menu');
    const links = menu.querySelectorAll('.nav-link');

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

// Header Scroll Effect
function setupHeaderScroll() {
    const header = document.getElementById('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Hero Slider
function setupSlider() {
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

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetTimer();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetTimer();
    });

    let timer = setInterval(nextSlide, slideInterval);

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(nextSlide, slideInterval);
    }
}

// Scroll Animations (Simple fade-in up)
function setupIntersectionObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.product-card, .section-title, .about-text, .contact-info');
    elements.forEach(el => observer.observe(el));
}
