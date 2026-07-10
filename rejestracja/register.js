function back() {
    window.location.href = "../strona startowa/start.html";
}

const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const statusEl = document.getElementById('status');

document.getElementById('guzik').addEventListener('click', async function() {
  const email = document.getElementById('email').value;
  const haslo = document.getElementById('password1').value;
  const haslo2 = document.getElementById('password2').value;
  const zaakceptowano = document.getElementById('check').checked;

  // 1. Sprawdzenie hasła
  if (haslo !== haslo2) {
    statusEl.textContent = 'Błąd: hasła nie są takie same!';
    return;
  }

  if (haslo.length < 6) {
    statusEl.textContent = 'Błąd: hasło musi mieć min. 6 znaków';
    return;
  }

  // 2. Sprawdzenie checkboxa
  if (!zaakceptowano) {
    statusEl.textContent = 'Musisz zaakceptować regulamin!';
    return;
  }

  // 3. Zapis do bazy (rejestracja przez Supabase Auth)
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: haslo
  });

  if (error) {
    statusEl.textContent = 'Błąd rejestracji: ' + error.message;
    return;
  }

  // 4. Przekierowanie na kolejną stronę
  window.location.href = 'kolejna-strona.html';
});