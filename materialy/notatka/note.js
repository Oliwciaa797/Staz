const note = JSON.parse(sessionStorage.getItem("selectedNote"));

document.getElementById("title").textContent = note.title;
document.getElementById("author").textContent = note.author_name;
document.getElementById("content").innerHTML = note.content;