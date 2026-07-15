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

    const { data, error } =
    await supabaseClient
    .from('video_reviews')
    .select('*')
    .eq('video_id', videoId)
    .order(
        'created_at',
        { ascending:false }
    );

    if(error){
        console.error(error);
        return;
    }

    const reviews = data || [];

    const container =
    document.getElementById(
        'reviewsContainer'
    );

    if(reviews.length === 0){

        container.innerHTML =
        '<p>Brak opinii.</p>';

        return;
    }

    const averageRating =
    (
        reviews.reduce(
            (sum,r)=>
            sum+r.rating,0
        ) / reviews.length
    ).toFixed(1);

    document.querySelector(
        '.grade-avg'
    ).textContent =
    `Średnia ocena: ${averageRating}/5 ⭐`;

    document.querySelector(
        '.review-count'
    ).textContent =
    `${reviews.length} opinii`;

    container.innerHTML =
    reviews.map(review => `

        <div class="review-item">

            <div class="review-rating">
            ${'⭐'.repeat(review.rating)}
            </div>

            <div class="review-text">
            ${review.comment || ''}
            </div>

        </div>

    `).join('');
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

    const grade =
        document.getElementById("gradeSelect").value;

    const reviewText =
        document.getElementById("reviewText").value;

    if (userRating === 0) {
        alert("Wybierz ocenę");
        return;
    }

    if (!grade) {
        alert("Wybierz ocenę A-F");
        return;
    }

    const { error } =
        await supabaseClient
            .from("video_reviews")
            .insert({
                video_id: videoId,
                user_id: user.id,
                rating: userRating,
                grade: grade,
                comment: reviewText
            });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    alert("Opinia dodana!");

    document.getElementById("gradeSelect").value = "";
    document.getElementById("reviewText").value = "";

    userRating = 0;

    document
        .querySelectorAll(".rating-stars .star")
        .forEach(star => star.classList.remove("active"));

    loadReviews();
}