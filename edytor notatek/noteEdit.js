/* ============================================================
   KONFIGURACJA — te same dane co w not.js
   ============================================================ */
const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log(window.supabase);

/* ============================================================
================================================== */

const params = new URLSearchParams(window.location.search);
const editNoteId = params.get("id");

let currentUser = null;

let noteTagSelect;


async function loadNoteTags() {

    const { data, error } = await supabaseClient
        .from("tags")
        .select("name")
        .order("name");

    if (error) {
        console.error(error);
        return;
    }

    noteTagSelect = new TomSelect("#noteTags", {
        plugins: ["remove_button"],
        valueField: "name",
        labelField: "name",
        searchField: "name",
        options: data,
        create: true,
        persist: false
    });

}

const toast = new Toast();

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function genId(){
  return 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

/* ---------- Start: sprawdzenie zalogowania ---------- */
init();

async function init() {
    try {

        const { data: { user }, error } =
            await supabaseClient.auth.getUser();

        if (error || !user) {

            document.getElementById("authNotice").style.display = "block";
            document.getElementById("noteBuilder").style.display = "none";
            document.getElementById("profileName").textContent = "Zaloguj się";

            return;
        }

        currentUser = user;

        await showUser();

        document.getElementById("authNotice").style.display = "none";
        document.getElementById("noteBuilder").style.display = "block";

        // wczytanie tagów
        await loadNoteTags();

        // jeśli jest id w URL -> edycja
        if (editNoteId) {
            await loadNoteToEdit();
        }

    } catch (e) {
        console.error(e);

        toast.show(
            "error",
            "Błąd",
            "Nie udało się połączyć z Supabase."
        );
    }
}

/* ---------- Renderowanie formularza dla wybranego typu ---------- */

const MAX_CHARS = 100000;

let quill;

function updateCounter() {

    const counter = document.getElementById("charCounter");

    const length = Math.max(
        0,
        quill.getLength() - 1
    );

    counter.textContent =
        `${length} / ${MAX_CHARS} znaków`;

    counter.classList.toggle(
        "limit",
        length > MAX_CHARS
    );
}

document.addEventListener("DOMContentLoaded", () => {

    quill = new Quill("#editor", {
        theme: "snow",
        placeholder: "Napisz notatkę...",
        modules: {
            toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link"],
                ["clean"]
            ]
        }
    });

    quill.on("text-change", updateCounter);

    updateCounter();

});

document.getElementById("saveNoteBtn").addEventListener("click", async () => {

    if (!currentUser) {
        toast.show(
            "error",
            "Zaloguj się",
            "Zaloguj się, aby zapisać notatkę."
        );
        return;
    }

    const title =
        document.getElementById("noteTitle")
        .value
        .trim();

    const length = quill.getLength() - 1;

    if (length > MAX_CHARS) {
        toast.show(
            "error",
            "Limit przekroczony",
            `Maksymalna długość notatki to ${MAX_CHARS} znaków.`
        );
        return;
    }

    const content =
        quill.root.innerHTML;

    const plainText =
        quill.getText().trim();

    const isPublic =
        document.getElementById("notePublic")
        .checked;

    if (!title) {
        toast.show(
            "error",
            "Błąd",
            "Podaj tytuł notatki."
        );
        return;
    }

    if (!plainText) {
        toast.show(
            "error",
            "Błąd",
            "Treść notatki nie może być pusta."
        );
        return;
    }

    const tags = noteTagSelect ? noteTagSelect.items : [];

    for (const tag of tags) {

        const { data } = await supabaseClient
            .from("tags")
            .select("id")
            .eq("name", tag);

        if (!data || data.length === 0) {

            await supabaseClient
                .from("tags")
                .insert({
                    name: tag
                });

        }
    }

    const btn =
        document.getElementById("saveNoteBtn");

    btn.disabled = true;
    btn.textContent = "ZAPISYWANIE...";

    let error;

    if (editNoteId) {

        const result =
            await supabaseClient
                .from("notes")
                .update({
                    title,
                    content,
                    tags,
                    is_public: isPublic
                })
                .eq("id", editNoteId);

        error = result.error;

    } else {

        const result =
            await supabaseClient
                .from("notes")
                .insert({
                    user_id: currentUser.id,
                    title,
                    content,
                    tags,
                    is_public: isPublic
                });

        error = result.error;
    }

    btn.disabled = false;
    btn.textContent =
        editNoteId
            ? "ZAPISZ ZMIANY"
            : "ZAPISZ NOTATKĘ";

    if (error) {
        toast.show(
            "error",
            "Błąd zapisu",
            error.message
        );
        return;
    }

    toast.show(
        "success",
        "Gotowe!",
        editNoteId
            ? "Notatka została zaktualizowana!"
            : "Notatka została zapisana!"
    );

    setTimeout(() => {
        window.location.href =
            "../materialy/not.html";
    }, 900);

});

async function showUser() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    const profileName = document.getElementById("profileName");
    const profileAvatar = document.getElementById("profileAvatar");
    const userMenu = document.querySelector(".user-menu");

    if (!user) {
        profileName.textContent = "Zaloguj";
        profileAvatar.src = "../Profil/avatar.png";
        return;
    }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("profiles, avatar_url")
        .eq("id", user.id)
        .single();

    if (error) {
        console.log(error);
        return;
    }

    profileName.textContent = profile.profiles;
    profileAvatar.src = profile.avatar_url || "../Profil/avatar.png";

    document.querySelector(".profile-chip").onclick = (e) => {
        e.stopPropagation();
        userMenu.classList.toggle("active");
    };
}


async function updateSidebar() {

    const { data: { user } } = await supabaseClient.auth.getUser();

    const sidebar = document.getElementById("sidebar");

    if (user) {
        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../materialy/not.html">Zapisane materiały</a>
            <a href="../Profil/prof.html">Profil</a>
            <a href="../wylogowywanie/logout.html">Wyloguj się</a>
            <a href="../zglaszanie bledow/blad.html">⚠️Zgłoś błąd⚠️</a>
        `;
    } else {
        sidebar.innerHTML = `
            <a href="../strona startowa/start.html">Strona Startowa</a>
            <a href="../logowanie/log.html">Logowanie</a>
            <a href="../zglaszanie bledow/blad.html">⚠️Zgłoś błąd⚠️</a>
        `;
    }
}



function back(){
    window.location.href = "../strona startowa/start.html";
}


document.getElementById("menuBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("sidebar").classList.toggle("active");
});

document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar");

    if (
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target)
    ) {
        sidebar.classList.remove("active");
    }
});

document.addEventListener("click", (e) => {

    const menu = document.querySelector(".user-menu");
    const area = document.getElementById("userArea");

    if (menu && area && !area.contains(e.target)) {
        menu.classList.remove("active");
    }

});

function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}

async function loadNoteToEdit() {

    const { data, error } =
    await supabaseClient
        .from("notes")
        .select("*")
        .eq("id", editNoteId)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    document.getElementById("noteTitle").value =
        data.title;

    document.getElementById("notePublic").checked =
        data.is_public;

    quill.root.innerHTML =
        data.content;

    updateCounter();
    if (noteTagSelect) {

        noteTagSelect.clear(true);

        (data.tags || []).forEach(tag => {

            noteTagSelect.addOption({
                value: tag,
                text: tag,
                name: tag
            });

            noteTagSelect.addItem(tag, true);

        });
    }

    document.querySelector("h1").textContent =
        "Edytuj notatkę";
    document.title = "Edytuj notatkę";
    document.getElementById("saveNoteBtn").textContent =
        "ZAPISZ ZMIANY";
}