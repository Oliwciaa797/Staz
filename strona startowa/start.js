console.log("JS is working");

const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const cache = {};
const API_KEY = "AIzaSyCTX8K53tIFW1_vUY828xfjYkvuGygnX_w";

document.addEventListener("DOMContentLoaded",()=>{
    initSearch();
    initFilters();
    initSidebar();
    initUser();
    initSlider();
    updateSidebar();
});

/* =========================
   SEARCH INPUT
========================= */
function initSearch(){
    const input = document.getElementById("searchInput");
    const btn = document.getElementById("searchBtn");

    if(input){
        input.addEventListener("keydown",(e)=>{
            if(e.key==="Enter"){
                e.preventDefault();
                search();
            }

        });
    }
    if(btn){
        btn.addEventListener("click",search);
    }
}

/* =========================
   SLIDER
========================= */
function initSlider(){

    const slider =
    document.getElementById("slider");

    const value =
    document.getElementById("durationValue");

    if(!slider || !value) return;

    noUiSlider.create(slider,{
        start:[10,60],
        connect:true,
        range:{
            min:0,
            max:300
        },
        step:1
    });

    slider.noUiSlider.on("update",(values)=>{

        value.textContent =
        `${Math.round(values[0])} min - ${Math.round(values[1])} min`;

    });

}

/* =========================
   FILTRY
========================= */
function initFilters(){
    btn.addEventListener("click",(e)=>{

    console.log("klik filtr");

    e.stopPropagation();

    box.classList.toggle("show");

});

    const btn =
    document.getElementById("filtersBtn");

    const box =
    document.getElementById("filtersDropdown");

    if(!btn || !box){
        console.log("Brak filtrów");
        return;
    }

    btn.addEventListener("click",(e)=>{

        e.stopPropagation();

        box.classList.toggle("show");

    });

    document.addEventListener("click",(e)=>{
        if(
            !box.contains(e.target)
            &&
            !btn.contains(e.target)
        ){
            box.classList.remove("show");
        }

    });

}

/* =========================
   SIDEBAR
========================= */
function initSidebar(){

    const menuBtn =
    document.getElementById("menuBtn");

    const sidebar =
    document.getElementById("sidebar");

    if(!menuBtn || !sidebar) return;

    menuBtn.addEventListener("click",(e)=>{

        e.stopPropagation();
        sidebar.classList.toggle("active");
    });

    document.addEventListener("click",(e)=>{

        if(
            sidebar.classList.contains("active")
            &&
            !sidebar.contains(e.target)
            &&
            !menuBtn.contains(e.target)
        ){
            sidebar.classList.remove("active");
        }

    });

}

/* =========================
   USER
========================= */
async function initUser(){

    const userArea =
    document.getElementById("userArea");

    if(!userArea) return;

    const {
        data:{user}
    } = await supabaseClient.auth.getUser();

    if(!user){

        userArea.innerHTML=`
        <button class="login-btn"
        onclick="goToLogin()">
        Zaloguj
        </button>
        `;

        return;

    }

    const {
        data:profile
    } = await supabaseClient
    .from("profiles")
    .select("profiles,avatar_url")
    .eq("id",user.id)
    .single();

    const avatar =
    profile?.avatar_url ||
    "../Profil/avatar.png";

    userArea.innerHTML=`

    <div class="user-info" id="userInfo">

        <img class="avatar"
        src="${avatar}">

        <span>
        Witaj, ${profile?.profiles || ""}
        </span>

    </div>

    <div class="user-menu"
    id="userMenu">

        <a href="../Profil/prof.html">
        Profil
        </a>

        <a href="../wylogowywanie/logout.html">
        Wyloguj się
        </a>

    </div>
    `;
    const info =
    document.getElementById("userInfo");

    const menu =
    document.getElementById("userMenu");

    info.addEventListener("click",(e)=>{

        e.stopPropagation();
        menu.classList.toggle("active");

    });

    document.addEventListener("click",(e)=>{

        if(
            menu &&
            !menu.contains(e.target)
        ){
            menu.classList.remove("active");
        }
    });
}

/* =========================
   SIDEBAR CONTENT
========================= */
async function updateSidebar(){

    const sidebar =
    document.getElementById("sidebar");

    if(!sidebar) return;

    const {

        data:{user}

    } = await supabaseClient.auth.getUser();

    if(user){

        sidebar.innerHTML=`

        <a href="../strona startowa/start.html">
        Strona Startowa
        </a>

        <a href="../materialy/not.html">
        Zapisane materiały
        </a>

        <a href="../Profil/prof.html">
        Profil
        </a>

        <a href="../wylogowywanie/logout.html">
        Wyloguj się
        </a>
        `;
    }else{
        sidebar.innerHTML=`

        <a href="../strona startowa/start.html">
        Strona Startowa
        </a>

        <a href="../logowanie/log.html">
        Logowanie
        </a>
        `;
    }

}


/* =========================
   OTHER
========================= */
function goToLogin(){
    window.location.href =
    "../logowanie/log.html";
}

function back(){
    window.location.href =
    "../strona startowa/start.html";
}