console.log("video.js loaded");

function toggleMenu() {
    const sidebar =
    document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}


function goToLogin() {
    window.location.href =
    "../logowanie/log.html";
}

const params =
new URLSearchParams(window.location.search);


const videoId =
params.get("video");



const player =
document.getElementById("youtubeVideo");



if (videoId) {

    console.log("Video ID:", videoId);

    player.src =
    `https://www.youtube.com/embed/${videoId}?rel=0`;

}
else {

    console.error("Brak video ID");

    document.getElementById("notesContent").innerHTML =
    "Nie znaleziono filmu.";

}





async function generateNotes(){


    const notes =
    document.getElementById("notesContent");


    notes.innerHTML =
    "Generowanie notatek...";


    try {


        const response =
        await fetch(
            "http://localhost:5000/generate",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },


                body:JSON.stringify({

                    videoId: videoId

                })

            }
        );



        const data =
        await response.json();



        notes.innerHTML =
        data.notes;



    }


    catch(error){


        console.error(error);


        notes.innerHTML =
        "Nie udało się wygenerować notatek.";

    }


}