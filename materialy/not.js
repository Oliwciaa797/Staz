/* ============================================================
   ============================================================ */
const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';
const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const isConfigured = !SUPABASE_URL.includes("TWOJ_") && !SUPABASE_ANON_KEY.includes("TWOJ_");

/* ============================================================
   ============================================================ */

let currentUser = null;

const quill = new Quill("#editor", {
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

/* ---------- Toast ---------- */
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 2600);
}

/* ---------- Tabs (działa zawsze, niezależnie od Supabase) ---------- */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ---------- Jeśli Supabase nie jest jeszcze skonfigurowany ---------- */
if (!isConfigured) {
  document.getElementById('profileName').textContent = 'Skonfiguruj Supabase';
  document.getElementById('myNotesLoading').textContent =
    'Uzupełnij SUPABASE_URL i SUPABASE_ANON_KEY w pliku script.js, aby notatki zaczęły działać.';
  document.getElementById('publicNotesLoading').textContent = '';
  showToast('Uzupełnij dane Supabase w script.js');
} else {
  loadUser();
}

/* ---------- Auth: pobranie aktualnego użytkownika ---------- */
async function loadUser(){
    const { data:{ user } } =
    await supabaseClient.auth.getUser();

    const profileName =
    document.getElementById("profileName");

    const avatar =
    document.getElementById("profileAvatar");

    if(!user){
        profileName.textContent="Zaloguj";
        avatar.src="../Profil/avatar.png";
        return;
    }

    currentUser=user;

    const {data:profile,error}=await supabaseClient
    .from("profiles")
    .select("profiles,avatar_url")
    .eq("id",user.id)
    .single();

    if(error){
        console.log(error);
        return;
    }

    profileName.textContent =
    profile.profiles;

    avatar.src =
    profile.avatar_url ||
    "../Profil/avatar.png";

    loadMyNotes();
    loadPublicNotes();

    
loadMyQuizy();
loadPublicQuizy();

loadSavedMaterials();

}

/* ---------- Renderowanie karty notatki (widok) ---------- */
function renderNoteCard(note, { editable }){
  const div = document.createElement('div');
  div.className = 'item-card';
  div.dataset.id = note.id;

  const badge = note.is_public
    ? '<span class="badge public">Publiczna</span>'
    : '<span class="badge private">Prywatna</span>';

  const date = new Date(note.created_at).toLocaleDateString('pl-PL', { day:'2-digit', month:'2-digit', year:'numeric' });

  div.innerHTML = `
    ${badge}
    <h3 class="note-title-view">${escapeHtml(note.title)}</h3>
    <div class="note-content-view">${note.content}</div>
    <button class="go-btn big-btn show-note-btn">Pokaż notatkę</button>
    <div class="card-footer">
      <span>${editable ? date : escapeHtml(note.author_name || 'Użytkownik')}</span>
      ${editable ? `<div class="card-actions">
        <button class="edit" data-id="${note.id}">Edytuj</button>
        <button class="toggle-vis" data-id="${note.id}" data-public="${note.is_public}">
          ${note.is_public ? 'Ukryj' : 'Upublicznij'}
        </button>
        <button class="delete" data-id="${note.id}">Usuń</button>
      </div>` : ''}
    </div>
  `;
  const showBtn =
div.querySelector(".show-note-btn");

showBtn.addEventListener("click",()=>{

    const content =
    div.querySelector(".note-content-view");

    content.classList.toggle("expanded");

    showBtn.textContent =
    content.classList.contains("expanded")
    ? "Ukryj notatkę"
    : "Pokaż notatkę";

});
  return div;
}

/* ---------- Przełączenie karty w tryb edycji ---------- */
function enterEditMode(card, note){
  card.innerHTML = `
    <div class="field">
      <label>Tytuł</label>
      <input type="text" class="edit-title" value="${escapeAttr(note.title)}">
    </div>
    <div class="field">
      <label>Treść</label>
      <div class="edit-content"></div>
    </div>
    <div class="card-footer">
      <div class="card-actions">
        <button class="save-edit" data-id="${note.id}">Zapisz zmiany</button>
        <button class="cancel-edit">Anuluj</button>
      </div>
    </div>
  `;

  card.querySelector('.cancel-edit').addEventListener('click', () => loadMyNotes());

  card.querySelector('.save-edit').addEventListener('click', async () => {
    const newTitle = card.querySelector('.edit-title').value.trim();
    const editEditor = card.querySelector(".edit-content");

    const editQuill = new Quill(editEditor,{
        theme:"snow",
        modules:{
            toolbar:[
                ["bold","italic","underline"],
                [{list:"ordered"},{list:"bullet"}],
                ["link"],
                ["clean"]
            ]
        }
    });

editQuill.root.innerHTML = note.content;

    if(!newTitle || !newContent){
      showToast('Tytuł i treść nie mogą być puste.');
      return;
    }

    const { error } = await supabase
      .from('notes')
      .update({ title: newTitle, content: newContent })
      .eq('id', note.id);

    if(error){
      showToast('Nie udało się zapisać zmian: ' + error.message);
      return;
    }

    showToast('Notatka zaktualizowana.');
    loadMyNotes();
  });
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function escapeAttr(str){
  return escapeHtml(str).replace(/"/g, '&quot;');
}

/* ---------- Wczytanie własnych notatek ---------- */
async function loadMyNotes(){
  const loadingEl = document.getElementById('myNotesLoading');
  const grid = document.getElementById('myNotesGrid');
  loadingEl.style.display = 'block';
  grid.innerHTML = '';

  const { data, error } = await supabaseClient
    .from('notes')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  loadingEl.style.display = 'none';

  if(error){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Nie udało się wczytać notatek: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if(!data || data.length === 0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><strong>Brak notatek</strong>Dodaj swoją pierwszą notatkę powyżej.</div>`;
    return;
  }

  data.forEach(note => grid.appendChild(renderNoteCard(note, { editable: true })));

  grid.querySelectorAll('.delete').forEach(btn=>{
    btn.addEventListener('click', () => deleteNote(btn.dataset.id));
  });
  grid.querySelectorAll('.toggle-vis').forEach(btn=>{
    btn.addEventListener('click', () => toggleVisibility(btn.dataset.id, btn.dataset.public === 'true'));
  });
  grid.querySelectorAll('.edit').forEach(btn=>{
    btn.addEventListener('click', () => {
      const note = data.find(n => String(n.id) === String(btn.dataset.id));
      const card = grid.querySelector(`.item-card[data-id="${btn.dataset.id}"]`);
      enterEditMode(card, note);
    });
  });
}

/* ---------- Wczytanie notatek publicznych (innych użytkowników) ---------- */
async function loadPublicNotes(){
  const loadingEl = document.getElementById('publicNotesLoading');
  const grid = document.getElementById('publicNotesGrid');
  loadingEl.style.display = 'block';
  grid.innerHTML = '';

  const { data, error } = await supabaseClient
    .from('notes')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(30);

  loadingEl.style.display = 'none';

  if(error){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Nie udało się wczytać notatek publicznych.</div>`;
    return;
  }

  const filtered = currentUser ? data.filter(n => n.user_id !== currentUser.id) : data;

  if(!filtered || filtered.length === 0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Nikt jeszcze nie udostępnił publicznej notatki.</div>`;
    return;
  }

  filtered.forEach(note => grid.appendChild(renderNoteCard(note, { editable: false })));
}

/* ---------- Dodawanie notatki ---------- */
document.getElementById('noteForm').addEventListener('submit', async (e)=>{
  e.preventDefault();

  if (!isConfigured) {
    showToast('Najpierw uzupełnij dane Supabase w script.js.');
    return;
  }
  if(!currentUser){
    showToast('Zaloguj się, aby dodać notatkę.');
    return;
  }

  const title = document.getElementById('noteTitle').value.trim();
  const content = quill.root.innerHTML;
  const plainText = quill.getText().trim();

  if(!plainText){
      showToast("Treść nie może być pusta.");
      return;
  }
  const isPublic = document.getElementById('notePublic').checked;
  const btn = document.getElementById('saveNoteBtn');

  btn.disabled = true;
  btn.textContent = 'ZAPISYWANIE…';

const { error } = await supabaseClient.from('notes').insert({
    user_id: currentUser.id,
    title,
    content,
    is_public: isPublic
});

  btn.disabled = false;
  btn.textContent = 'ZAPISZ NOTATKĘ';

  if(error){
    showToast('Błąd zapisu: ' + error.message);
    return;
  }

  document.getElementById('noteForm').reset();
  quill.setContents([]);
  showToast('Notatka zapisana!');
  loadMyNotes();
  if(isPublic) loadPublicNotes();
});

/* ---------- Usuwanie notatki ---------- */
async function deleteNote(id){
  if(!confirm('Na pewno usunąć tę notatkę?')) return;
  const { error } = await supabaseClient.from('notes').delete().eq('id', id);
  if(error){
    showToast('Nie udało się usunąć notatki.');
    return;
  }
  showToast('Notatka usunięta.');
  loadMyNotes();
  loadPublicNotes();
}

/* ---------- Zmiana widoczności notatki ---------- */
async function toggleVisibility(id, currentlyPublic){
  const { error } = await supabase
    .from('notes')
    .update({ is_public: !currentlyPublic })
    .eq('id', id);
  if(error){
    showToast('Nie udało się zmienić widoczności.');
    return;
  }
  showToast(!currentlyPublic ? 'Notatka jest teraz publiczna.' : 'Notatka jest teraz prywatna.');
  loadMyNotes();
  loadPublicNotes();
}
document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    menuBtn.addEventListener("click", (e)=>{

        e.stopPropagation();

        sidebar.classList.toggle("active");

    });

    // MENU PROFILU

    const profileChip = document.querySelector(".profile-chip");
    const userMenu = document.querySelector(".user-menu");

    profileChip.addEventListener("click",(e)=>{

        e.stopPropagation();

        userMenu.classList.toggle("active");

    });

    // zamykanie po kliknięciu poza

    document.addEventListener("click",(e)=>{

        if(!sidebar.contains(e.target) && !menuBtn.contains(e.target))
            sidebar.classList.remove("active");

        if(!document.getElementById("userArea").contains(e.target))
            userMenu.classList.remove("active");

    });

});

async function loadMyQuizy(){

    const grid =
    document.getElementById("myQuizyGrid");

    grid.innerHTML = "";

    const { data, error } =
    await supabaseClient
    .from("quizzes")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at",{ascending:false});
  
    if(error){
        console.error(error);
        return;
    }

    if(!data || data.length === 0){

        grid.innerHTML = `
            <div class="empty-state">
                Brak quizów.
            </div>
        `;

        return;
    }

    data.forEach(quiz => {

        const count =
        Array.isArray(quiz.questions)
        ? quiz.questions.length
        : 0;

        grid.innerHTML += `
            <div class="item-card">

                <span class="badge ${
                    quiz.is_public
                    ? "public"
                    : "private"
                }">

                    ${
                        quiz.is_public
                        ? "Publiczny"
                        : "Prywatny"
                    }
                </span> 
            <h3>${quiz.title}</h3>
            <p>${count} pytań</p>

<button
    class="go-btn big-btn"
    onclick="openQuiz('${quiz.id}')">
    Rozwiąż quiz
</button>

<div class="card-actions">

    <button
        class="mini-btn edit-btn"
        onclick="editQuiz('${quiz.id}')">
        Edytuj
    </button>

    <button
        class="mini-btn delete-btn"
        onclick="deleteQuiz('${quiz.id}')">
        Usuń
    </button>

</div>
            </div>
        `;
    });
}

async function loadPublicQuizy(){

    const grid =
    document.getElementById("publicQuizyGrid");

    grid.innerHTML = "";

    const { data, error } =
    await supabaseClient
    .from("quizzes")
    .select("*")
    .eq("is_public", true)
    .order("created_at",{ascending:false});

    if(error){
        console.error(error);
        return;
    }

    const filtered =
    data.filter(
        q => q.user_id !== currentUser.id
    );

    if(filtered.length === 0){

        grid.innerHTML = `
            <div class="empty-state">
                Brak publicznych quizów.
            </div>
        `;

        return;
    }

    filtered.forEach(quiz => {

        const count =
        Array.isArray(quiz.questions)
        ? quiz.questions.length
        : 0;

        grid.innerHTML += `
            <div class="item-card">
                <span class="badge public">
                    Publiczny
                </span>

                <h3>${quiz.title}</h3>

                <p>${count} pytań</p>
            </div>
        `;
    });
}

async function loadSavedMaterials(){

    const grid =
    document.getElementById("savedGrid");

    const { data, error } =
    await supabaseClient
    .from("saved_materials")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at",{ascending:false});

    if(error){
        console.error(error);
        return;
    }

    if(!data || data.length === 0){

        grid.innerHTML = `
            <div class="empty-state">
                <strong>Brak zapisanych materiałów</strong>
            </div>
        `;

        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="saved-card">

            <div class="thumb">
                FILM
            </div>

            <div class="info">
                <h3>Film YouTube</h3>
                <button class="go-btn" onclick="openVideo('${item.video_id}')"> Otwórz materiał </button>
            </div>

        </div>
    `).join("");
}

function openVideo(videoId){

    window.location.href =
    `../Video/video.html?video=${videoId}`;

}

function openQuiz(id){

    window.location.href =
    `../quiz (stworzone)/qu.html?id=${id}`;

}

async function deleteQuiz(id){

    if(!confirm("Na pewno usunąć quiz?")){
        return;
    }

    const { error } =
    await supabaseClient
        .from("quizzes")
        .delete()
        .eq("id", id);

    if(error){
        console.error(error);
        showToast("Nie udało się usunąć quizu.");
        return;
    }

    showToast("Quiz usunięty.");

    loadMyQuizy();
    loadPublicQuizy();
}

function editQuiz(id){

    window.location.href =
    `../edytor quizow/quiz.html?id=${id}`;

}

function quiz(){
  window.location.href = "../kreator quizow/quiz.html"
}

function back(){
  window.location.href = "../strona startowa/start.html"
}