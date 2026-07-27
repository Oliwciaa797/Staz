const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';


const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params =
new URLSearchParams(
    window.location.search
);

const quizId =
params.get("id");

let loadedQuiz = null;

document.addEventListener(
    "DOMContentLoaded",
    loadQuiz
);

async function loadQuiz(){

    const { data, error } =
    await supabaseClient
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

    if(error){
        console.error(error);

        document.getElementById(
            "quizContent"
        ).innerHTML =
        "Nie udało się załadować quizu.";

        return;
    }

    loadedQuiz = data;

    document.getElementById(
        "quizTitle"
    ).textContent =
    data.title;

    renderQuestions(
        data.questions
    );
}

function renderQuestions(questions){

    const container =
    document.getElementById(
        "quizContent"
    );

    container.innerHTML = "";

    questions.forEach(
        (question,index)=>{

        const inputType =
        question.type === "multi"
        ? "checkbox"
        : "radio";

        const questionDiv =
        document.createElement("div");

        questionDiv.className =
        "question";

        questionDiv.innerHTML = `

            <h3>
                ${index + 1}.
                ${question.question}
            </h3>

            ${question.options.map(
                (option,optIndex)=>`
                    <label class="answer">
                        <input
                            type="${inputType}"
                            name="q${index}"
                            value="${optIndex}"
                        >
                        ${option}
                    </label>
                `
            ).join("")}
        `;
        container.appendChild(
            questionDiv
        );
    });
}

document
.getElementById("finishBtn")
.addEventListener(
    "click",
    checkQuiz
);

function checkQuiz(){

     // sprawdzenie czy wszystko zaznaczone
    for(let i = 0; i < loadedQuiz.questions.length; i++){

        const question = loadedQuiz.questions[i];

        const checked =
        document.querySelectorAll(
            `input[name="q${i}"]:checked`
        );

        if(question.type === "multi"){

            if(checked.length === 0){
                alert(
                    `Zaznacz odpowiedź w pytaniu ${i + 1}`
                );
                return;
            }

        } else {
            if(checked.length === 0){
                alert(
                    `Zaznacz odpowiedź w pytaniu ${i + 1}`
                );
                return;
            }
        }
        
    }

    let score = 0;

    loadedQuiz.questions.forEach(
        (question,index)=>{

        if(question.type === "multi"){

            const checked =
            Array.from(
                document.querySelectorAll(
                    `input[name="q${index}"]:checked`
                )
            ).map(
                input =>
                Number(input.value)
            );

            const selected =
            [...checked].sort();

            const correct =
            [...question.correct].sort();

            if(
                JSON.stringify(selected)
                ===
                JSON.stringify(correct)
            ){
                score++;
            }

        }
        else{

            const checked =
            document.querySelector(
                `input[name="q${index}"]:checked`
            );

            if(!checked){
                return;
            }

            if(
                question.correct.includes(
                    Number(
                        checked.value
                    )
                )
            ){
                score++;
            }
        }
    });

    document.getElementById(
        "quizResult"
    ).innerHTML = `

        <h2>
            Wynik:
            ${score}
            /
            ${loadedQuiz.questions.length}
        </h2>

        <p>
            ${Math.round(
                score /
                loadedQuiz.questions.length
                * 100
            )}% poprawnych odpowiedzi
        </p>

    `;
loadedQuiz.questions.forEach(
(question,index)=>{

    document
    .querySelectorAll(
        `input[name="q${index}"]`
    )
    .forEach(input=>{

        const value =
        Number(input.value);

        const label =
        input.closest("label");

        if(
            question.correct.includes(value)
        ){
            label.classList.add(
                "correct-answer"
            );
        }

        if(
            input.checked &&
            !question.correct.includes(value)
        ){
            label.classList.add(
                "selected-wrong"
            );
        }

        input.disabled = true;

    });

});

const finishBtn = document.getElementById("finishBtn");

finishBtn.textContent = "Powrót do panelu materiałów";

finishBtn.onclick = () => {
    window.location.href = "../materialy/not.html";
};

}

function back() {
    history.back();
}

document.addEventListener("DOMContentLoaded", () => {

    const drawer =
        document.getElementById("materialsDrawer");

    const drawerToggle =
        document.getElementById("drawerToggle");

    drawerToggle.addEventListener("click", () => {

        drawer.classList.toggle("open");

        if(drawer.classList.contains("open")){
            drawerToggle.innerHTML = ">";
        }else{
            drawerToggle.innerHTML = "<";
        }

    });

});
``