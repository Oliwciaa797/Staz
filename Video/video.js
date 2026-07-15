const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function goToLogin() {
    window.location.href = "../logowanie/log.html";
}

const params = new URLSearchParams(window.location.search);
const videoId = params.get("video");
const player = document.getElementById("youtubeVideo");

if (videoId) {
    console.log("Video ID:", videoId);
    player.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
} else {
    console.error("Brak video ID");
    document.getElementById("notesContent").innerHTML = "Nie znaleziono filmu.";
}

async function generateNotes() {
    const notes = document.getElementById("notesContent");
    notes.innerHTML = "Generowanie notatek...";

    if (!videoId) {
        notes.innerHTML = "Brak ID wideo.";
        return;
    }

    try {
        const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
        );
        const detailsData = await detailsResponse.json();

        if (!detailsResponse.ok || !detailsData.items || detailsData.items.length === 0) {
            console.error(detailsData);
            notes.innerHTML = "Nie można pobrać danych filmu z YouTube.";
            return;
        }

        const snippet = detailsData.items[0].snippet || {};
        const title = snippet.title || "";
        const description = snippet.description || "";

        const response = await fetch("http://localhost:5000/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                videoId,
                title,
                description
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Błąd serwera" }));
            notes.innerHTML = errorData.error || "Błąd serwera.";
            return;
        }

        const data = await response.json();
        notes.innerHTML = data.notes || "Brak notatek.";
    } catch (error) {
        console.error(error);
        notes.innerHTML = "Nie udało się wygenerować notatki.";
    }
}

function showTab(tabId) {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(tab => {
        tab.classList.remove("active");
    });
    document.getElementById(tabId).classList.add("active");
}

// Domyślnie pokaż pierwszą zakładkę
showTab("generated");

async function updateSidebar() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    const sidebar = document.getElementById("sidebar");

    if (user) {

        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../Zapisane materiały/zapis.html">Zapisane materiały</a>
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

document.addEventListener("DOMContentLoaded", async () => {

    await showUser();
    await updateSidebar();

    showTab("generated");

});

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

async function showUser() {

    const userArea = document.getElementById("userArea");

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {

        userArea.innerHTML = `
            <button class="login-btn" onclick="goToLogin()">
                Zaloguj
            </button>
        `;

        return;
    }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("profiles, avatar_url")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const avatarUrl = profile.avatar_url || "../Profil/avatar.png";

    userArea.innerHTML = `
<div class="user-area">

    <div class="user-info" id="userInfo">

        <img src="${avatarUrl}" class="avatar">

        <span>Witaj, ${profile.profiles}</span>

    </div>

    <div class="user-menu" id="userMenu">

        <a href="../Profil/prof.html">Profil</a>

        <a href="../wylogowywanie/logout.html">Wyloguj się</a>

    </div>

</div>

`;

const info = document.getElementById("userInfo");
const menu = document.getElementById("userMenu");

info.addEventListener("click", (e) => {

    e.stopPropagation();

    menu.classList.toggle("active");

});
}

function toProfile() {
    window.location.href = "../Profil/prof.html";
}

function back(){
    window.location.href = "../strona startowa/start.html";
}

document.addEventListener("click", () => {

    const menu = document.getElementById("userMenu");

    if(menu){
        menu.classList.remove("active");
    }

});
