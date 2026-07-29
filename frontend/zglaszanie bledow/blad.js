const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';


const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const toast = new Toast();
async function sendReport(){

    const {
        data:{user}
    } =
    await supabaseClient.auth.getUser();

    if(!user){

        toast.show('error','Zaloguj się',"Zaloguj się aby zgłosić błąd");

        return;
    }

    const pageName =
    document.getElementById("pageName").value;

    const bugType =
    document.getElementById("bugType").value;

    const description =
    document
    .getElementById("description")
    .value
    .trim();

    if(!description){

        toast.show('error','Błąd',"Opisz problem przed zgłoszeniem błędu");

        return;
    }

    const { error } =
    await supabaseClient
    .from("bug_reports")
    .insert({

        user_id:user.id,

        page_name:pageName,

        bug_type:bugType,

        description:description

    });

    if(error){

        console.error(error);

        toast.show('error','Błąd',"Zgłoszenie błędu nie powiodło się");

        return;
    }

    toast.show('success', 'Gotowe!','Zgłoszenie zostało wysłane')

    document
    .getElementById("description")
    .value = "";

}

function back() {
    history.back();
}
