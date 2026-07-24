console.log("JS is working");
class Toast {
  constructor(pos = 'tc', maxStack = 3) {
    this.maxStack = maxStack;
    this.container = document.querySelector(`.toast-container[data-position="${pos}"]`);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.dataset.position = pos;
      document.body.appendChild(this.container);
    }
  }

  show(type, title, msg, duration = 3000) {
    const activeToasts = this.container.querySelectorAll('.toast');
    if (activeToasts.length >= this.maxStack) {
        activeToasts[0].remove();
    }

    const t = document.createElement('div');
    t.className = `toast style-solid toast-${type}`;
    t.innerHTML = `
      <div class="toast-icon">${this.getIcon(type)}</div>
      <div class="toast-content"><b>${title}</b><div>${msg}</div></div>
      <button class="toast-close">&times;</button>
      `;
	  
    const animMode = 'slide';
    const baseEntry = 'slideInDown';
    
    if (animMode === 'zoom') {
        t.style.animation = 'zoomIn 0.4s forwards';
    } else if (animMode === 'shake') {
        t.style.animation = `${baseEntry} 0.4s forwards, shake 0.4s 0.4s`;
    } else {
        t.style.animation = `${baseEntry} 0.4s forwards`;
    }	  
    
    this.container.appendChild(t);

    const currentPos = this.container.dataset.position;
    let animOut = currentPos.includes('r') ? 'slideOutRight' : 'slideOutLeft';
    if(currentPos === 'tc') animOut = 'slideOutUp';
    if(currentPos === 'bc') animOut = 'slideOutDown';

    

    const dismiss = () => {
        t.style.animation = `${animOut} 0.3s forwards`;
        t.addEventListener('animationend', () => t.remove());
    };

    t.querySelector('.toast-close').onclick = dismiss;
    setTimeout(dismiss, duration);
  }

  getIcon(type) {
    const icons = {"success":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6 9 17l-5-5\"/></svg>","error":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/></svg>","warning":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><path d=\"M12 9v4\"/><path d=\"M12 17h.01\"/></svg>","info":"<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4\"/><path d=\"M12 8h.01\"/></svg>"};
    return icons[type];
  }
}

const toast = new Toast();
const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const cache = {};
const API_KEY = "AIzaSyCTX8K53tIFW1_vUY828xfjYkvuGygnX_w";

document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");


    if (searchInput) {

        searchInput.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {

                event.preventDefault();
                search();

            }
        });
    }

    if (searchBtn) {

        searchBtn.addEventListener("click", search);

    }

    const slider = document.getElementById("slider");
    const durationValue = document.getElementById("durationValue");


    if (slider && durationValue) {

        noUiSlider.create(slider, {

            start: [10, 60],

            connect: true,

            range: {
                min: 0,
                max: 300
            },
            step: 1
        });

        slider.noUiSlider.on("update", (values) => {

            durationValue.textContent =
                `${Math.round(values[0])} min - ${Math.round(values[1])} min`;

        });
    }
});


function parseDuration(duration) {

    if (!duration) return 0;

    const match =
    duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);

    return hours * 60 + minutes + seconds / 60;
}


async function search() {
    console.log("Search works");

    const input =
    document.getElementById("searchInput");

    const results =
    document.getElementById("results");


    if (!input || !results) return;

    const query =
    input.value.trim();


    if (query === "") {
        toast.show('error', 'Error', 'wpisz co chcesz wyszukać')

        return;
    }

    document.querySelector(".searchAlert").textContent = "";


    const value = query + " tutorial";

    document.getElementById("mainContent").classList.add("search-mode");


    // ===== FILTRY =====

    const polish =
    document.getElementById("polish").checked;

    const english =
    document.getElementById("english").checked;


    let languages = [];

    if (polish) {
        languages.push("pl");
    }

    if (english) {
        languages.push("en");
    }


    const ignoreDuration =
    document.getElementById("durationCheckbox").checked;

    const slider =
    document.getElementById("slider");

    const values =
    slider.noUiSlider.get();

    const minDuration =
    Number(values[0]);

    const maxDuration =
    Number(values[1]);


    // ===== CACHE =====

    const cacheKey =
    value + languages + minDuration + maxDuration + ignoreDuration;

    if (cache[cacheKey]) {
        results.innerHTML =
        cache[cacheKey];

        return;
    }

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(value)}&key=${API_KEY}`;


    if (languages.length === 1) {
        url += `&relevanceLanguage=${languages[0]}`;
    }

    try {
        const response =
        await fetch(url);

        const data =
        await response.json();

        if (!response.ok) {
            toast.show('error', 'error', 'błąd API')

            return;
        }

        if (!data.items || data.items.length === 0) {

            results.innerHTML =
            "<p>Brak wyników.</p>";

            return;
        }

        const ids =

        data.items
        .map(video => video.id.videoId)
        .join(",");

        const detailsResponse =

        await fetch(

        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,localizations,snippet&id=${ids}&key=${API_KEY}`

        );

        const details =
        await detailsResponse.json();

        const durations = {};
        const languages = {};

        details.items.forEach(item => {

            durations[item.id] =
            item.contentDetails.duration;

            languages[item.id] =
            item.snippet.defaultAudioLanguage ||
            item.snippet.defaultLanguage ||
            "";
        });
        
            const { data: ratings } =
            await supabaseClient
            .from("video_reviews")
            .select("video_id,rating");


        let html = "";

        data.items.forEach(video => {

            const id =
            video.id.videoId;

                const reviewsForVideo =
ratings.filter(
    r => r.video_id === id
);

const reviewCount =
reviewsForVideo.length;

const averageRating =
reviewCount > 0
? (
    reviewsForVideo.reduce(
        (sum,r) => sum + r.rating,
        0
    ) / reviewCount
).toFixed(1)
: "0";

            const videoLanguage =
            languages[id];

            const minutes =
            parseDuration(
                durations[id]
            );

            // Filtr długości
            if (!ignoreDuration) {
                if (minutes < minDuration || minutes > maxDuration) {
                    return;
                }
            }

            // Filtr języka
            if (languages.length > 0) {

                const lang = (videoLanguage || "").toLowerCase();

                const match = languages.some(l =>
                    lang.startsWith(l)
                );

                if (!match) {
                    return;
                }
            }
            if (Math.round(minutes) > 1) {
            html += `
            
            <div class="video">
                <img src="${video.snippet.thumbnails.medium.url}">

                <div>
                    <h3>
                    ${video.snippet.title}
                    </h3>
                    <p>
                    ${video.snippet.channelTitle}
                    </p>
                    <p>
                    ${Math.round(minutes)} min
                    </p>
                        <div class="grade-box">
                        <p class="grade-avg">${averageRating}/5 ⭐</p>
                        
                        <a target="_blank"
                        href="../Video/video.html?video=${id}">
                        Otwórz film
                        </a>
                        </div><br>
                    
                </div>
            </div>
            `;
            } else {
                html += `
            
            <div class="video">
                <img src="${video.snippet.thumbnails.medium.url}">

                <div>
                    <h3>
                    ${video.snippet.title}
                    </h3>
                    <p>
                    ${video.snippet.channelTitle}
                    </p>
                    <p>
                    < 1 min
                    </p>
                        <div class="grade-box">
                        <p class="grade-avg">${averageRating}/5 ⭐</p>
                        
                        <a target="_blank"
                        href="../Video/video.html?video=${id}">
                        Otwórz film
                        </a>
                        </div><br>
                    
                </div>
            </div>
            `;
            }
        });

// <p class="review-count">${reviewCount} opinii</p>
        if (html === "") {
            document.querySelector(".searchAlert").textContent =
            "Brak filmów spełniających filtry.";
        }

        results.innerHTML =
        html;

        // zapis gotowych wyników
        cache[cacheKey] =
        html;
    }

    catch(error) {
        console.error(error);
        alert(
            "Nie można połączyć się z YouTube."
        );
    }
}


function categoryDropdown() {
    const dropdown =
    document.getElementById("filtersDropdown");

    if (dropdown) {
        dropdown.classList.toggle("show");
    }
}


function goToLogin() {
    window.location.href =
    "../logowanie/log.html";
}

// tutaj sie zaczyna show us

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
});

function back(){
    window.location.href = "../strona startowa/start.html";
}

document.getElementById("menuBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("sidebar").classList.toggle("active");
});

document.addEventListener("click", (e) => {

    // sidebar
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menuBtn");

    if (
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
    ) {
        sidebar.classList.remove("active");
    }


    // filtry
    const dropdown = document.getElementById("filtersDropdown");
    const filtersBtn = document.getElementById("filtersBtn");

    if (
        dropdown.classList.contains("show") &&
        !dropdown.contains(e.target) &&
        !filtersBtn.contains(e.target)
    ) {
        dropdown.classList.remove("show");
    }

});
document.addEventListener("click", () => {

    const menu = document.getElementById("userMenu");

    if(menu){
        menu.classList.remove("active");
    }

});

// Mobile version popup

document.addEventListener("DOMContentLoaded", () => {

    console.log("Popup script started");

    const popup = document.getElementById("mobilePopup");
    const closeBtn = document.getElementById("closeMobilePopup");

    console.log("Popup:", popup);

    if (!popup) return;

    // TEST
    popup.classList.add("show");

    const dismissed = localStorage.getItem("mobilePopupDismissed");

    if (window.innerWidth <= 768 && dismissed !== "true") {
        setTimeout(() => {
            popup.classList.add("show");
        }, 500);
    }

    popup.addEventListener("click", () => {
        window.location.href =
            "../Staz-telefon/strona%20startowa/start.html";
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            popup.classList.remove("show");
            popup.classList.add("hide");

            localStorage.setItem(
                "mobilePopupDismissed",
                "true"
            );
        });
    }
});