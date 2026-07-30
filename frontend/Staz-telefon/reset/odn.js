const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', function () {
    const resetBtn = document.getElementById('resetBtn');
    const statusEl = document.getElementById('status');

    resetBtn.addEventListener('click', async function () {
        const email = document.getElementById('email').value;

        statusEl.textContent = '';

        if (!email) {
            statusEl.textContent = 'Podaj adres e-mail.';
            return;
        }

        resetBtn.disabled = true;
        statusEl.textContent = 'Wysyłanie linku resetującego...';
        
        const { data, error } = await supabaseClient.functions.invoke('send-reset-email', {
    body: {
        email: email,
        redirectTo: 'file:///D:/Users/admin-3.AM-T-07477/Documents/staz/Staz/reset/odn.html'
    }
});

        if (error) {
            statusEl.textContent = 'Błąd: ' + error.message;
            resetBtn.disabled = false;
            return;
        }

        statusEl.textContent = 'Link do resetu hasła został wysłany na e-mail.';
    });
});