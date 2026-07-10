function back() {
    window.location.href = "../strona startowa/start.html";
}

function sprawdzCheckbox() {
    const checkbox = document.getElementById("agree");
    const button = document.getElementById("registerBtn");
    button.disabled = !checkbox.checked;
}

const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', function () {
    const statusEl = document.getElementById('status');
    const registerBtn = document.getElementById('registerBtn');

    registerBtn.addEventListener('click', async function () {
        const email = document.getElementById('email').value;
        const haslo = document.getElementById('password').value;
        const haslo2 = document.getElementById('password2').value;
        const zaakceptowano = document.getElementById('agree').checked;
        const error = document.getElementById('passwordError');

        error.textContent = "";
        statusEl.textContent = "";

        // 1. Walidacja hasła
        if (haslo.length < 8) {
            error.textContent = "Hasło musi mieć co najmniej 8 znaków.";
            return;
        }
        if (haslo !== haslo2) {
            error.textContent = "Hasła muszą być takie same.";
            return;
        }

        // 2. Sprawdzenie checkboxa
        if (!zaakceptowano) {
            statusEl.textContent = "Musisz zaakceptować regulamin!";
            return;
        }

        // 3. Zapis do bazy (rejestracja przez Supabase Auth)
        registerBtn.disabled = true;
        statusEl.textContent = "Rejestrowanie...";

        const { data, error: signUpError } = await supabaseClient.auth.signUp({
            email: email,
            password: haslo
        });

        if (signUpError) {
            statusEl.textContent = 'Błąd rejestracji: ' + signUpError.message;
            registerBtn.disabled = false;
            return;
        }

        // 4. Przekierowanie na kolejną stronę
        window.location.href = '../Profil/prof.html';
    });
});