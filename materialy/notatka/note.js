const note = JSON.parse(sessionStorage.getItem("selectedNote"));

document.getElementById("title").textContent = note.title;
const tags = document.getElementById("tags");
tags.innerHTML = (note.tags || [])
    .map(tag => `<span class="tag">${tag}</span>`)
    .join("");
document.getElementById("author").textContent = note.user_id; // tu musi byc nick teraz sie wyswietla tylko id
// bylo by fajnie jakby profilowe tez sie pobieralo
document.getElementById("content").innerHTML = note.content;