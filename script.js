const questions = [
    {
        question: "Jaka jest stolica Polski?",
        answers: ["Kraków", "Warszawa", "Gdańsk", "Wrocław"],
        correctIndex: 1
    },
    {
        question: "Ile kontynentów jest na Ziemi?",
        answers: ["5", "6", "7", "8"],
        correctIndex: 2
    },
    {
        question: "Który pierwiastek chemiczny ma symbol \"O\"?",
        answers: ["Złoto", "Tlen", "Ołów", "Osmium"],
        correctIndex: 1
    },
    {
        question: "Kto namalował \"Mona Lisę\"?",
        answers: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
        correctIndex: 2
    },
    {
        question: "Jaki jest wynik działania 7 x 8?",
        answers: ["54", "56", "58", "64"],
        correctIndex: 1
    }
];

let currentQuestionIndex = 0;
let userAnswers = new Array(questions.length).fill(null);

const app = document.getElementById("quiz-app");

function renderQuestion() {
    const question = questions[currentQuestionIndex];
    const selected = userAnswers[currentQuestionIndex];
    const isLast = currentQuestionIndex === questions.length - 1;

    app.innerHTML = `
        <div class="card">
            <h1>Quiz Web</h1>
            <p class="progress">Pytanie ${currentQuestionIndex + 1} z ${questions.length}</p>
            <p class="question-text">${question.question}</p>
            <div class="answers">
                ${question.answers.map((answer, index) => `
                    <label class="answer-option${selected === index ? " selected" : ""}">
                        <input type="radio" name="answer" value="${index}" ${selected === index ? "checked" : ""}>
                        <span>${answer}</span>
                    </label>
                `).join("")}
            </div>
            <button id="next-btn" ${selected === null ? "disabled" : ""}>
                ${isLast ? "Zakończ quiz" : "Dalej"}
            </button>
        </div>
    `;

    app.querySelectorAll('input[name="answer"]').forEach((input) => {
        input.addEventListener("change", (event) => {
            userAnswers[currentQuestionIndex] = Number(event.target.value);
            renderQuestion();
        });
    });

    document.getElementById("next-btn").addEventListener("click", () => {
        if (isLast) {
            renderResult();
        } else {
            currentQuestionIndex++;
            renderQuestion();
        }
    });
}

function renderResult() {
    const score = questions.reduce(
        (total, question, index) => total + (userAnswers[index] === question.correctIndex ? 1 : 0),
        0
    );

    app.innerHTML = `
        <div class="card">
            <h1>Wynik quizu</h1>
            <p class="result-score">Twój wynik: <strong>${score} / ${questions.length}</strong></p>
            <div class="result-list">
                ${questions.map((question, index) => {
                    const userAnswerIndex = userAnswers[index];
                    const isCorrect = userAnswerIndex === question.correctIndex;
                    const userAnswerText = question.answers[userAnswerIndex];
                    const correctAnswerText = question.answers[question.correctIndex];

                    return `
                        <div class="result-item">
                            <p class="question-text">${index + 1}. ${question.question}</p>
                            <p class="result-answer ${isCorrect ? "correct" : "incorrect"}">
                                ${isCorrect ? "✓" : "✗"} Twoja odpowiedź: ${userAnswerText}
                            </p>
                            ${!isCorrect ? `
                                <p class="result-answer correct">
                                    ✓ Poprawna odpowiedź: ${correctAnswerText}
                                </p>
                            ` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
            <button id="restart-btn">Zacznij od nowa</button>
        </div>
    `;

    document.getElementById("restart-btn").addEventListener("click", () => {
        currentQuestionIndex = 0;
        userAnswers = new Array(questions.length).fill(null);
        renderQuestion();
    });
}

renderQuestion();
