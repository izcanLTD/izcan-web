// Contact Form Validation and Enhanced Error Handling
// Import this in index.html after main.js

import { supabase } from './supabase.js';

// Override the contact form handler with validation
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    // Remove existing listeners by cloning
    const newForm = contactForm.cloneNode(true);
    contactForm.parentNode.replaceChild(newForm, contactForm);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gönderiliyor...';

        try {
            // Get and validate form values
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email-input').value.trim();
            const phone = document.getElementById('contact-phone-input').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Lütfen geçerli bir e-posta adresi girin.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }

            // Validate phone format (if provided)
            if (phone) {
                const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
                if (!phoneRegex.test(phone)) {
                    alert('Lütfen geçerli bir telefon numarası girin (en az 10 rakam).');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
            }

            const formData = {
                name: name,
                email: email,
                phone: phone || null,
                message: message
            };

            console.log('📧 Submitting contact form:', formData);

            // Save to database
            const { data: insertedData, error: dbError } = await supabase
                .from('contact_messages')
                .insert([formData])
                .select();

            console.log('💾 Database response:', { insertedData, dbError });

            if (dbError) {
                console.error('❌ Database error details:', dbError);
                throw new Error(`Veritabanı hatası: ${dbError.message}`);
            }

            console.log('✅ Message saved to database successfully');

            // Send email notification via Cloudflare Worker
            try {
                const emailResponse = await fetch('/api/send-contact-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                console.log('📨 Email API response status:', emailResponse.status);

                if (!emailResponse.ok) {
                    const errorText = await emailResponse.text();
                    console.error('❌ Email send failed:', errorText);
                } else {
                    console.log('✅ Email sent successfully');
                }
            } catch (emailError) {
                console.error('❌ Email notification error:', emailError);
                // Don't fail the whole operation if email fails
            }

            // Success
            alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
            newForm.reset();
        } catch (error) {
            console.error('❌ Form submission error:', error);
            alert(`Bir hata oluştu: ${error.message}\n\nLütfen tekrar deneyin veya doğrudan bize ulaşın.`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});
