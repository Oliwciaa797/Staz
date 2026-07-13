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

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password1 = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    const error = document.getElementById("passwordError");
    const status = document.getElementById("status");


    error.textContent = "";
    status.textContent = "";


    if (!username) {
        error.textContent = "Podaj nazwę użytkownika.";
        return;
    }


    if (password1.length < 8) {
        error.textContent = "Hasło musi mieć co najmniej 8 znaków.";
        return;
    }


    if (password1 !== password2) {
        error.textContent = "Hasła muszą być takie same.";
        return;
    }



    // tworzenie konta
    const { data, error: supabaseError } = await supabaseClient.auth.signUp({
        email: email,
        password: password1
    });



    if (supabaseError) {
        status.textContent = "Błąd rejestracji: " + supabaseError.message;
        return;
    }



    // zapis do tabeli profiles
    const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert([
            {
                id: data.user.id,
                profiles: username
            }
        ]);



    if (profileError) {
        console.log(profileError);
        status.textContent = "Błąd zapisu profilu: " + profileError.message;
        return;
    }



    console.log("Rejestracja udana");

    window.location.href = "../Profil/prof.html";
}