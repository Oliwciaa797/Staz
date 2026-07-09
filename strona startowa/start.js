function search() {
    const value = document.getElementById("searchInput").value;

    if (value.trim() === "") {
        alert("Wpisz coś do wyszukania.");
        return;
    }

    alert("Szukasz: " + value);
}

function categorySearch() {
    window.location.href = "../filtrowanie/filt.html";
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