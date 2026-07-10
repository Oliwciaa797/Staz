document.getElementById("saveBtn").addEventListener("click", () => {

    const user = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        projects: document.getElementById("projects").value,
        password: document.getElementById("password").value
    };

    console.log(user);

    alert("Dane zostały zapisane!");
});