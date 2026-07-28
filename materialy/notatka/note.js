const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const toast = new Toast();
let currentUser;

async function init() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    currentUser = user || null;
    
    document.getElementById("title").textContent = note.title;

    const tags = document.getElementById("tags");
    tags.innerHTML = (note.tags || [])
        .map(tag => `<span class="tag">${tag}</span>`)
        .join("");

    document.getElementById("author").textContent = note.user_id;
    document.getElementById("content").innerHTML = note.content;

    await checkIfSaved();

    document
        .getElementById("likeBtn")
        .addEventListener("click", () => saveNote(note.id));
}

init();

const note = JSON.parse(sessionStorage.getItem("selectedNote"));

document.getElementById("title").textContent = note.title;
const tags = document.getElementById("tags");
tags.innerHTML = (note.tags || [])
    .map(tag => `<span class="tag">${tag}</span>`)
    .join("");
document.getElementById("author").textContent = note.user_id; // tu musi byc nick teraz sie wyswietla tylko id
// bylo by fajnie jakby profilowe tez sie pobieralo
document.getElementById("content").innerHTML = note.content;

async function checkIfSaved() {
    if (!currentUser) return;

    const { data } = await supabaseClient
        .from("saved_notes")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("note_id", note.id)
        .maybeSingle();

    if (data) {
        document.getElementById("likeBtn").classList.add("active");
    }
}

checkIfSaved();

async function saveNote(noteId) {

    if (!currentUser) {
        toast.show(
            "error",
            "Musisz być zalogowany",
            "Zaloguj się, aby zapisać notatkę."
        );
        return;
    }

    const likeBtn = document.getElementById("likeBtn");

    // Sprawdź czy notatka jest już zapisana
    const { data } = await supabaseClient
        .from("saved_notes")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("note_id", noteId)
        .maybeSingle();

    if (data) {
        // Usuń zapis
        const { error } = await supabaseClient
            .from("saved_notes")
            .delete()
            .eq("id", data.id);

        if (error) {
            console.error(error);
            return;
        }

        likeBtn.classList.remove("active");

        toast.show(
            "success",
            "Gotowe!",
            "Notatka została usunięta z zapisanych."
        );

        return;
    }

    // Zapisz notatkę
    const { error } = await supabaseClient
        .from("saved_notes")
        .insert({
            user_id: currentUser.id,
            note_id: noteId
        });

    if (error) {
        console.error(error);
        return;
    }

    likeBtn.classList.add("active");

    toast.show(
        "success",
        "Gotowe!",
        "Notatka została zapisana."
    );
}

const likeBtn = document.getElementById("likeBtn");

likeBtn.addEventListener("click", () => saveNote(note.id));