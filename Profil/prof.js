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

    await updateSidebar();
    // 1. Sprawdzenie, czy ktoś jest zalogowany
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = '../logowanie/log.html';
        return;
    }

    currentUser = session.user;
    document.getElementById('email').value = currentUser.email;

    await loadProfile();
    await loadUserStats();

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
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const saveBtn = document.getElementById('saveBtn');

    if (saveBtn.disabled) return;

    btnText.style.display = "none";
    loader.style.display = "block";
    saveBtn.disabled = true;


    // statusEl.textContent = 'Zapisywanie...';

    let avatarUrl = null;
    const currentSrc = document.getElementById('avatarImg').src;
    if (currentSrc && !currentSrc.startsWith('blob:')) {
        avatarUrl = currentSrc;
    }

    // Jeśli wybrano nowe zdjęcie -> wgraj je do Supabase Storage
    if (selectedAvatarFile) {
        // --- DEBUG: sprawdzenie sesji przed uploadem ---
        const { data: sessionCheck } = await supabaseClient.auth.getSession();
        console.log('DEBUG sesja aktywna?', sessionCheck.session);
        console.log('DEBUG user id z sesji:', sessionCheck.session?.user?.id);
        console.log('DEBUG currentUser.id:', currentUser.id);
        // --- KONIEC DEBUG ---

        const fileExt = selectedAvatarFile.name.split('.').pop();
        const filePath = `${currentUser.id}/avatar.${fileExt}`;
        console.log('DEBUG filePath:', filePath);

        const { error: uploadError } = await supabaseClient
            .storage
            .from('avatars')
            .upload(filePath, selectedAvatarFile, { upsert: true });

        if (uploadError) {
            console.error('UPLOAD ERROR:', uploadError);
            alert(JSON.stringify(uploadError, null, 2));

            statusEl.textContent =
            'Błąd wysyłania zdjęcia: ' + uploadError.message;

            btnText.style.display = "block";
            loader.style.display = "none";  
            saveBtn.disabled = false;

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

        btnText.style.display = "block";
        loader.style.display = "none";
        saveBtn.disabled = false;

        return;
    }

   statusEl.style.display = "inline";
    statusEl.textContent = 'Dane zostały zapisane!';
    selectedAvatarFile = null;

    // ukryj tekst przycisku
    btnText.style.display = "none";
    loader.style.display = "none";
    saveBtn.disabled = true;

    setTimeout(() => {
        statusEl.style.display = "none";

        // przywróć przycisk
        btnText.style.display = "block";
        saveBtn.disabled = false;

    }, 1000);
}

function goToLogin() {

    window.location.href =
    "../logowanie/log.html";

}

async function updateSidebar() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    const sidebar = document.getElementById("sidebar");

    if (user) {
        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../materialy/not.html">Zapisane materiały</a>
            <a href="../Profil/prof.html">Profil</a>
            <a href="../wylogowywanie/logout.html">Wyloguj się</a>
        `;
    } else {
        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../logowanie/log.html">Logowanie</a>
        `;
    }
}

document.getElementById("menuBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("sidebar").classList.toggle("active");
});

document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar");

    if (
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target)
    ) {
        sidebar.classList.remove("active");
    }
});

async function loadUserStats() {

    const notesPromise = supabaseClient
        .from('notes')
        .select('id', { count:'exact', head:true })
        .eq('user_id', currentUser.id);

    const quizPromise = supabaseClient
        .from('quizzes')
        .select('id', { count:'exact', head:true })
        .eq('user_id', currentUser.id);

    const savedPromise = supabaseClient
        .from('saved_items')
        .select('id', { count:'exact', head:true })
        .eq('user_id', currentUser.id);


    const [
        {count: notesCount},
        {count: quizCount},
        {count: savedCount}
    ] = await Promise.all([
        notesPromise,
        quizPromise,
        savedPromise
    ]);

    console.log("Notatki:", notesCount);
    console.log("Quizy:", quizCount);
    console.log("Zapisane:", savedCount);

    const total =
        (notesCount || 0) +
        (quizCount || 0) +
        (savedCount || 0);


    document.getElementById('projects').value = total;
}

function goToProjects(){
    window.location.href =
    "../materialy/not.html";
}