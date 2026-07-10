function back() {
    window.location.href = "../strona startowa/start.html";
}
function checkPasswords() {
    const password1 = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    if (password1 === password2) {
        alert("Hasła są takie same.");
    } else {
        alert("Hasła nie są takie same!");
    }
}