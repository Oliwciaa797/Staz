/* ============================================================
   KONFIGURACJA — te same dane co w not.js
   ============================================================ */
const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================================================
   Struktura tabeli "quizzes" w Supabase (SQL do uruchomienia raz):

   create table quizzes (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users(id) not null,
     title text not null,
     is_public boolean default false,
     questions jsonb not null default '[]'::jsonb,
     created_at timestamp with time zone default now()
   );

   alter table quizzes enable row level security;

   create policy "Users can view own quizzes" on quizzes
     for select using (auth.uid() = user_id);
   create policy "Anyone can view public quizzes" on quizzes
     for select using (is_public = true);
   create policy "Users can insert own quizzes" on quizzes
     for insert with check (auth.uid() = user_id);
   create policy "Users can update own quizzes" on quizzes
     for update using (auth.uid() = user_id);
   create policy "Users can delete own quizzes" on quizzes
     for delete using (auth.uid() = user_id);

   Każde pytanie w kolumnie "questions" ma strukturę:
   {
     id: string,
     type: "single" | "multi" | "boolean",
     question: string,
     options: string[],
     correct: number[]   // indeksy poprawnych opcji w tablicy options
   }
   ============================================================ */

let currentUser = null;
let questions = [];

const TYPE_LABELS = {
  single: 'Jednokrotny wybór',
  multi: 'Wielokrotny wybór',
  boolean: 'Prawda / Fałsz'
};

let quizTagSelect;

async function loadQuizTags() {

    const { data, error } = await supabaseClient
        .from("tags")
        .select("name")
        .order("name");

    if (error) {
        console.error(error);
        return;
    }

    quizTagSelect = new TomSelect("#quizTags", {
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

async function init(){
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if(error || !user){
      document.getElementById('authNotice').style.display = 'block';
      document.getElementById('quizBuilder').style.display = 'none';
      document.getElementById('profileName').textContent = 'Zaloguj się';
      return;
    }
    currentUser = user;
    const displayName = user.user_metadata?.username || user.email;
    const profileName = document.getElementById('profileName');

    if(profileName){
      profileName.textContent = displayName;
    }
    document.getElementById('authNotice').style.display = 'none';
    document.getElementById('quizBuilder').style.display = 'block';

    await loadQuizTags();
    renderQuestionsList();
  } catch (e) {
    console.error(e);
    toast.show('error','Błąd','Nie udało się połączyć z Supabase.');
  }

  updateSidebar()
}

/* ============================================================
   PRZEPŁYW DODAWANIA PYTANIA
   ============================================================ */

const addQuestionBtn = document.getElementById('addQuestionBtn');
const typePicker = document.getElementById('typePicker');
const questionFormArea = document.getElementById('questionFormArea');
const cancelTypePickerBtn = document.getElementById('cancelTypePickerBtn');

addQuestionBtn.addEventListener('click', () => {
  addQuestionBtn.style.display = 'none';
  typePicker.style.display = 'block';
});

cancelTypePickerBtn.addEventListener('click', () => {
  typePicker.style.display = 'none';
  addQuestionBtn.style.display = 'inline-block';
});

document.querySelectorAll('.type-option').forEach(btn=>{
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    typePicker.style.display = 'none';
    renderQuestionForm(type);
  });
});

/* ---------- Renderowanie formularza dla wybranego typu ---------- */
function renderQuestionForm(type){
  if(type === 'boolean'){
    questionFormArea.innerHTML = `
      <div class="question-form">
        <h3>${TYPE_LABELS.boolean}</h3>
        <div class="field">
          <label>Treść pytania</label>
          <input type="text" id="qfText" placeholder="np. Warszawa jest stolicą Polski">
        </div>
        <div class="boolean-choice">
          <label><input type="radio" name="qfBoolCorrect" value="0" checked> Prawda</label>
          <label><input type="radio" name="qfBoolCorrect" value="1"> Fałsz</label>
        </div>
        <div class="question-form-actions">
          <button type="button" class="btn-primary" id="qfAddBtn">Dodaj pytanie</button>
          <button type="button" class="btn-cancel-inline" id="qfCancelBtn">Anuluj</button>
        </div>
      </div>
    `;

    document.getElementById('qfCancelBtn').addEventListener('click', resetAddQuestionUI);
    document.getElementById('qfAddBtn').addEventListener('click', () => {
      const text = document.getElementById('qfText').value.trim();
      if(!text){ toast.show('error','Błąd','Podaj treść pytania.'); return; }
      const correctVal = document.querySelector('input[name="qfBoolCorrect"]:checked').value;

      questions.push({
        id: genId(),
        type: 'boolean',
        question: text,
        options: ['Prawda', 'Fałsz'],
        correct: [Number(correctVal)]
      });

      resetAddQuestionUI();
      renderQuestionsList();
    });
    return;
  }

  // single / multi
  const inputType = type === 'single' ? 'radio' : 'checkbox';

  questionFormArea.innerHTML = `
    <div class="question-form">
      <h3>${TYPE_LABELS[type]}</h3>
      <div class="field">
        <label>Treść pytania</label>
        <input type="text" id="qfText" placeholder="np. Które z poniższych są stolicami?">
      </div>
      <div class="field">
        <label>Odpowiedzi (zaznacz poprawne)</label>
        <div class="options-list" id="qfOptionsList"></div>
        <button type="button" class="add-option-btn" id="qfAddOptionBtn">+ Dodaj opcję</button>
      </div>
      <div class="question-form-actions">
        <button type="button" class="btn-primary" id="qfAddBtn">Dodaj pytanie</button>
        <button type="button" class="btn-cancel-inline" id="qfCancelBtn">Anuluj</button>
      </div>
    </div>
  `;

  const optionsList = document.getElementById('qfOptionsList');

  function addOptionRow(){
    const rows = optionsList.querySelectorAll('.option-row').length;
    if(rows >= 6){ toast.show('error','Błąd','Maksymalnie 6 opcji.'); return; }
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
      <input type="${inputType}" name="qfOptionCorrect">
      <input type="text" class="qfOptionText" placeholder="Treść odpowiedzi">
      <button type="button" class="remove-option" title="Usuń opcję">×</button>
    `;
    row.querySelector('.remove-option').addEventListener('click', () => {
      if(optionsList.querySelectorAll('.option-row').length <= 2){
        toast.show('error','Błąd','Pytanie musi mieć co najmniej 2 opcje.');
        return;
      }
      row.remove();
    });
    optionsList.appendChild(row);
  }

  // startowe 2 opcje
  addOptionRow();
  addOptionRow();

  document.getElementById('qfAddOptionBtn').addEventListener('click', addOptionRow);
  document.getElementById('qfCancelBtn').addEventListener('click', resetAddQuestionUI);

  document.getElementById('qfAddBtn').addEventListener('click', () => {
    const text = document.getElementById('qfText').value.trim();
    if(!text){ toast.show('error','Błąd','Podaj treść pytania.'); return; }

    const rows = Array.from(optionsList.querySelectorAll('.option-row'));
    const options = [];
    const correct = [];

    rows.forEach((row, idx) => {
      const optText = row.querySelector('.qfOptionText').value.trim();
      const checked = row.querySelector('input[name="qfOptionCorrect"]').checked;
      if(optText){
        options.push(optText);
        if(checked) correct.push(options.length - 1);
      }
    });

    if(options.length < 2){toast.show('error','Błąd','Podaj co najmniej 2 wypełnione opcje.'); return; }
    if(correct.length === 0){ toast.show('error','Błąd','Zaznacz co najmniej jedną poprawną odpowiedź.'); return; }

    questions.push({
      id: genId(),
      type,
      question: text,
      options,
      correct
    });

    resetAddQuestionUI();
    renderQuestionsList();
  });
}

function resetAddQuestionUI(){
  questionFormArea.innerHTML = '';
  typePicker.style.display = 'none';
  addQuestionBtn.style.display = 'inline-block';
}

/* ---------- Renderowanie listy dodanych pytań ---------- */
function renderQuestionsList(){
  const list = document.getElementById('questionsList');
  const empty = document.getElementById('questionsEmpty');

  list.innerHTML = '';

  if(questions.length === 0){
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  questions.forEach((q, index) => {
    const div = document.createElement('div');
    div.className = 'question-item';

    const optsHtml = q.options.map((opt, i) => {
      const isCorrect = q.correct.includes(i);
      return `<div class="opt ${isCorrect ? 'correct' : ''}">${isCorrect ? '✓ ' : ''}${escapeHtml(opt)}</div>`;
    }).join('');

    div.innerHTML = `
      <div class="question-item-top">
        <span class="question-item-badge">${TYPE_LABELS[q.type]}</span>
        <button type="button" class="remove-question" data-index="${index}">Usuń</button>
      </div>
      <h4>${index + 1}. ${escapeHtml(q.question)}</h4>
      <div class="opts">${optsHtml}</div>
    `;

    div.querySelector('.remove-question').addEventListener('click', () => {
      questions.splice(index, 1);
      renderQuestionsList();
    });

    list.appendChild(div);
  });
}

/* ============================================================
   ZAPIS CAŁEGO QUIZU
   ============================================================ */
document.getElementById('saveQuizBtn').addEventListener('click', async () => {
  if(!currentUser){
    toast.show('error','Zaloguj się','Zaloguj się, aby zapisać quiz.');
    return;
  }

  const title = document.getElementById('quizTitle').value.trim();
  const isPublic = document.getElementById('quizPublic').checked;

  if(!title){
    toast.show('error','Błąd','Podaj nazwę quizu.');
    return;
  }
  if(questions.length === 0){
    toast.show('error', 'Błąd','Dodaj co najmniej jedno pytanie.');
    return;
  }

  const tags = quizTagSelect.items;

  for (const tag of tags) {

      const { data } = await supabaseClient
          .from("tags")
          .select("id")
          .eq("name", tag);

      if (!data || data.length === 0) {
          await supabaseClient
              .from("tags")
              .insert({ name: tag });
      }
  }

  const btn = document.getElementById('saveQuizBtn');
  btn.disabled = true;
  btn.textContent = 'ZAPISYWANIE…';

  const { error } = await supabaseClient.from('quizzes').insert({
    user_id: currentUser.id,
    title,
    is_public: isPublic,
    questions,
    tags
  });

  btn.disabled = false;
  btn.textContent = 'ZAPISZ QUIZ';

  if(error){
    toast.show('error','Błąd zapisu: ', error.message);
    return;
  }

  toast.show('success','Gotowe!','Quiz zapisany!');
  setTimeout(() => { window.location.href = "../materialy/not.html"; }, 900);
});

/* ----------profilowe i nazwa uzytkownika----------*/
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

    // document.addEventListener("click", (e) => {
    //     if (!document.getElementById("userArea").contains(e.target)) {
    //         userMenu.classList.remove("active");
    //     }
    // });
}

/* ----------sidebar----------*/

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

    // Sidebar
    const sidebar = document.getElementById("sidebar");
    if (
        sidebar &&
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        e.target.id !== "menuBtn"
    ) {
        sidebar.classList.remove("active");
    }

    // Menu użytkownika
    const userArea = document.getElementById("userArea");
    const userMenu = document.getElementById("userMenu");

    if (
        userArea &&
        userMenu &&
        !userArea.contains(e.target)
    ) {
        userMenu.classList.remove("active");
    }

});

// document.addEventListener("click", (e)=>{

//     const menu = document.getElementById("userMenu");
//     const info = document.getElementById("userInfo");

//     if(menu && info && !menu.contains(e.target) && !info.contains(e.target)){
//         menu.classList.remove("active");
//     }

// });

function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}

// document.addEventListener(
// "DOMContentLoaded",
// showUser
// );

supabaseClient.auth.onAuthStateChange(async () => {
    await showUser();
    await updateSidebar();
});