const SUPABASE_URL = "TWOJ_URL";
const SUPABASE_KEY = "TWOJ_KEY";

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
}