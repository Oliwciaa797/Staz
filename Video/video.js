const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);



console.log("video.js loaded");

const API_KEY = "AIzaSyCTX8K53tIFW1_vUY828xfjYkvuGygnX_w";

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
//const videoId = new URLSearchParams(window.location.search).get('video');

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

    //const audio =
   // new Audio('happy.mp3');

   // audio.play();

}


// Load and display reviews
async function loadReviews() {

    const sort =
        document.getElementById("sortReviews")?.value || "newest";

    let query =
        supabaseClient
        .from("video_reviews")
        .select(`*`)
        .eq("video_id", videoId);

    switch(sort){

        case "oldest":
            query = query.order("created_at", {
                ascending: true
            });
            break;

        case "highest":
            query = query.order("rating", {
                ascending: false
            });
            break;

        case "lowest":
            query = query.order("rating", {
                ascending: true
            });
            break;

        default:
            query = query.order("created_at", {
                ascending: false
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

    container.innerHTML = reviews.map(review => `

<div class="review-item">

    <div class="review-header">

        <div class="review-user">

            <img
                src="${review.profiles?.avatar_url || '../Profil/avatar.png'}"
                class="review-avatar"
            >

            <div>

                <strong>
                    ${review.profiles?.profiles || "Użytkownik"}
                </strong>

                <div class="review-date">
                    ${formatDate(review.created_at)}
                </div>

            </div>

        </div>

        <div class="review-rating">
            ${"⭐".repeat(review.rating)}
        </div>

    </div>

    <div class="review-text">
        ${review.comment || ""}
    </div>

</div>

`).join("");
}

// Load reviews when page loads
document.addEventListener('DOMContentLoaded', loadReviews);

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
        alert("Wybierz ocenę");
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

    <div class="user-area">

    <div class="user-info" id="userInfo">

        <img src="${avatarUrl}" class="avatar">

        <span>Witaj, ${profile.profiles}</span>

    </div>

    <div class="user-menu" id="userMenu">

        <a href="../Profil/prof.html">
            Profil
        </a>

        <a href="../wylogowywanie/logout.html">
            Wyloguj się
        </a>

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
        `;
    } else {
        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../logowanie/log.html">Logowanie</a>
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

function createPersonalNote() {

    const container =
        document.getElementById("personalNotesContainer");

    const emptyText =
        container.querySelector("p");

    if(emptyText){
        emptyText.remove();
    }


    const div = document.createElement("div");

    div.className = "note-card new-note";

    div.innerHTML = `

        <textarea 
            placeholder="Napisz swoją notatkę..."
            class="note-textarea"
        ></textarea>

        <div class="note-buttons">

            <button onclick="saveNewNote(this)">
                Zapisz
            </button>

            <button onclick="cancelNewNote(this)">
                Anuluj
            </button>

        </div>

    `;


    container.prepend(div);

}

function cancelNewNote(button){

    const note =
        button.closest(".note-card");

    note.remove();


    const container =
        document.getElementById("personalNotesContainer");


    if(container.children.length === 0){

        container.innerHTML =
        "<p>Brak notatek.</p>";

    }

}

async function saveNewNote(button){

    const note =
        button.closest(".note-card");


    const textarea =
        note.querySelector("textarea");


    const content =
        textarea.value.trim();


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


    const {error} =
    await supabaseClient
    .from("notes")
    .insert({

        user_id:user.id,
        video_id:videoId,
        title:"Notatka do filmu",
        content:content,
        is_public:false

    });


    if(error){

        console.error(error);
        alert(error.message);
        return;

    }


    loadPersonalNotes();

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
.from("notes")
.select("*")
.eq("user_id", user.id)
.eq("video_id", videoId)
.order("created_at", { ascending: false });

    if(error){
        console.error(error);
        return;
    }

    const container =
        document.getElementById(
            "personalNotesContainer"
        );

    if(data.length === 0){

        container.innerHTML =
        "<p>Brak notatek.</p>";

        return;

    }

    container.innerHTML =
data.map(note => `

<div class="note-card">

    <textarea 
        class="note-textarea"
        disabled
    >${note.content}</textarea>


    <div class="note-buttons">

        <button onclick="editNote(this)">
            Edytuj
        </button>

    </div>


</div>

`).join("");

}

function editNote(button){

    const card =
        button.closest(".note-card");


    const textarea =
        card.querySelector("textarea");


    textarea.disabled = false;

    textarea.focus();


    button.parentElement.innerHTML = `

        <button onclick="updateNote(this)">
            Zapisz
        </button>


        <button onclick="loadPersonalNotes()">
            Anuluj
        </button>

    `;

}

async function updateNote(button){

    const card =
        button.closest(".note-card");


    const textarea =
        card.querySelector("textarea");


    const content =
        textarea.value.trim();


    const {
        data:{user}
    } = await supabaseClient.auth.getUser();


    const {error} =
    await supabaseClient
    .from("notes")
    .update({
        content:content
    })
    .eq("user_id",user.id)
    .eq("video_id",videoId)
    .eq("content",textarea.defaultValue);


    if(error){

        console.error(error);
        alert(error.message);
        return;

    }


    loadPersonalNotes();

}

document.addEventListener("click", async (e) => {

    if(
        !e.target.classList.contains(
            "saveNoteBtn"
        )
    ){
        return;
    }

    const textarea =
    e.target.parentElement
    .querySelector("textarea");

    const content =
    textarea.value.trim();

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
    title: "Notatka do filmu",
    content: content,
    is_public: false
});

    if(error){

        console.error(error);
        alert(error.message);
        return;

    }

    alert("Notatka zapisana");

    loadPersonalNotes();

});