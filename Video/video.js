console.log("video.js loaded");

function toggleMenu() {
    const sidebar =
    document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}


function goToLogin() {
    window.location.href =
    "../logowanie/log.html";
}
