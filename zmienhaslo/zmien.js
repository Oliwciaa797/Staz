const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async function () {
    // Musisz być zalogowany, żeby zmienić hasło
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '../logowanie/log.html';
        return;
    }

    document.getElementById('changeBtn').addEventListener('click', async function () {
        const currentPassword = document.getElementById('currentPassword').value;
        const pass1 = document.getElementById('newPassword').value;
        const pass2 = document.getElementById('newPassword2').value;
        const errorEl = document.getElementById('error');
        const statusEl = document.getElementById('status');

        errorEl.textContent = '';
        statusEl.textContent = '';

        if (!currentPassword) {
            errorEl.textContent = 'Wpisz obecne hasło.';
            return;
        }
        if (pass1.length < 8) {
            errorEl.textContent = 'Nowe hasło musi mieć co najmniej 8 znaków.';
            return;
        }
        if (pass1 !== pass2) {
            errorEl.textContent = 'Nowe hasła muszą być takie same.';
            return;
        }
        if (pass1 === currentPassword) {
            errorEl.textContent = 'Nowe hasło musi się różnić od obecnego.';
            return;
        }

        statusEl.textContent = 'Weryfikacja obecnego hasła...';

        // 1. Weryfikujemy obecne hasło próbując się nim zalogować.
        // Supabase nie ma osobnego endpointu "sprawdź hasło" —
        // signInWithPassword to standardowy sposób re-autoryzacji.
        const { data: { user } } = await supabaseClient.auth.getUser();

        const { error: signInError } = await supabaseClient.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            errorEl.textContent = 'Obecne hasło jest nieprawidłowe.';
            statusEl.textContent = '';
            return;
        }

        // 2. Hasło poprawne — ustawiamy nowe
        statusEl.textContent = 'Zapisywanie...';

        const { error: updateError } = await supabaseClient.auth.updateUser({ password: pass1 });

        if (updateError) {
            errorEl.textContent = 'Błąd: ' + updateError.message;
            statusEl.textContent = '';
            return;
        }

        statusEl.textContent = 'Hasło zostało zmienione!';
        setTimeout(() => {
            window.location.href = '../Profil/prof.html';
        }, 1500);
    });
});

function back(){
    window.location.href='../Profil/prof.html'
}