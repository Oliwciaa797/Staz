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

/* ---------- Toast ---------- */
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 2600);
}

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
    document.getElementById('profileName').textContent = displayName;
    document.getElementById('authNotice').style.display = 'none';
    document.getElementById('quizBuilder').style.display = 'block';
    renderQuestionsList();
  } catch (e) {
    console.error(e);
    showToast('Nie udało się połączyć z Supabase.');
  }
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
      if(!text){ showToast('Podaj treść pytania.'); return; }
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
    if(rows >= 6){ showToast('Maksymalnie 6 opcji.'); return; }
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
      <input type="${inputType}" name="qfOptionCorrect">
      <input type="text" class="qfOptionText" placeholder="Treść odpowiedzi">
      <button type="button" class="remove-option" title="Usuń opcję">×</button>
    `;
    row.querySelector('.remove-option').addEventListener('click', () => {
      if(optionsList.querySelectorAll('.option-row').length <= 2){
        showToast('Pytanie musi mieć co najmniej 2 opcje.');
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
    if(!text){ showToast('Podaj treść pytania.'); return; }

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

    if(options.length < 2){ showToast('Podaj co najmniej 2 wypełnione opcje.'); return; }
    if(correct.length === 0){ showToast('Zaznacz co najmniej jedną poprawną odpowiedź.'); return; }

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
    showToast('Zaloguj się, aby zapisać quiz.');
    return;
  }

  const title = document.getElementById('quizTitle').value.trim();
  const isPublic = document.getElementById('quizPublic').checked;

  if(!title){
    showToast('Podaj nazwę quizu.');
    return;
  }
  if(questions.length === 0){
    showToast('Dodaj co najmniej jedno pytanie.');
    return;
  }

  const btn = document.getElementById('saveQuizBtn');
  btn.disabled = true;
  btn.textContent = 'ZAPISYWANIE…';

  const { error } = await supabaseClient.from('quizzes').insert({
    user_id: currentUser.id,
    title,
    is_public: isPublic,
    questions
  });

  btn.disabled = false;
  btn.textContent = 'ZAPISZ QUIZ';

  if(error){
    showToast('Błąd zapisu: ' + error.message);
    return;
  }

  showToast('Quiz zapisany!');
  setTimeout(() => { window.location.href = 'not.html'; }, 900);
});