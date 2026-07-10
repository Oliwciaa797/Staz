const input = document.getElementById("searchInput");

input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        search();
    }
});
function search() {
    const value = document.getElementById("searchInput").value;

    if (value.trim() === "") {
        alert("Wpisz coś do wyszukania.");
        return;
    } else {
        document.getElementById("mainContent").classList.add("search-mode");
    }

    console.log("Szukasz: " + value);
}

function categoryDropdown() {
    document.getElementById("filtersDropdown").classList.toggle("show");
}

function goToLogin() {
    window.location.href = "../logowanie/log.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("searchBtn")
        .addEventListener("click", search);
});



function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("active");
}

const slider = document.getElementById("slider");
const value = document.getElementById("durationValue");

noUiSlider.create(slider, {
    start: [10, 60],      // od 10 do 60 minut
    connect: true,
    range: {
        min: 0,
        max: 300
    },
    step: 1
});

slider.noUiSlider.on("update", function(values) {
    value.textContent =
        `${Math.round(values[0])} min - ${Math.round(values[1])} min`;
});