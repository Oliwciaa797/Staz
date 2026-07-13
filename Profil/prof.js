function back() {
    window.location.href = "../strona startowa/start.html";
}

const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let selectedAvatarFile = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    // 1. Sprawdzenie, czy ktoś jest zalogowany
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = '../logowanie/log.html';
        return;
    }

    currentUser = session.user;
    document.getElementById('email').value = currentUser.email;

    await loadProfile();

    document.getElementById('avatarWrapper').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });
    document.getElementById('avatarInput').addEventListener('change', handleAvatarPreview);
    document.getElementById('saveBtn').addEventListener('click', saveProfile);
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        window.location.href = '../zmienhaslo/zmien.html';
    });
    document.getElementById('deleteAccountBtn').addEventListener('click', () => {
        window.location.href = '../usunkonto/usun.html';
    });
}

async function loadProfile() {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('profiles, projects, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (error) {
        console.error('Błąd wczytywania profilu:', error.message);
        return;
    }

    if (data) {
        document.getElementById('username').value = data.profiles || '';
        document.getElementById('projects').value = data.projects || '';

        if (data.avatar_url) {
            const img = document.getElementById('avatarImg');
            img.src = data.avatar_url;
            img.style.display = 'block';
            document.getElementById('avatarPlaceholder').style.display = 'none';
        }
    }
}

function handleAvatarPreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    selectedAvatarFile = file;

    const img = document.getElementById('avatarImg');
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';
    document.getElementById('avatarPlaceholder').style.display = 'none';
}

async function saveProfile() {
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'Zapisywanie...';

    let avatarUrl = null;
    const currentSrc = document.getElementById('avatarImg').src;
    if (currentSrc && !currentSrc.startsWith('blob:')) {
        avatarUrl = currentSrc;
    }

    // Jeśli wybrano nowe zdjęcie -> wgraj je do Supabase Storage
    if (selectedAvatarFile) {
        const fileExt = selectedAvatarFile.name.split('.').pop();
        const filePath = `${currentUser.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from('avatars')
            .upload(filePath, selectedAvatarFile, { upsert: true });

        if (uploadError) {
            statusEl.textContent = 'Błąd wysyłania zdjęcia: ' + uploadError.message;
            return;
        }

        const { data: publicUrlData } = supabaseClient
            .storage
            .from('avatars')
            .getPublicUrl(filePath);

        avatarUrl = publicUrlData.publicUrl + '?t=' + Date.now();
    }

    const username = document.getElementById('username').value;
    const projects = document.getElementById('projects').value;

    const { error } = await supabaseClient
        .from('profiles')
        .upsert({
            id: currentUser.id,
            profiles: username,
            projects: projects,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
        });

    if (error) {
        statusEl.textContent = 'Błąd zapisu: ' + error.message;
        return;
    }

    statusEl.textContent = 'Dane zostały zapisane!';
    selectedAvatarFile = null;
}