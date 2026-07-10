function back() {
    window.location.href = "../strona startowa/start.html";
}
function sprawdzHasla() {
    const haslo1 = document.getElementById("password").value;
    const haslo2 = document.getElementById("password2").value;

    if (haslo1 === haslo2) {
        alert("Hasła są takie same.");
    } else {
        alert("Hasła nie są takie same!");
    }
}