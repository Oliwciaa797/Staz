console.log("JS is working");

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
        document.querySelector(".searchAlert").textContent =
        "Wpisz co chcesz wyszukać!";

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


    let language = "";

    if (polish && !english) {
        language = "pl";
    }
    if (!polish && english) {
        language = "en";
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
    value + language + minDuration + maxDuration + ignoreDuration;

    if (cache[cacheKey]) {
        results.innerHTML =
        cache[cacheKey];

        return;
    }

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(value)}&key=${API_KEY}`;


    if (language !== "") {
        url +=
        `&relevanceLanguage=${language}`;
    }

    try {
        const response =
        await fetch(url);

        const data =
        await response.json();

        if (!response.ok) {
            alert(
                data.error?.message ||
                "Błąd API"
            );

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
            " ";
        });

        let html = "";

        data.items.forEach(video => {

            const id =
            video.id.videoId;

            const videoLanguage =
            languages[id];

            const minutes =
            parseDuration(
                durations[id]
            );

            if (!ignoreDuration) {
                if (
                    minutes < minDuration ||
                    minutes > maxDuration
                ) {
                    return;
                }
            }

            if(language !== " " && videoLanguage !== "") {
                if(!videoLanguage.startsWith(language)) {
                    return;
                }
            }

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
                    <a target="_blank"
                        href="../Video/video.html?video=${id}">
                        Otwórz film
                    </a>
                </div>
            </div>
            `;
        });

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
    "../LogIn/log.html";
}


function toggleMenu() {
    const sidebar =
    document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}