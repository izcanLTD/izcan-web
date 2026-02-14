import { supabase } from '../src/supabase.js';

const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    errorMsg.textContent = 'Giriş yapılıyor...';

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        errorMsg.textContent = 'Hatalı e-posta veya şifre: ' + error.message;
    } else {
        window.location.href = './dashboard.html';
    }
});
