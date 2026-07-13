 const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
 const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';
 const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function back() {
    window.location.href = "../strona startowa/start.html";
}

function sprawdzCheckbox() {
    const checkbox = document.getElementById("agree");
    const button = document.getElementById("registerBtn");

    button.disabled = !checkbox.checked;
}

async function checkPasswords() {
    const email = document.getElementById("email").value;
    const password1 = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    const error = document.getElementById("passwordError");
    const status = document.getElementById("status");

    error.textContent = "";
    status.textContent = "";

    if (password1.length < 8) {
        error.textContent = "Hasło musi mieć co najmniej 8 znaków.";
        return;
    }

    if (password1 !== password2) {
        error.textContent = "Hasła muszą być takie same.";
        return;
    }


    const { data, error: supabaseError } = await supabaseClient.auth.signUp({
        email: email,
        password: password1
    });


    if (supabaseError) {
        status.textContent = "Błąd rejestracji: " + supabaseError.message;
        return;
    }


    console.log("Rejestracja udana", data);

    window.location.href = "../Profil/prof.html";
}

// function checkPasswords() {
//     const password1 = document.getElementById("password").value;
//     const password2 = document.getElementById("password2").value;
//     const error = document.getElementById("passwordError");

//     error.textContent = "";

//      if (password1.length < 8) {
//         error.textContent = "Hasło musi mieć co najmniej 8 znaków.";
//         return;
//     }
//     if (password1 !== password2) {
//         error.textContent = "Hasła muszą być takie same.";
//         return;
//     }
// }
// function sprawdzCheckbox() {
//     const checkbox = document.getElementById("agree");
//     const button = document.getElementById("registerBtn");

//     button.disabled = !checkbox.checked;
// }


//   // 3. Zapis do bazy (rejestracja przez Supabase Auth)
//   const { data, error } = await supabaseClient.auth.signUp({
//     email: email,
//     password: haslo
//   });

//   if (error) {
//     statusEl.textContent = 'Błąd rejestracji: ' + error.message;
//     return;
//   }

//   // 4. Przekierowanie na kolejną stronę
//   window.location.href = '../Profil/prof.html';
// });
