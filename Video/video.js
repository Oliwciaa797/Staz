const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);



console.log("video.js loaded");

const API_KEY = "AIzaSyCTX8K53tIFW1_vUY828xfjYkvuGygnX_w";

/* ---------- Pomocnicze: bezpieczne wstawianie tekstu do HTML ---------- */
function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
}

function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}

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

/* ---------- Przełączanie głównych zakładek (Notatki AI / Własne materiały / Quiz) ---------- */
function showTab(tabId) {

    console.log("Przełączam na:", tabId);

    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {
        tab.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");
}

// Domyślnie pokaż pierwszą zakładkę
showTab("generated");

/* ---------- Przełączanie pod-zakładek w "Własne materiały" (Notatki / Quizy) ---------- */
function showSubTab(subTabId){

    document.querySelectorAll(".sub-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".sub-tab-panel").forEach(panel => panel.classList.remove("active"));

    const btn = document.querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`);
    if(btn) btn.classList.add("active");

    const panel = document.getElementById(subTabId);
    if(panel) panel.classList.add("active");

    if(subTabId === "personalQuizy"){
        loadUserQuizy();
    }
}

let userRating = 0;

// Set star rating
async function setRating(stars) {

    userRating = stars;

    const starElements =
    document.querySelectorAll(
        '.rating-stars .star'
    );

    starElements.forEach((star,index) => {

        if(index < stars){
            star.classList.add('active');

            star.animate([
                { transform:'scale(1)' },
                { transform:'scale(1.3)' },
                { transform:'scale(1)' }
            ],{
                duration:300
            });

        } else {
            star.classList.remove('active');
        }

    });

}


/* ---------- Wczytanie i wyświetlenie recenzji ---------- */
async function loadReviews() {

    const sort =
        document.getElementById("sortReviews")?.value || "newest";


    let query =
        supabaseClient
        .from("video_reviews")
        .select(`
            *,
            profiles!user_id (
                profiles,
                avatar_url
            )
        `)
        .eq("video_id", videoId);


    switch(sort){

        case "oldest":
            query = query.order("created_at", {
                ascending:true
            });
            break;


        case "highest":
            query = query.order("rating", {
                ascending:false
            });
            break;


        case "lowest":
            query = query.order("rating", {
                ascending:true
            });
            break;


        default:
            query = query.order("created_at", {
                ascending:false
            });

    }


    const { data, error } = await query;


    if(error){
        console.error(error);
        return;
    }

    const reviews = data || [];

    const container =
        document.getElementById("reviewsContainer");

    if(reviews.length === 0){

        container.innerHTML =
            "<p>Brak opinii.</p>";

        document.querySelector(".grade-avg").textContent =
            "Średnia ocena: 0/5 ⭐";

        document.querySelector(".review-count").textContent =
            "0 opinii";

        return;
    }

    const formatDate = (date) => {

    return new Date(date).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

};

    const averageRating = (
        reviews.reduce((sum, r) => sum + r.rating, 0) /
        reviews.length
    ).toFixed(1);

    document.querySelector(".grade-avg").textContent =
        `Średnia ocena: ${averageRating}/5 ⭐`;

    document.querySelector(".review-count").textContent =
        `${reviews.length} opinii`;

    container.innerHTML =
    reviews.map(review => {

        const date =
        new Date(review.created_at)
        .toLocaleString("pl-PL");

        return `
            <div class="review-item">

                <div class="review-header">

                    <div class="review-user">
                        ${escapeHtml(review.profiles?.profiles || "Użytkownik")}
                    </div>

                    <div class="review-date">
                        ${date}
                    </div>
                </div>

                <div class="review-rating">
                    ${"⭐".repeat(review.rating)}
                </div>

                <div class="review-text">
                    ${escapeHtml(review.comment || "")}
                </div>

            </div>
        `;
    }).join("");
}

// Load reviews when page loads
document.addEventListener('DOMContentLoaded', loadReviews);
let errorMsg = document.getElementById('errorMsg');
async function submitReview() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Zaloguj się");
        return;
    }


    const reviewText =
        document.getElementById("reviewText").value;

    if (userRating === 0) {
        errorMsg.textContent = "Wybierz ocenę."
        return;
    }

    const { error } =
        await supabaseClient
            .from("video_reviews")
            .insert({
                video_id: videoId,
                user_id: user.id,
                rating: userRating,
                comment: reviewText
            });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    alert("Opinia dodana!");

    document.getElementById("reviewText").value = "";

    userRating = 0;

    document
        .querySelectorAll(".rating-stars .star")
        .forEach(star => star.classList.remove("active"));

    loadReviews();
}

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
        console.log(error);
        return;
    }



   const avatarUrl = profile.avatar_url || "../Profil/avatar.png";

    userArea.innerHTML = `

    <div class="user-info" id="userInfo">

        <img src="${avatarUrl}" class="avatar">

        <span>${escapeHtml(profile.profiles)}</span>

    </div>

    <div class="user-menu" id="userMenu">

        <a href="../Profil/prof.html">
            Profil
        </a>

        <a href="../wylogowywanie/logout.html">
            Wyloguj się
        </a>

    </div>

`;

const info = document.getElementById("userInfo");
const menu = document.getElementById("userMenu");

info.addEventListener("click", (e) => {

    e.stopPropagation();

    menu.classList.toggle("active");

});
}

function toProfile(){
    window.location.href = "../Profil/prof.html";
}
document.addEventListener("DOMContentLoaded", showUser);

async function updateSidebar() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    const sidebar = document.getElementById("sidebar");

    if (user) {
        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../materialy/not.html">Zapisane materiały</a>
            <a href="../Profil/prof.html">Profil</a>
            <a href="../wylogowywanie/logout.html">Wyloguj się</a>
            <a href="../zglaszanie bledow/blad.html">⚠️Zgłoś błąd⚠️</a>
        `;
    } else {
        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../logowanie/log.html">Logowanie</a>
            <a href="../zglaszanie bledow/blad.html">⚠️Zgłoś błąd⚠️</a>
        `;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    showUser();
    updateSidebar();
    loadPersonalNotes();
});

function back(){
    window.location.href = "../strona startowa/start.html";
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

document.addEventListener("click", () => {

    const menu = document.getElementById("userMenu");

    if(menu){
        menu.classList.remove("active");
    }

});

/* ============================================================
   WŁASNE NOTATKI
   ============================================================ */

function createPersonalNote() {

    const container =
    document.getElementById(
        "personalNotesContainer"
    );

    const emptyText =
    container.querySelector("p");

    if(emptyText){
        emptyText.remove();
    }

    const div =
    document.createElement("div");

    div.className = "note-card";

    div.innerHTML = `
        <input type="text" class="noteTitleInput" placeholder="Tytuł notatki">
        <textarea
            placeholder="Napisz swoją notatkę..."
        ></textarea>
        
        <div class="visibility-toggle">
            <input type="checkbox" class="notePublicInput">
            <label>Notatka publiczna (widoczna dla innych)</label>
        </div>

        <button class="saveNoteBtn">
            Zapisz
        </button>

    `;

    container.appendChild(div);

}

function timeAgo(date){

    const seconds =
        Math.floor((new Date() - new Date(date)) / 1000);


    const intervals = {
        rok: 31536000,
        miesiąc: 2592000,
        dzień: 86400,
        godzina: 3600,
        minuta: 60
    };


    if(seconds < 60){
        return "przed chwilą";
    }


    if(seconds < intervals.godzina){

        const min =
            Math.floor(seconds / intervals.minuta);

        return `${min} min temu`;

    }


    if(seconds < intervals.dzień){

        const hours =
            Math.floor(seconds / intervals.godzina);

        return `${hours} godz. temu`;

    }


    if(seconds < intervals.miesiąc){

        const days =
            Math.floor(seconds / intervals.dzień);

        return `${days} dni temu`;

    }


    if(seconds < intervals.rok){

        const months =
            Math.floor(seconds / intervals.miesiąc);

        return `${months} mies. temu`;

    }


    const years =
        Math.floor(seconds / intervals.rok);

    return `${years} lat temu`;

}

async function loadPersonalNotes(){

    const {
        data:{user}
    } = await supabaseClient.auth.getUser();

    if(!user){
        return;
    }

    const { data, error } =
    await supabaseClient
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending:false });

    if(error){
        console.error(error);
        return;
    }

    const container =
        document.getElementById(
            "personalNotesContainer"
        );

    if(!data || data.length === 0){

        container.innerHTML =
        "<p>Brak notatek.</p>";

        return;

    }

    container.innerHTML =
    data.map(note => `
        <div class="note-card">
            <h4 class="note-card-title">${escapeHtml(note.title || "Bez tytułu")}</h4>
            <textarea>${escapeHtml(note.content)}</textarea>
            <span class="note-card-badge ${note.is_public ? 'public' : 'private'}">
            ${note.is_public ? 'Publiczna' : 'Prywatna'}
            </span>
        <div class="note-card-actions">
            <button class="toggle-note-vis" data-id="${note.id}" data-public="${note.is_public}">
            ${note.is_public ? 'Ukryj' : 'Upublicznij'}
            </button>
            <button class="delete-note" data-id="${note.id}">Usuń</button>
        </div></div>
    `).join("");

}

document.addEventListener("click", async (e) => {

    if(
        !e.target.classList.contains(
            "saveNoteBtn"
        )
    ){
        return;
    }

    const card = e.target.parentElement;

    const titleInput =
    card.querySelector(".noteTitleInput");

    const textarea =
    card.querySelector("textarea");

    const title =
    titleInput ? titleInput.value.trim() : "";

    const content =
    textarea.value.trim();
    const publicInput = card.querySelector(".notePublicInput");
const isPublic = publicInput ? publicInput.checked : false;
// ...
is_public: isPublic   // zamiast is_public: false

    if(!content){
        alert("Wpisz treść notatki");
        return;
    }

    const {
        data:{user}
    } = await supabaseClient.auth.getUser();

    if(!user){
        alert("Zaloguj się");
        return;
    }

    const { error } =
    await supabaseClient
    .from("notes")
    .insert({
        user_id: user.id,
        video_id: videoId,
        title: title || "Notatka do filmu",
        content: content,
        is_public: isPublic
    });

    if(error){

        console.error(error);
        alert(error.message);
        return;

    }

    alert("Notatka zapisana");

    const id = card.dataset.id;

    loadPersonalNotes();

});

/* ============================================================
   WŁASNE QUIZY
   (tworzenie quizu odbywa się w folderze "kreator quizow" / quiz.html;
   tutaj tylko wyświetlamy i usuwamy)
   ============================================================ */

async function loadUserQuizy(){

    const container =
    document.getElementById("personalQuizyContainer");

    const {
        data:{user}
    } = await supabaseClient.auth.getUser();

    if(!user){
        container.innerHTML = "<p>Zaloguj się, aby zobaczyć swoje quizy.</p>";
        return;
    }

    const { data, error } =
    await supabaseClient
    .from('quizzes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending:false });

    if(error){
        console.error(error);
        container.innerHTML = "<p>Nie udało się wczytać quizów.</p>";
        return;
    }

    if(!data || data.length === 0){
        container.innerHTML = "<p>Brak quizów.</p>";
        return;
    }

    container.innerHTML =
    data.map(quiz => {

        const count =
        Array.isArray(quiz.questions) ? quiz.questions.length : 0;

        const badge =
        quiz.is_public ? "Publiczny" : "Prywatny";

        return `
            <div class="quiz-card" data-id="${quiz.id}">
                <div class="quiz-card-info">
                    <h4><span class="quiz-badge">${badge}</span>${escapeHtml(quiz.title)}</h4>
                    <p>${count} ${count === 1 ? 'pytanie' : 'pytań'}</p>
                </div>
                <div class="quiz-card-actions">
                    <button class="deleteQuizBtn" data-id="${quiz.id}">Usuń</button>
                </div>
            </div>
            <button class="toggle-quiz-vis" data-id="${quiz.id}" data-public="${quiz.is_public}">
            ${quiz.is_public ? 'Ukryj' : 'Upublicznij'}
            </button>
        `;
    }).join("");

    container.querySelectorAll(".deleteQuizBtn").forEach(btn => {
        btn.addEventListener("click", () => deleteUserQuiz(btn.dataset.id));
    });
}

async function deleteUserQuiz(id){

    if(!confirm("Na pewno usunąć ten quiz?")) return;

    const { error } =
    await supabaseClient
    .from("quizzes")
    .delete()
    .eq("id", id);

    if(error){
        alert("Nie udało się usunąć quizu.");
        return;
    }

    loadUserQuizy();
}

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("toggle-note-vis")) {
        return;
    }

    const noteId = e.target.dataset.id;

    const currentState =
        e.target.dataset.public === "true";

    const { error } =
        await supabaseClient
        .from("notes")
        .update({
            is_public: !currentState
        })
        .eq("id", noteId);

    if (error) {
        console.error(error);
        alert("Nie udało się zmienić widoczności.");
        return;
    }

    loadPersonalNotes();
});

async function saveMaterial() {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {
        alert("Zaloguj się");
        return;
    }

    const { error } =
        await supabaseClient
            .from("saved_materials")
            .insert({
                user_id: user.id,
                video_id: videoId
            });

if (error) {

    if (error.code === "23505") {
        alert("Ten materiał jest już zapisany.");
        return;
    }

    console.error(error);
    alert(error.message);
    return;
}

    alert("Materiał zapisany!");
}

function reportError(){

    window.location.href =
    "../zglaszanie bledow/blad.html";

}