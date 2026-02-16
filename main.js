import { supabase } from './src/supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    setupMobileMenu();
    setupHeaderScroll();

    await loadContent();
    await loadSlider();
    await loadProducts();
    await loadGallery();
    await loadSocialLinks();
    await loadMapLocation();
    await loadWhatsAppNumber();
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
                    <a href="/catalog.html" class="btn btn-primary">Kataloğu İncele</a>
                    <a href="#contact" class="btn btn-outline">İletişime Geç</a>
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
                        <a href="#" class="link-arrow" onclick="openProductDetail('${prod.id}', '${prod.title}', '${prod.category}', '${prod.description || ''}', '${prod.image_url}'); return false;">İncele →</a>
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

/* --- SOCIAL MEDIA LINKS --- */
async function loadSocialLinks() {
    const { data, error } = await supabase.from('site_content').select('*');
    if (!error && data) {
        const socialMap = {
            'social_instagram': 'social-instagram',
            'social_facebook': 'social-facebook',
            'social_linkedin': 'social-linkedin'
        };

        data.forEach(item => {
            const elementId = socialMap[item.key];
            if (elementId) {
                const el = document.getElementById(elementId);
                if (el && item.value) {
                    el.href = item.value;
                }
            }
        });
    }
}

/* --- MAP LOCATION --- */
async function loadMapLocation() {
    const { data, error } = await supabase.from('site_content').select('*');
    if (!error && data) {
        let latitude = '40.2';
        let longitude = '29.0';

        data.forEach(item => {
            if (item.key === 'map_latitude' && item.value) latitude = item.value;
            if (item.key === 'map_longitude' && item.value) longitude = item.value;
        });

        const mapIframe = document.getElementById('google-map');
        if (mapIframe) {
            mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=15`;
        }
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

/* --- INTERSECTION OBSERVER --- */
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up'); // Changed from 'visible' to 'fade-in-up' to match original
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.product-card, .section-title, .fade-in').forEach(el => observer.observe(el)); // Added .fade-in
}

/* --- CONTACT FORM --- */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gönderiliyor...';

        try {
            const formData = {
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email-input').value,
                phone: document.getElementById('contact-phone-input').value || null,
                message: document.getElementById('contact-message').value
            };

            // Save to database
            const { error: dbError } = await supabase
                .from('contact_messages')
                .insert([formData]);

            if (dbError) throw dbError;

            // Send email notification via Cloudflare Worker
            try {
                await fetch('/api/send-contact-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } catch (emailError) {
                console.error('Email notification error:', emailError);
                // Don't fail the whole operation if email fails
            }

            // Success
            alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
            contactForm.reset();
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin veya doğrudan bize ulaşın.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    /* --- PRODUCT DETAIL MODAL --- */
    window.openProductDetail = function (id, title, category, description, imageUrl) {
        const details = `
                Ürün: ${title}
                Kategori: ${category}
                ${description ? 'Açıklama: ' + description : ''}
                Daha fazla bilgi için bizimle iletişime geçin.
                    `.trim();

        alert(details);
    };
    /* --- WHATSAPP INTEGRATION --- */
    async function loadWhatsAppNumber() {
        const { data } = await supabase
            .from('site_content')
            .select('value')
            .eq('key', 'whatsapp_number')
            .single();

        if (data && data.value) {
            const whatsappLink = document.getElementById('social-whatsapp');
            if (whatsappLink) {
                const number = data.value.replace(/[^0-9]/g, '');
                whatsappLink.href = `https://wa.me/${number}`;
            }
        }
    }
}
