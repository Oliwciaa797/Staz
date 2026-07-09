const school = document.getElementById("school");
const classSelect = document.getElementById("class");

school.addEventListener("change", function () {

    classSelect.innerHTML = "";

    if (school.value === "podstawowa") {

        for (let i = 1; i <= 8; i++) {
            let option = document.createElement("option");
            option.value = i;
            option.textContent = "Klasa " + i;
            classSelect.appendChild(option);
        }

    } else if (school.value === "srednia") {

        for (let i = 1; i <= 4; i++) {
            let option = document.createElement("option");
            option.value = i;
            option.textContent = "Klasa " + i;
            classSelect.appendChild(option);
        }

    } else {
        classSelect.innerHTML =
            '<option value="">Najpierw wybierz szkołę</option>';
    }
});

function goNext() {

    const schoolValue = school.value;
    const classValue = classSelect.value;
    const topicValue = document.getElementById("topic").value;

    if (
        schoolValue === "" ||
        classValue === "" ||
        topicValue.trim() === ""
    ) {
        alert("Uzupełnij wszystkie pola!");
        return;
    }

    window.location.href = "nastepna-strona.html";
}