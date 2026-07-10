const loginBtn = document.querySelector(".login-btn");

loginBtn.addEventListener("click", () => {
    alert("Próba logowania...");
});
function goToLogin() {
    window.location.href = "../rejestracja/register.html";
}

function back() {
    window.location.href = "../strona startowa/start.html";
}