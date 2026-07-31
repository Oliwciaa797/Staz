const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);



console.log("video.js loaded");

const MAX_NOTE_CHARS = 100000;


/* ---------- Pomocnicze: bezpieczne wstawianie tekstu do HTML ---------- */
function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
}
function escapeAttr(str){
    return escapeHtml(str).replace(/"/g, '&quot;');
}

function goToLogin() {
    window.location.href = "../logowanie/log.html";
}

const params = new URLSearchParams(window.location.search);
const videoId = params.get("video");
const player = document.getElementById("youtubeVideo");

if (videoId) {
    console.log("Video ID:", videoId);
    if (player && videoId) {
        player.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
    }

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

        const response = await fetch("https://wiseup-za92.onrender.com/study", {
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

    const quizContainer = document.getElementById("quiz");

    try {

        const response = await fetch("https://wiseup-za92.onrender.com/quiz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`
            })
        });

        if (!response.ok) {
            toast.show('error', 'Error', "Nie udało się wygenerować quizu.");
            return;
        }

        const data = await response.json();

        // Backend może zwrócić pytania pod różnymi kluczami - obsłuż oba warianty
        currentQuiz = data.questions || data.quiz || [];

        if (!currentQuiz.length) {
            toast.show('error', 'Error', "Backend nie zwrócił żadnych pytań.");
            return;
        }

        displayQuiz(currentQuiz);

    } catch (error) {
        console.error(error);
        toast.show('error', 'Error', "Nie udało się połączyć z backendem.");
    }
}


function displayQuiz(questions) {

    const container = document.getElementById("quiz");

    container.innerHTML = "";

    questions.forEach((q, index) => {

        const div = document.createElement("div");

        div.innerHTML = `
            <h3>${index + 1}. ${escapeHtml(q.question)}</h3>

            ${q.answers.map((a, i) => `
                <label>
                    <input
                        type="radio"
                        name="q${index}"
                        value="${i}">
                    ${escapeHtml(a)}
                </label><br>
            `).join("")}

            <hr>
        `;

        container.appendChild(div);
    });

    const button = document.createElement("button");
    button.id = "submitQuiz";
    button.textContent = "Sprawdź Quiz";
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

    const button = document.getElementById("submitQuiz");

    const result = document.createElement("h2");
    result.style.textAlign = 'center';
    result.style.color = '#33411C';
    result.textContent = `Twój wynik: ${score}/${currentQuiz.length}`;

    button.replaceWith(result);
}

/* ---------- Przełączanie głównych zakładek (Notatki AI / Quiz) ---------- */
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

let userRating = 0;

// Ustawienie oceny gwiazdkowej
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

    // Potrzebne, żeby oznaczyć własną recenzję (badge "Twoja opinia")
    const { data: { user } } = await supabaseClient.auth.getUser();

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

        const myReview = !!(user && review.user_id === user.id);

        return `
                <div class="review-item ${myReview ? 'my-review' : ''}">

                <div class="review-header">

                    <div class="review-user">
                        ${escapeHtml(review.profiles?.profiles || "Użytkownik")}
                        ${myReview ? '<span class="badge">Twoja opinia</span> <button type="button" class="edit-review-link" onclick="editMyReview()">Edytuj</button>' : ''}
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

const toast = new Toast();
// Wczytaj recenzje po załadowaniu strony
document.addEventListener('DOMContentLoaded', loadReviews);
let errorMsg = document.getElementById('errorMsg');

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

    noteQuill = new Quill("#editor", {
        theme: "snow",
        modules: {
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

    const counter =
        document.getElementById("charCounter");

    function updateCounter() {

        const length =
            Math.max(
                0,
                noteQuill.getLength() - 1
            );

        counter.textContent =
            `${length} / ${MAX_NOTE_CHARS} znaków`;

        counter.classList.toggle(
            "limit-reached",
            length >= MAX_NOTE_CHARS
        );
    }

    noteQuill.on(
        "text-change",
        updateCounter
    );

    updateCounter();

    showUser();
    updateSidebar();
    loadAllNoteLists();
    loadAllQuizLists();
    checkSavedMaterial();
    loadMyReview();

    const noteForm =
        document.getElementById("noteForm");

    if (noteForm) {
        noteForm.addEventListener(
            "submit",
            saveNoteForm
        );
    }

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
let noteQuill;

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
console.log(note);
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
            <div class="char-counter">
                <span class="currentChars">0</span> / 100000 znaków
            </div>

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

    const counter = card.querySelector(".char-counter");
    const current = card.querySelector(".currentChars");

    function updateCounter(){

        const length = Math.max(0, editQuill.getLength() - 1);

        current.textContent = length;

        counter.classList.toggle(
            "limit-reached",
            length >= MAX_NOTE_CHARS
        );
    }

editQuill.on("text-change", updateCounter);

updateCounter();



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
        const length = Math.max(0, editQuill.getLength() - 1);

        if (length > MAX_NOTE_CHARS) {
            toast.show('error','Błąd',"Notatka może mieć maksymalnie 100000 znaków.");
            return;
        }




        if(!plainText){
            toast.show('error', 'Błąd', 'Treść notatki nie może być pusta!');
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
            toast.show(
                'error',
                'Error',
                'Nie udało się zapisać zmian: '
                + error.message
            );
            return;
        }


        loadAllNoteLists();

    });

}

async function saveNoteForm(e){

    e.preventDefault();

    const title =
        document
        .getElementById("noteTitle")
        .value
        .trim();

    const isPublic =
        document
        .getElementById("notePublic")
        .checked;

    const content =
        noteQuill.root.innerHTML;

    const plainText =
        noteQuill.getText().trim();

    const length =
        Math.max(
            0,
            noteQuill.getLength() - 1
        );

    if(length > MAX_NOTE_CHARS){

        toast.show(
            'error',
            'Błąd',
            'Notatka może mieć maksymalnie 100000 znaków.'
        );

        return;
    }

    if(!plainText){

        toast.show(
            'error',
            'Błąd',
            'Wpisz treść notatki.'
        );

        return;
    }

    const {
        data:{user}
    } =
    await supabaseClient.auth.getUser();

    if(!user){

        toast.show(
            'error',
            'Zaloguj się',
            'Zaloguj się aby stworzyć notatkę.'
        );

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

        toast.show(
            'error',
            'Błąd',
            error.message
        );

        return;
    }

    toast.show(
        'success',
        'Gotowe!',
        'Notatka została zapisana.'
    );

    document.getElementById("noteTitle").value = "";
    document.getElementById("notePublic").checked = false;

    noteQuill.setContents([]);

    loadAllNoteLists();
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

    const loading =
document.getElementById(
    "personalNotesLoading"
);

if(loading){
    loading.style.display = "none";
}

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
        .select('*')
        .eq('video_id', videoId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if(error){
        console.error(error);
        container.innerHTML = "<p>Nie udało się wczytać notatek publicznych.</p>";
        return;
    }

    let filtered = user ? (data || []).filter(n => n.user_id !== user.id) : (data || []);

    filtered = await attachAuthorProfiles(filtered);

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
        toast.show('error', 'Błąd', "Nie udało się usunąć notatki.");
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
        toast.show('error','Błąd',"Nie udało się zmienić widoczności.");
        return;
    }

    loadAllNoteLists();
}

/* ---------- JEDEN globalny listener na wszystkie akcje kart notatek ---------- */
document.addEventListener("click", async (e) => {


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

    if(e.target.classList.contains("open-quiz-btn")){
        openQuiz(e.target.dataset.id);
        return;
    }

    if(e.target.classList.contains("toggle-quiz-vis")){
        toggleQuizVisibility(e.target.dataset.id, e.target.dataset.public === "true");
        return;
    }

    if(e.target.classList.contains("deleteQuizBtn")){
        deleteUserQuiz(e.target.dataset.id);
        return;
    }

});

/* ============================================================
   WŁASNE QUIZY
   (tworzenie quizu odbywa się w folderze "kreator quizow" / quiz.html;
   tutaj tylko wyświetlamy i usuwamy)
   ============================================================ */

/* ---------- Renderowanie pojedynczej karty quizu (analogicznie do notatek) ---------- */
function renderQuizCard(quiz, { editable, showAuthor }){

    const div = document.createElement('div');
    div.className = 'item-card';
    div.dataset.id = quiz.id;

    const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;

    const badge = quiz.is_public
        ? '<span class="badge public">Publiczny</span>'
        : '<span class="badge private">Prywatny</span>';

    const footerLeft = showAuthor
        ? escapeHtml(quiz.profiles?.profiles || "Użytkownik")
        : timeAgo(quiz.created_at);

    div.innerHTML = `
        ${badge}
        <h3>${escapeHtml(quiz.title || "Bez tytułu")}</h3>
        <p>${count} ${count === 1 ? 'pytanie' : 'pytań'}</p>
        <button type="button" class="go-btn big-btn open-quiz-btn" data-id="${quiz.id}">Rozwiąż quiz</button>
        <div class="card-footer">
            <span>${footerLeft}</span>
            ${editable ? `
            <div class="card-actions">
                <button type="button" class="toggle-quiz-vis" data-id="${quiz.id}" data-public="${quiz.is_public}">
                    ${quiz.is_public ? 'Ukryj' : 'Upublicznij'}
                </button>
                <button type="button" class="deleteQuizBtn" data-id="${quiz.id}">Usuń</button>
            </div>` : ''}
        </div>
    `;

    return div;
}

/* ---------- Pomocnicze: dołączenie profili autorów bez polegania na FK w bazie ---------- */
async function attachAuthorProfiles(rows){

    const authorIds = [...new Set(rows.map(r => r.user_id))];

    if(authorIds.length === 0) return rows;

    const { data: profilesData, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, profiles, avatar_url')
        .in('id', authorIds);

    if(profilesError || !profilesData){
        console.error(profilesError);
        return rows;
    }

    const profileMap = Object.fromEntries(profilesData.map(p => [p.id, p]));

    return rows.map(r => ({ ...r, profiles: profileMap[r.user_id] || null }));
}

/* ---------- Wszystkie Twoje quizy (ze wszystkich filmów) ---------- */
async function loadPersonalQuizzes(){

    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById("personalQuizyContainer");

    const quizLoading =
document.getElementById(
    "personalQuizyLoading"
);

if(quizLoading){
    quizLoading.style.display = "none";
}

    if(!user){
        container.innerHTML = "<p>Zaloguj się, aby zobaczyć swoje quizy.</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if(error){
        console.error(error);
        container.innerHTML = "<p>Nie udało się wczytać quizów.</p>";
        return;
    }

    container.innerHTML = "";

    if(!data || data.length === 0){
        container.innerHTML = "<p>Nie masz jeszcze żadnych quizów.</p>";
        return;
    }

    data.forEach(quiz => container.appendChild(renderQuizCard(quiz, { editable: true, showAuthor: false })));
}

/* ---------- Wszystkie publiczne quizy innych użytkowników ---------- */
async function loadPublicQuizzes(){

    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById("publicVideoQuizyContainer");
    if(!container) return;

    const { data, error } = await supabaseClient
        .from('quizzes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if(error){
        console.error(error);
        container.innerHTML = "<p>Nie udało się wczytać quizów publicznych.</p>";
        return;
    }

    let filtered = user ? (data || []).filter(q => q.user_id !== user.id) : (data || []);

    filtered = await attachAuthorProfiles(filtered);

    container.innerHTML = "";

    if(filtered.length === 0){
        container.innerHTML = "<p>Brak quizów publicznych innych użytkowników.</p>";
        return;
    }

    filtered.forEach(quiz => container.appendChild(renderQuizCard(quiz, { editable: false, showAuthor: true })));
}

async function loadAllQuizLists(){
    await loadPersonalQuizzes();
    await loadPublicQuizzes();
}

// Przejście do tworzenia nowego quizu, z przekazaniem ID bieżącego filmu,
// żeby kreator zapisał quiz z poprawnym video_id
function goToQuizCreator(){
    window.location.href = `../kreator quizow/quiz.html?video=${videoId}`;
}

// Przejście do rozwiązywania konkretnego quizu (kreator quizow/quiz.html musi
// odczytać ?quiz=ID z URL i wczytać pytania z tabeli "quizzes")
function openQuiz(id){
    window.location.href = `../kreator quizow/quiz.html?quiz=${id}`;
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
        toast.show('error','Błąd', "Nie udało się zmienić widoczności quizu.");
        return;
    }

    loadAllQuizLists();
}

async function deleteUserQuiz(id){

    if(!confirm("Na pewno usunąć ten quiz?")) return;

    const { error } =
    await supabaseClient
    .from("quizzes")
    .delete()
    .eq("id", id);

    if(error){
        toast.show('error', 'Błąd', "Nie udało się usunąć quizu.");
        return;
    }

    loadAllQuizLists();

}

let materialSaved = false;

/* Sprawdzenie, czy bieżący film jest już zapisany przez użytkownika
   (ustawia stan przycisku przy wczytaniu strony) */
async function checkSavedMaterial(){

    const btn = document.getElementById("saveMaterialBtn");
    if(!btn) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    if(!user){
        materialSaved = false;
        btn.classList.remove("saved");
        btn.innerHTML = "❤️ Zapisz";
        return;
    }

    const { data, error } = await supabaseClient
        .from("saved_materials")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();

    if(error){
        console.error(error);
        return;
    }

    materialSaved = !!data;
    btn.classList.toggle("saved", materialSaved);
    btn.innerHTML = materialSaved ? "❤️ Zapisano" : "❤️ Zapisz";
}

async function saveMaterial() {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {
        toast.show('error','Zaloguj się',"Zaloguj się aby zapisać materiał");
        return;
    }

    const btn = document.getElementById("saveMaterialBtn");

    // Materiał już zapisany -> usuwamy zapis i wracamy do normalnego koloru
    if(materialSaved){

        const { error } = await supabaseClient
            .from("saved_materials")
            .delete()
            .eq("user_id", user.id)
            .eq("video_id", videoId);

        if(error){
            console.error(error);
            toast.show('error','Błąd', error.message);
            return;
        }

        materialSaved = false;
        btn.classList.remove("saved");
        btn.innerHTML = "❤️ Zapisz";
        toast.show('success','Gotowe!', "Materiał usunięty z zapisanych.");
        return;
    }

    // Materiał jeszcze niezapisany -> zapisujemy i zmieniamy kolor przycisku
    const { error } =
        await supabaseClient
            .from("saved_materials")
            .insert({
                user_id: user.id,
                video_id: videoId
            });

    if (error) {

        if (error.code === "23505") {
            // Już zapisane w bazie (np. z innej karty) - dostosuj wygląd przycisku
            materialSaved = true;
            btn.classList.add("saved");
            btn.innerHTML = "❤️ Zapisano";
            toast.show('error','Błąd',"Ten materiał jest już zapisany.");
            return;
        }

        console.error(error);
        toast.show('error','Błąd',error.message);
        return;
    }

    materialSaved = true;
    btn.classList.add("saved");
    btn.innerHTML = "❤️ Zapisano";
    toast.show('success','Gotowe!', "Materiał został zapisany!");
}

function reportError(){

    window.location.href =
    "../zglaszanie bledow/blad.html";

}

async function saveWatchHistory(videoId) {
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { error } = await supabaseClient
        .from("watch_history")
        .insert({
            user_id: user.id,
            video_id: videoId
        });

    if (error) {
        console.error("Couldn't save history:", error);
    }
}

if (videoId) {
    player.src = `https://www.youtube.com/embed/${videoId}?rel=0`;

    loadReviews();
}

function showSubTab(subTabId) {

    document.querySelectorAll(".sub-tab-panel")
        .forEach(panel => panel.classList.remove("active"));

    document.querySelectorAll(".sub-tab-btn")
        .forEach(btn => btn.classList.remove("active"));

    document.getElementById(subTabId).classList.add("active");

    document
        .querySelector(`.sub-tab-btn[data-subtab="${subTabId}"]`)
        .classList.add("active");

    if (subTabId === "personalQuizy") {
        loadAllQuizLists();
    }
}

let editingReviewId = null;

async function loadMyReview(){

    const { data: { user } } = await supabaseClient.auth.getUser();
    if(!user) return;

    const { data, error } = await supabaseClient
        .from("video_reviews")
        .select("*")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();

    if(error){
        console.error(error);
        return;
    }

    const submitBtn = document.querySelector(".user-review button");

    if(data){
        editingReviewId = data.id;
        setRating(data.rating);
        document.getElementById("reviewText").value = data.comment || "";
        if(submitBtn) submitBtn.textContent = "Zapisz zmiany";
    } else {
        editingReviewId = null;
        if(submitBtn) submitBtn.textContent = "Prześlij opinię";
    }
}

async function submitReview() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        toast.show('error', 'Zaloguj się', 'Zaloguj się aby wstawić opinie');
        return;
    }

    const reviewText = document.getElementById("reviewText").value;

    if (userRating === 0) {
        errorMsg.textContent = "Wybierz ocenę.";
        return;
    }

    errorMsg.textContent = "";

    let result;

    if (editingReviewId) {

        result = await supabaseClient
            .from("video_reviews")
            .update({
                rating: userRating,
                comment: reviewText
            })
            .eq("id", editingReviewId);

    } else {

        result = await supabaseClient
            .from("video_reviews")
            .insert({
                video_id: videoId,
                user_id: user.id,
                rating: userRating,
                comment: reviewText
            });
    }

    if (result.error) {

        if (result.error.code === "23505") {
            toast.show('error', 'Błąd', "Dodałeś już opinię do tego filmu.");
            return;
        }

        console.error(result.error);
        toast.show('error', 'Error', result.error.message);
        return;
    }

    toast.show(
        'success',
        'Gotowe!',
        editingReviewId ? "Opinia zaktualizowana!" : "Opinia dodana!"
    );

    loadReviews();
    loadMyReview();
}

function editMyReview(){
    loadMyReview();
    document.querySelector(".user-review").scrollIntoView({ behavior: "smooth", block: "center" });
}