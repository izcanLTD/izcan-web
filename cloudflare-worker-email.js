// Cloudflare Worker for sending emails via Resend
// Deploy this to Cloudflare Workers

export default {
    async fetch(request, env) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only allow POST
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            const { name, email, phone, message, replyText } = await request.json();

            // Determine email type
            const isReply = !!replyText;

            let emailData;

            if (isReply) {
                // Reply to customer
                emailData = {
                    from: 'İzcan Orman Ürünleri <noreply@izcan.com.tr>',
                    to: [email],
                    cc: ['info@izcan.com.tr'],
                    subject: 'Re: İletişim Formunuz Hakkında',
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #c9a961;">İzcan Orman Ürünleri</h2>
              <p>Merhaba ${name},</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${replyText.replace(/\n/g, '<br>')}
              </div>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #666; font-size: 14px;">
                <strong>İzcan Orman Ürünleri Ltd. Şti.</strong><br>
                <a href="https://izcan.com.tr" style="color: #c9a961;">https://izcan.com.tr</a><br>
                info@izcan.com.tr
              </p>
            </div>
          `
                };
            } else {
                // New message notification to admin
                emailData = {
                    from: 'İzcan Website <noreply@izcan.com.tr>',
                    to: ['info@izcan.com.tr'],
                    subject: `Yeni İletişim Formu Mesajı - ${name}`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #c9a961;">Yeni İletişim Formu Mesajı</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>İsim:</strong> ${name}</p>
                <p><strong>E-posta:</strong> ${email}</p>
                ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
                <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                <p><strong>Mesaj:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                Admin panelden yanıtlayabilirsiniz: <a href="https://izcan.com.tr/admin" style="color: #c9a961;">Admin Panel</a>
              </p>
            </div>
          `
                };
            }

            // Send via Resend API
            const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });

            const result = await resendResponse.json();

            if (!resendResponse.ok) {
                throw new Error(result.message || 'Email send failed');
            }

            return new Response(JSON.stringify({ success: true, id: result.id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } catch (error) {
            console.error('Email error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    },
};
