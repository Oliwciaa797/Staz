function search() {
    const value = document.getElementById("searchInput").value;

    if(value.trim() === ""){
        alert("Wpisz coś do wyszukania.");
        return;
    }

    alert("Szukasz: " + value);
}

function categorySearch() {
    alert("Otwieranie kategorii...");
}

document
    .getElementById("searchBtn")
    .addEventListener("click", search);