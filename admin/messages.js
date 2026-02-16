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

// Load messages when tab is clicked
navItems.forEach(item => {
    if (item.dataset.tab === 'messages') {
        item.addEventListener('click', loadMessages);
    }
});
