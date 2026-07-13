function goToLogin() {
    window.location.href = "../rejestracja/register.html";
}

function back() {
    window.location.href = "../strona startowa/start.html";
}

function reset(){
    window.location.href = "../reset/reset.html";
}

const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function reset() {
    const email = document.getElementById('email').value;
    const statusEl = document.getElementById('status');

    if (!email) {
        statusEl.textContent = "Podaj adres e-mail, aby zresetować hasło.";
        return;
    }

    statusEl.textContent = "Wysyłanie linku resetującego...";

    supabaseClient.auth.resetPasswordForEmail(email).then(({ error }) => {
        if (error) {
            statusEl.textContent = "Błąd: " + error.message;
        } else {
            statusEl.textContent = "Link do resetu hasła został wysłany na e-mail.";
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('loginBtn');
    const statusEl = document.getElementById('status');
    const errorEl = document.getElementById('loginError');

    loginBtn.addEventListener('click', async function () {
        const email = document.getElementById('email').value;
        const haslo = document.getElementById('password').value;

        errorEl.textContent = "";
        statusEl.textContent = "";

        if (!email || !haslo) {
            errorEl.textContent = "Wypełnij oba pola.";
            return;
        }

        loginBtn.disabled = true;
        statusEl.textContent = "Logowanie...";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: haslo
        });

        if (error) {
            errorEl.textContent = "Błąd logowania: " + error.message;
            loginBtn.disabled = false;
            statusEl.textContent = "";
            return;
        }

        console.log("Zapisano:", localStorage.getItem("username"));

        // Zalogowano poprawnie -> przekierowanie
        window.location.href = '../Profil/prof.html';
    });
});