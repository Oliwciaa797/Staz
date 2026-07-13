console.log("JS is working");

const API_KEY = "AIzaSyC3PtOxwiyhM_XW4Qrk-S_U7QilNlePDbI";

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



async function search() {

    console.log("Fuction search is working");


    const input = document.getElementById("searchInput");


    if (!input) {
        console.error("Brak pola searchInput");
        return;
    }


    const value = input.value.trim();


    if (value === "") {

        document.querySelector(".searchAlert").textContent =
            "Wpisz co chcesz wyszukać!";
        return;

    } 


    const mainContent = document.getElementById("mainContent");

    if (mainContent) {
        document.querySelector(".searchAlert").textContent =
            " ";

        mainContent.classList.add("search-mode");
    }



    const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(value)}&key=${API_KEY}`;



    try {

        const response = await fetch(url);


        const data = await response.json();


        console.log(data);



        if (!response.ok) {

            console.error(data);

            alert(
                data.error?.message ||
                "Błąd podczas pobierania danych."
            );

            return;

        }



        const results = document.getElementById("results");


        if (!results) {

            console.error("Brak elementu results");
            return;

        }



        results.innerHTML = "";



        if (!data.items || data.items.length === 0) {

            results.innerHTML =
            "<p>Nie znaleziono wyników.</p>";

            return;

        }



        data.items.forEach(video => {


            const id = video.id.videoId;


            results.innerHTML = `

            <div class="video">

                <img 
                src="${video.snippet.thumbnails.medium.url}"
                alt="Miniatura filmu">


                <div>

                    <h3>
                        ${video.snippet.title}
                    </h3>


                    <p>
                        ${video.snippet.channelTitle}
                    </p>


                    <a 
                    target="_blank"
                    href="https://youtube.com/watch?v=${id}">
                        Otwórz film
                    </a>


                </div>

            </div>

            `;


        });



    } catch(error) {


        console.error(error);

        alert(
            "Nie można połączyć się z YouTube API."
        );


    }

}




function categoryDropdown() {

    console.log("Funkcja categoryDropdown działa");


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




function toggleMenu() {


    const sidebar =
    document.getElementById("sidebar");


    if (sidebar) {

        sidebar.classList.toggle("active");

    }

}