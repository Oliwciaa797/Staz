const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async function () {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '../logowanie/log.html';
        return;
    }

    document.getElementById('deleteBtn').addEventListener('click', async function () {
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Usuwanie konta...';

        // UWAGA: usunięcie konta z auth.users wymaga uprawnień administratora
        // (service_role key), których nie wolno umieszczać w kodzie frontendowym.
        // Dlatego to wywołanie odpala funkcję Edge Function o nazwie "delete-user",
        // którą trzeba samodzielnie utworzyć w Supabase (patrz instrukcja w czacie).
        const { error } = await supabaseClient.functions.invoke('delete-user');

        if (error) {
            statusEl.textContent = 'Błąd: ' + error.message;
            return;
        }

        await supabaseClient.auth.signOut();
        window.location.href = '../logowanie/log.html';
    });
});