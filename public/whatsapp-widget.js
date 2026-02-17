/* WhatsApp Floating Chat Widget */
let whatsappNumber = '';
let greetingMessage = 'Merhaba! 👋<br>Size nasıl yardımcı olabiliriz?';

async function initWhatsAppWidget() {
    // Wait for supabase to be available
    if (!window.supabase) {
        setTimeout(initWhatsAppWidget, 100);
        return;
    }

    try {
        // Load WhatsApp number from database
        const { data: numberData } = await window.supabase
            .from('site_content')
            .select('value')
            .eq('key', 'whatsapp_number')
            .maybeSingle();

        if (numberData && numberData.value) {
            whatsappNumber = numberData.value.replace(/[^0-9]/g, '');
        }

        // Load greeting message
        const { data: greetingData } = await window.supabase
            .from('site_content')
            .select('value')
            .eq('key', 'whatsapp_greeting')
            .maybeSingle();

        if (greetingData && greetingData.value) {
            greetingMessage = greetingData.value;
        }
    } catch (error) {
        console.error('WhatsApp widget error:', error);
    }

    // Create widget HTML with forced black text
    const widget = document.createElement('div');
    widget.className = 'whatsapp-float';
    widget.innerHTML = `
        <div class="whatsapp-button" id="whatsapp-toggle">
            <i class="fab fa-whatsapp"></i>
        </div>
        <div class="whatsapp-chat-box" id="whatsapp-chat">
            <div class="whatsapp-chat-header">
                <img src="/logo.png" alt="İzcan">
                <div class="whatsapp-chat-header-info">
                    <h4>İzcan Orman Ürünleri</h4>
                    <p>Genellikle birkaç dakika içinde yanıt verir</p>
                </div>
                <button class="whatsapp-close" id="whatsapp-close">&times;</button>
            </div>
            <div class="whatsapp-chat-body">
                <div class="whatsapp-message">
                    ${greetingMessage}
                </div>
            </div>
            <div class="whatsapp-chat-footer">
                <input type="text" id="whatsapp-input" placeholder="Mesajınızı yazın..." style="color: #000 !important;" />
                <button id="whatsapp-send">Gönder</button>
            </div>
        </div>
    `;

    document.body.appendChild(widget);

    // Force black text color with JavaScript after DOM insertion
    setTimeout(() => {
        const messageDiv = document.querySelector('.whatsapp-message');
        if (messageDiv) {
            messageDiv.style.setProperty('color', '#000', 'important');
            messageDiv.style.setProperty('font-weight', '600', 'important');
            // Also set color on all child elements
            const allElements = messageDiv.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.setProperty('color', '#000', 'important');
            });
        }

        const inputField = document.getElementById('whatsapp-input');
        if (inputField) {
            inputField.style.setProperty('color', '#000', 'important');
        }
    }, 100);

    // Toggle chat box
    document.getElementById('whatsapp-toggle').addEventListener('click', () => {
        const chatBox = document.getElementById('whatsapp-chat');
        chatBox.classList.toggle('active');
    });

    // Close button
    document.getElementById('whatsapp-close').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('whatsapp-chat').classList.remove('active');
    });

    // Send message
    const sendMessage = () => {
        const input = document.getElementById('whatsapp-input');
        const message = input.value.trim();

        if (message && whatsappNumber) {
            const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            input.value = '';
            document.getElementById('whatsapp-chat').classList.remove('active');
        } else if (!whatsappNumber) {
            alert('WhatsApp numarası ayarlanmamış. Lütfen admin panelden ayarlayın.');
        }
    };

    document.getElementById('whatsapp-send').addEventListener('click', sendMessage);

    document.getElementById('whatsapp-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhatsAppWidget);
} else {
    initWhatsAppWidget();
}
