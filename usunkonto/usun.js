const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// nazwa Twojego bucketu ze zdjęciami — popraw jeśli inna
const AVATAR_BUCKET = 'avatars';

const toastInstance = new toast();
document.addEventListener('DOMContentLoaded', async function () {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '../logowanie/log.html';
        return;
    }

    document.getElementById('deleteBtn').addEventListener('click', async function () {
        const statusEl = document.getElementById('status');
        const passwordInput = document.getElementById('passwordInput');
        const password = passwordInput.value;

        if (!password) {
            statusEl.textContent = 'Wpisz hasło, aby potwierdzić usunięcie konta.';
            return;
        }

        statusEl.textContent = 'Usuwanie konta...';

        const { data: { user } } = await supabaseClient.auth.getUser();

        // 1. Pobierz avatar_url z profilu, żeby wiedzieć co usunąć z bucketu
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();

        if (profileError) {
            toastInstance.show('error', 'Błąd', profileError.message);
            return;
        }

        // 2. Usuń zdjęcie z bucketu (jeśli istnieje)
        if (profile?.avatar_url) {
            const filePath = extractPathFromUrl(profile.avatar_url);

            const { error: storageError } = await supabaseClient
                .storage
                .from(AVATAR_BUCKET)
                .remove([filePath]);

            if (storageError) {
                console.error(storageError);
                // nie przerywamy — brak pliku nie powinien blokować usunięcia konta
            }
        }

        // 3. Wywołuje funkcję SQL "delete_user" (security definer) w Supabase,
        // która sama weryfikuje hasło i usuwa profil oraz konto
        // TYLKO osoby aktualnie zalogowanej.
        const { error } = await supabaseClient.rpc('delete_user', { password });

        if (error) {
            // np. "Nieprawidłowe hasło"
            toastInstance.show('error', 'Błąd', error.message);
            return;
        }

        await supabaseClient.auth.signOut();
        window.location.href = '../logowanie/log.html';
    });
});

function extractPathFromUrl(url) {
    // przykład: https://xxx.supabase.co/storage/v1/object/public/avatars/user-id/avatar.png
    const parts = url.split(`/storage/v1/object/public/${AVATAR_BUCKET}/`);
    return parts[1] || url; // jeśli avatar_url to już sama ścieżka, zwróć bez zmian
}

function back(){
    window.location.href='../Profil/prof.html'
}