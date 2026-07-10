function back() {
    window.location.href = "../strona startowa/start.html";
}
function checkPasswords() {
    const password1 = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;
    const error = document.getElementById("passwordError");

    error.textContent = "";

     if (password1.length < 8) {
        error.textContent = "Hasło musi mieć co najmniej 8 znaków.";
        return;
    }
    if (password1 !== password2) {
        error.textContent = "Hasła muszą być takie same.";
        return;
    }
}
function sprawdzCheckbox() {
    const checkbox = document.getElementById("agree");
    const button = document.getElementById("registerBtn");

    button.disabled = !checkbox.checked;
}