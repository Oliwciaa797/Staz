function back() {
    window.location.href = "../strona startowa/start.html";
}
function checkPasswords() {
    const password1 = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    if (password1 === password2) {
        
    } else {
        alert("Hasła nie są takie same!");
    }
}
function sprawdzCheckbox() {
    const checkbox = document.getElementById("agree");
    const button = document.getElementById("registerBtn");

    button.disabled = !checkbox.checked;
}