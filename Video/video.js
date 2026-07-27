const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);



console.log("video.js loaded");



/* ---------- Pomocnicze: bezpieczne wstawianie tekstu do HTML ---------- */
function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
}
function escapeAttr(str){
    return escapeHtml(str).replace(/"/g, '&quot;');
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
    console.log("generateNotes() called");

    const notes = document.getElementById("notesContent");
    notes.innerHTML = "Generowanie notatek...";

    if (!videoId) {
        notes.innerHTML = "Brak ID wideo.";
        return;
    }

    try {

        const response = await fetch("http://127.0.0.1:5000/study", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`
            })
        });

        console.log("Status:", response.status);

        const data = await response.json();
        console.log(data);

        if (!response.ok) {
            notes.textContent = data.error || "Błąd serwera.";
            return;
        }

        notes.innerHTML = data.notes;

    } catch (error) {
        console.error(error);
        notes.textContent = "Nie udało się połączyć z backendem.";
    }
}

let currentQuiz = [];

async function generateQuiz() {

    const response = await fetch("http://127.0.0.1:5000/quiz", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            url:`https://www.youtube.com/watch?v=${videoId}`
        })
    });

    const data = await response.json();

    currentQuiz = data.quiz.questions;
    console.log(Array.isArray(data.quiz.questions));
    displayQuiz(currentQuiz);
}
function displayQuiz(quiz) {

    const container = document.getElementById("quiz");

    container.innerHTML = "";

    quiz.forEach((q, index) => {

        const div = document.createElement("div");

        div.innerHTML = `
            <h3>${index + 1}. ${q.question}</h3>

            ${q.answers.map((a, i) => `
                <label>
                    <input
                        type="radio"
                        name="q${index}"
                        value="${i}">
                    ${a}
                </label><br>
            `).join("")}

            <hr>
        `;

        container.appendChild(div);
    });

    // Add the submit button AFTER all questions
    const button = document.createElement("button");
    button.textContent = "Submit Quiz";
    button.onclick = checkQuiz;

    container.appendChild(button);
}

function checkQuiz() {

    let score = 0;

    currentQuiz.forEach((q, index) => {

        const selected = document.querySelector(
            `input[name="q${index}"]:checked`
        );

        if (selected && parseInt(selected.value) === q.correct) {
            score++;
        }
    });

    alert(`Your score: ${score}/${currentQuiz.length}`);
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

document.addEventListener("DOMContentLoaded", () => {
    loadVideoDescription();
});
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

        const myReview = user && review.user_id === user.id;
        return `
                <div class="review-item ${myReview ? 'my-review' : ''}">

                <div class="review-header">

                    <div class="review-user">
                        ${escapeHtml(review.profiles?.profiles || "Użytkownik")}
                        ${myReview ? '<span class="badge">Twoja opinia</span>' : ''}
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
        errorMsg.textContent = "Wybierz ocenę.";
        return;
    }

    const { data: existingReview } = await supabaseClient
        .from("video_reviews")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingReview) {
        alert("Dodałeś już opinię do tego filmu.");
        return;
    }


    const { data: existing, error: checkError } =
    await supabaseClient
        .from("video_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();

    if(checkError){
        console.error(checkError);
        return;
    }

    let result;

    if(existing){

        result = await supabaseClient
            .from("video_reviews")
            .update({
                rating: userRating,
                comment: reviewText
            })
            .eq("id", existing.id);

    }else{

        result = await supabaseClient
            .from("video_reviews")
            .insert({
                video_id: videoId,
                user_id: user.id,
                rating: userRating,
                comment: reviewText
            });

    }

    if(result.error){
        console.error(result.error);
        alert(result.error.message);
        return;
    }

    alert(
        existing
        ? "Opinia zaktualizowana!"
        : "Opinia dodana!"
    );

    loadReviews();
    loadMyReview();
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
    loadAllNoteLists();
    loadMyReview();
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
   WŁASNE NOTATKI (3 listy: do tego filmu / pozostałe / publiczne)
   ============================================================ */
let noteQuill = null;

function createPersonalNote() {

    const container = document.getElementById("personalNotesContainer");

    const emptyText = container.querySelector("p");
    if(emptyText){
        emptyText.remove();
    }

    const div = document.createElement("div");
    div.className = "note-form-card";

    div.innerHTML = `
        <input 
            type="text" 
            class="noteTitleInput" 
            placeholder="Tytuł notatki"
        >

        <div class="quill-container"></div>

        <div class="visibility-toggle">
            <input 
                type="checkbox" 
                class="notePublicInput"
            >

            <label>
                Notatka publiczna (widoczna dla innych)
            </label>
        </div>

        <button 
            type="button" 
            class="saveNoteBtn">
            Zapisz
        </button>
    `;


    container.prepend(div);


    const editor =
    div.querySelector(".quill-container");


    noteQuill = new Quill(editor,{

        theme:"snow",

        modules:{
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                [
                    { list: "ordered" },
                    { list: "bullet" }
                ],
                ["link"],
                ["clean"]
            ]
        }

    });

}
function timeAgo(date){

    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    const intervals = {
        rok: 31536000, miesiąc: 2592000, dzień: 86400, godzina: 3600, minuta: 60
    };

    if(seconds < 60) return "przed chwilą";
    if(seconds < intervals.godzina) return `${Math.floor(seconds / intervals.minuta)} min temu`;
    if(seconds < intervals.dzień) return `${Math.floor(seconds / intervals.godzina)} godz. temu`;
    if(seconds < intervals.miesiąc) return `${Math.floor(seconds / intervals.dzień)} dni temu`;
    if(seconds < intervals.rok) return `${Math.floor(seconds / intervals.miesiąc)} mies. temu`;
    return `${Math.floor(seconds / intervals.rok)} lat temu`;
}

/* ---------- Renderowanie pojedynczej karty notatki ---------- */
function renderNoteCard(note, { editable, showAuthor }){

    const div = document.createElement('div');
    div.className = 'item-card';
    div.dataset.id = note.id;
    div._note = note; // potrzebne do trybu edycji

    const badge = note.is_public
        ? '<span class="badge public">Publiczna</span>'
        : '<span class="badge private">Prywatna</span>';

    const footerLeft = showAuthor
        ? escapeHtml(note.profiles?.profiles || "Użytkownik")
        : timeAgo(note.created_at);

    div.innerHTML = `
        ${badge}
        <h3 class="note-title-view">${escapeHtml(note.title || "Bez tytułu")}</h3>
        <div class="note-content-view">
            ${note.content || ""}
        </div>
        <button type="button" class="go-btn big-btn show-note-btn">Pokaż notatkę</button>
        <div class="card-footer">
            <span>${footerLeft}</span>
            ${editable ? `
            <div class="card-actions">
                <button type="button" class="edit" data-id="${note.id}">Edytuj</button>
                <button type="button" class="toggle-vis" data-id="${note.id}" data-public="${note.is_public}">
                    ${note.is_public ? 'Ukryj' : 'Upublicznij'}
                </button>
                <button type="button" class="delete" data-id="${note.id}">Usuń</button>
            </div>` : ''}
        </div>
    `;

    return div;
}

/* ---------- Tryb edycji karty ---------- */
function enterNoteEditMode(card, note){

    card.innerHTML = `
        <div class="field">
            <label>Tytuł</label>
            <input 
                type="text" 
                class="edit-title" 
                value="${escapeAttr(note.title || "")}"
            >
        </div>

        <div class="field">
            <label>Treść</label>
            <div class="edit-quill"></div>
        </div>

        <div class="card-footer">
            <div class="card-actions">
                <button type="button" class="save-edit">
                    Zapisz zmiany
                </button>

                <button type="button" class="cancel-edit">
                    Anuluj
                </button>
            </div>
        </div>
    `;


    const editQuill = new Quill(
        card.querySelector(".edit-quill"),
        {
            theme:"snow",
                modules:{
                    toolbar:[
                        [{ header:[1,2,3,false] }],
                        ["bold","italic","underline"],
                        [
                            { list:"ordered" },
                            { list:"bullet" }
                        ],
                        ["link"],
                        ["clean"]
                    ]
                }
            }
    );


    // wczytanie starej treści
    editQuill.root.innerHTML = note.content || "";


    card.querySelector(".cancel-edit")
    .addEventListener("click",()=>{
        loadAllNoteLists();
    });


    card.querySelector(".save-edit")
    .addEventListener("click",async()=>{


        const newTitle =
        card.querySelector(".edit-title")
        .value.trim();


        const newContent =
        editQuill.root.innerHTML;


        const plainText =
        editQuill.getText().trim();



        if(!plainText){
            alert("Treść notatki nie może być pusta.");
            return;
        }



        const {error}=await supabaseClient
        .from("notes")
        .update({
            title:newTitle || "Notatka do filmu",
            content:newContent
        })
        .eq("id",note.id);



        if(error){
            alert(
                "Nie udało się zapisać zmian: "
                + error.message
            );
            return;
        }


        loadAllNoteLists();

    });

}
/* ---------- Wczytywanie 3 list ---------- */
async function loadPersonalNotes(){

    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById("personalNotesContainer");

    if(!user){
        container.innerHTML = "<p>Zaloguj się, aby zobaczyć swoje notatki.</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

    if(error){
        console.error(error);
        container.innerHTML = "<p>Nie udało się wczytać notatek.</p>";
        return;
    }

    container.innerHTML = "";

    if(!data || data.length === 0){
        container.innerHTML = "<p>Brak notatek.</p>";
        return;
    }

    data.forEach(note => container.appendChild(renderNoteCard(note, { editable: true, showAuthor: false })));
}

async function loadMyOtherNotes(){

    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById("myOtherNotesContainer");
    if(!container) return;

    if(!user){
        container.innerHTML = "<p>Zaloguj się, aby zobaczyć swoje notatki.</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .neq('video_id', videoId)
        .order('created_at', { ascending: false });

    if(error){
        console.error(error);
        container.innerHTML = "<p>Nie udało się wczytać notatek.</p>";
        return;
    }

    container.innerHTML = "";

    if(!data || data.length === 0){
        container.innerHTML = "<p>Brak innych notatek.</p>";
        return;
    }

    data.forEach(note => container.appendChild(renderNoteCard(note, { editable: true, showAuthor: false })));
}

async function loadPublicVideoNotes(){

    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById("publicVideoNotesContainer");
    if(!container) return;

    const { data, error } = await supabaseClient
        .from('notes')
        .select(`
            *,
            profiles!user_id ( profiles, avatar_url )
        `)
        .eq('video_id', videoId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if(error){
        console.error(error);
        container.innerHTML = "<p>Nie udało się wczytać notatek publicznych.</p>";
        return;
    }

    const filtered = user ? (data || []).filter(n => n.user_id !== user.id) : (data || []);

    container.innerHTML = "";

    if(filtered.length === 0){
        container.innerHTML = "<p>Brak notatek publicznych.</p>";
        return;
    }

    filtered.forEach(note => container.appendChild(renderNoteCard(note, { editable: false, showAuthor: true })));
}

async function loadAllNoteLists(){
    await loadPersonalNotes();
    await loadMyOtherNotes();
    await loadPublicVideoNotes();
}

async function deletePersonalNote(id){

    if(!confirm("Na pewno usunąć tę notatkę?")) return;

    const { error } = await supabaseClient.from("notes").delete().eq("id", id);

    if(error){
        console.error(error);
        alert("Nie udało się usunąć notatki.");
        return;
    }

    loadAllNoteLists();
}

async function togglePersonalNoteVisibility(id, currentlyPublic){

    const { error } = await supabaseClient
        .from("notes")
        .update({ is_public: !currentlyPublic })
        .eq("id", id);

    if(error){
        console.error(error);
        alert("Nie udało się zmienić widoczności.");
        return;
    }

    loadAllNoteLists();
}

/* ---------- JEDEN globalny listener na wszystkie akcje kart notatek ---------- */
document.addEventListener("click", async (e) => {

    // Zapis nowej notatki
    if(e.target.classList.contains("saveNoteBtn")){

        const card = e.target.parentElement;
        const titleInput = card.querySelector(".noteTitleInput");

        const title = titleInput 
            ? titleInput.value.trim() 
            : "";


        const content =
        noteQuill.root.innerHTML;


        const plainText =
        noteQuill.getText().trim();
        const publicInput = card.querySelector(".notePublicInput");
        const isPublic = publicInput ? publicInput.checked : false;

        if(!plainText){
            alert("Wpisz treść notatki");
            return;
        }

        const { data: { user } } = await supabaseClient.auth.getUser();

        if(!user){
            alert("Zaloguj się");
            return;
        }

        const { error } = await supabaseClient.from("notes").insert({
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

        card.remove();
        loadAllNoteLists();
        return;
    }

    // Reszta akcji dotyczy karty .item-card
    const card = e.target.closest(".item-card");
    if(!card) return;

    if(e.target.classList.contains("show-note-btn")){
        const content = card.querySelector(".note-content-view");
        if(content){
            content.classList.toggle("expanded");
            e.target.textContent = content.classList.contains("expanded")
                ? "Ukryj notatkę"
                : "Pokaż notatkę";
        }
        return;
    }

    if(e.target.classList.contains("delete")){
        deletePersonalNote(e.target.dataset.id);
        return;
    }

    if(e.target.classList.contains("toggle-vis")){
        togglePersonalNoteVisibility(e.target.dataset.id, e.target.dataset.public === "true");
        return;
    }

    if(e.target.classList.contains("edit")){
        enterNoteEditMode(card, card._note);
        return;
    }

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
            <div class="item-card" data-id="${quiz.id}">
                <span class="badge ${quiz.is_public ? 'public' : 'private'}">${badge}</span>
                <h3>${escapeHtml(quiz.title)}</h3>
                <p>${count} ${count === 1 ? 'pytanie' : 'pytań'}</p>
                <button class="go-btn big-btn" onclick="openQuiz('${quiz.id}')">Rozwiąż quiz</button>
                <div class="card-footer">
                    <div class="card-actions">
                        <button class="toggle-quiz-vis" data-id="${quiz.id}" data-public="${quiz.is_public}">
                            ${quiz.is_public ? 'Ukryj' : 'Upublicznij'}
                        </button>
                        <button class="deleteQuizBtn" data-id="${quiz.id}">Usuń</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    container.querySelectorAll(".deleteQuizBtn").forEach(btn => {
        btn.addEventListener("click", () => deleteUserQuiz(btn.dataset.id));
    });

    container.querySelectorAll(".toggle-quiz-vis").forEach(btn => {
        btn.addEventListener("click", () => toggleQuizVisibility(btn.dataset.id, btn.dataset.public === "true"));
    });
}

async function toggleQuizVisibility(id, currentlyPublic){

    const { error } =
    await supabaseClient
    .from("quizzes")
    .update({
        is_public: !currentlyPublic
    })
    .eq("id", id);

    if(error){
        console.error(error);
        alert("Nie udało się zmienić widoczności quizu.");
        return;
    }

    loadUserQuizy();
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

document.addEventListener("DOMContentLoaded", () => {

    const drawer =
        document.getElementById("materialsDrawer");

    const drawerToggle =
        document.getElementById("drawerToggle");

    drawerToggle.addEventListener("click", () => {

        drawer.classList.toggle("open");

        if(drawer.classList.contains("open")){
            drawerToggle.innerHTML = ">";
        }
        else{
            drawerToggle.innerHTML = "<";
        }

    });

});
function showDrawerTab(event, tabId){

    document
        .querySelectorAll(".drawer-tab")
        .forEach(btn => btn.classList.remove("active"));

    document
        .querySelectorAll(".drawer-panel")
        .forEach(panel => panel.classList.remove("active"));

    event.currentTarget.classList.add("active");

    document
        .getElementById(tabId)
        .classList.add("active");

    if(tabId === "drawerQuizy"){
        loadUserQuizy();
    }
}
// Limit znaków notatki. Backend (Supabase) ma dodatkowy twardy limit
// 100 000 znaków na kolumnie notes.content — patrz migracja.sql.
const NOTE_CHAR_LIMIT = 100000;
 
/* ---------- Licznik znaków + blokada przekroczenia limitu ---------- */
function attachNoteCounter(quill, counterEl, saveBtn){
 
    function update(){
 
        // Quill.getLength() liczy dodatkowy znak nowej linii na końcu
        const length = quill.getLength() - 1;
 
        if(length > NOTE_CHAR_LIMIT){
            quill.deleteText(NOTE_CHAR_LIMIT, length - NOTE_CHAR_LIMIT);
            return; // deleteText wywoła kolejny text-change, update() odpali się ponownie
        }
 
        counterEl.textContent = `${length} / ${NOTE_CHAR_LIMIT} znaków`;
        counterEl.classList.toggle("limit-reached", length >= NOTE_CHAR_LIMIT);
 
        if(saveBtn){
            saveBtn.classList.remove("saved");
            if(saveBtn.dataset.defaultLabel){
                saveBtn.textContent = saveBtn.dataset.defaultLabel;
            }
        }
    }
 
    quill.on("text-change", update);
    update();
}
 
/* ---------- Wizualne potwierdzenie zapisu na przycisku ---------- */
function markSaved(btn, label){
 
    if(!btn) return;
 
    if(!btn.dataset.defaultLabel){
        btn.dataset.defaultLabel = btn.textContent;
    }
 
    btn.classList.add("saved");
    btn.textContent = label || "✓ Zapisano";
}

async function loadMyReview() {

    const { data:{user} } =
    await supabaseClient.auth.getUser();

    if(!user) return;

    const { data } =
    await supabaseClient
    .from("video_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("video_id", videoId)
    .maybeSingle();

    if(!data) return;

    userRating = data.rating;

    document.getElementById("reviewText").value =
        data.comment || "";

    setRating(data.rating);

    document.getElementById("submitReviewBtn")
        .textContent = "Aktualizuj opinię";

    document.getElementById("deleteReviewBtn")
        .style.display = "inline-block";
}

async function deleteMyReview(){

    const {
        data:{user}
    } = await supabaseClient.auth.getUser();

    if(!user) return;

    const confirmDelete =
    confirm("Usunąć opinię?");

    if(!confirmDelete) return;

    const { error } =
    await supabaseClient
    .from("video_reviews")
    .delete()
    .eq("user_id", user.id)
    .eq("video_id", videoId);

    if(error){
        alert(error.message);
        return;
    }

    document.getElementById("reviewText").value = "";

    document
        .getElementById("deleteReviewBtn")
        .style.display = "none";

    document
        .getElementById("submitReviewBtn")
        .textContent = "Prześlij opinię";

    userRating = 0;

    document
        .querySelectorAll(".star")
        .forEach(star =>
            star.classList.remove("active")
        );

    loadReviews();
}