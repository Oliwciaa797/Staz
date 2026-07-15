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
const videoId = new URLSearchParams(window.location.search).get('video');

// Set star rating
function setRating(stars) {
    userRating = stars;
    const starElements = document.querySelectorAll('.rating-stars .star');
    starElements.forEach((star, index) => {
        if (index < stars) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Submit review
async function submitReview() {
    const grade = document.getElementById('gradeSelect').value;
    const reviewText = document.getElementById('reviewText').value;
    
    if (userRating === 0) {
        alert('Proszę wybrać ocenę');
        return;
    }
    
    if (!grade) {
        alert('Proszę wybrać ocenę (A-F)');
        return;
    }
    
    if (reviewText.trim() === '') {
        alert('Proszę napisać opinię');
        return;
    }
    
    const review = {
        videoId: videoId,
        rating: userRating,
        grade: grade,
        comment: reviewText,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage (client-side) or send to backend
    const reviews = JSON.parse(localStorage.getItem(`reviews_${videoId}`) || '[]');
    reviews.push(review);
    localStorage.setItem(`reviews_${videoId}`, JSON.stringify(reviews));
    
    alert('Dziękujemy za opinię!');
    loadReviews();
    
    // Clear form
    userRating = 0;
    document.getElementById('gradeSelect').value = '';
    document.getElementById('reviewText').value = '';
    document.querySelectorAll('.rating-stars .star').forEach(s => s.classList.remove('active'));
}

// Load and display reviews
function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem(`reviews_${videoId}`) || '[]');
    const container = document.getElementById('reviewsContainer');
    
    if (reviews.length === 0) {
        container.innerHTML = '<p>Brak opinii. Bądź pierwszy!</p>';
        return;
    }
    
    const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    const gradeCounts = {};
    
    reviews.forEach(r => {
        gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;
    });
    
    const dominantGrade = Object.keys(gradeCounts).reduce((a, b) => 
        gradeCounts[a] > gradeCounts[b] ? a : b
    );
    
    // Update summary
    document.querySelector('.grade-letter').textContent = dominantGrade;
    document.querySelector('.grade-avg').textContent = `Średnia ocena: ${averageRating}/5 ⭐`;
    document.querySelector('.review-count').textContent = `${reviews.length} opinii`;
    
    // Display reviews
    container.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span class="review-author">Użytkownik (${review.timestamp.split('T')[0]})</span>
                <span class="review-grade">${review.grade}</span>
            </div>
            <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
            <div class="review-text">${review.comment}</div>
        </div>
    `).join('');
}

// Load reviews when page loads
document.addEventListener('DOMContentLoaded', loadReviews);