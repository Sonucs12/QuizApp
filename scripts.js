import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  push,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHuy-lhW8-tckHKulUMJw9jiqrgfxFsqA",
  authDomain: "quiz-application-fb17e.firebaseapp.com",
  databaseURL: "https://quiz-application-fb17e-default-rtdb.firebaseio.com",
  projectId: "quiz-application-fb17e",
  storageBucket: "quiz-application-fb17e.firebasestorage.app",
  messagingSenderId: "510244047812",
  appId: "1:510244047812:web:1cb2e10fc889c261b63291",
  measurementId: "G-KT636N9R56",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let questions = [];
let questionsSaved = false;
let currentQuestionIndex = 0;
let score = 0;
let correctAnswer = 0;
let wrongAnswer = 0;
let timeTaken = 0;
let attemptedQuestions = 0;
let mode = "practice";
let timerInterval;

function showAlert(message, type) {
  const alertContainer = document.createElement("div");
  alertContainer.className = `alert alert-${type} alert-dismissible fade show alert-container`;
  alertContainer.role = "alert";
  alertContainer.innerHTML = `
  <span>${message}</span>
`;
  document.body.appendChild(alertContainer);

  setTimeout(() => {
    alertContainer.classList.remove("show");
    setTimeout(() => {
      alertContainer.remove();
    }, 300);
  }, 2000);
}
function selectOption(selectedOption, button) {
  const currentQuestion = questions[currentQuestionIndex];
  const previousAnswer = currentQuestion.selectedAnswer;
  currentQuestion.selectedAnswer = selectedOption;
  localStorage.setItem(
    `selectedAnswer_${currentQuestionIndex}`,
    selectedOption
  );

  const buttons = document.querySelectorAll(".options button");
  buttons.forEach((btn) => {
    btn.style.backgroundColor = "";
  });

  button.style.backgroundColor = "#bb86fc";
  if (previousAnswer) {
    if (previousAnswer === currentQuestion.correctAnswer) {
      if (selectedOption !== currentQuestion.correctAnswer) {
        score--;
      }
    } else {
      if (selectedOption === currentQuestion.correctAnswer) {
        score++;
      }
    }
  } else {
    if (selectedOption === currentQuestion.correctAnswer) {
      score++;
    }
  }

  if (!currentQuestion.attempted) {
    currentQuestion.attempted = true;
    attemptedQuestions++;
    localStorage.setItem("attemptedQuestions", attemptedQuestions);
    document.getElementById("attempted-questions").textContent =
      attemptedQuestions;
  }
  if (mode === "practice") {
    if (selectedOption === currentQuestion.correctAnswer) {
      button.style.backgroundColor = "green";
    } else {
      button.style.backgroundColor = "red";
      setTimeout(() => {
        buttons.forEach((btn) => {
          if (
            btn.textContent.trim() ===
            questions[currentQuestionIndex].correctAnswer
          ) {
            btn.style.backgroundColor = "green";
          }
        });
      }, 800);
    }
  }
}

// Start Practice Mode
function startPracticeMode() {
  console.log("Practice Mode Activated");
  resetQuizState();
  stopTimer();
}

function startTimer() {
  let startTime = Date.now();
  const timerElement = document.getElementById("timer");

  timerInterval = setInterval(() => {
    timeTaken = Math.floor((Date.now() - startTime) / 1000);
    if (timerElement) {
      timerElement.textContent = `Time: ${timeTaken} seconds`;
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

const modeToggle = document.getElementById("mode-toggle");
const modeLabel = document.querySelector('label[for="mode-toggle"]');

function startExamMode() {
  console.log("Exam Mode Activated");
  resetQuizState();
  if (questions.length > 0) {
    score = 0;

    timeTaken = 0;
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.textContent = `Time: ${timeTaken} seconds`;
    }
    stopTimer();

    startTimer();
  } else {
    showAlert(
      "Questions are not loaded yet. Cannot start Exam Mode.",
      "danger"
    );
  }
}

function clearLocalStorage() {
  questions.forEach((_, index) => {
    localStorage.removeItem(`selectedAnswer_${index}`);
    localStorage.removeItem("attemptedQuestions");
    localStorage.removeItem("score");
    localStorage.removeItem("timeTaken");
  });
}
// Reset quiz state without removing questions and options
function resetQuizState() {
  questions.forEach((question) => {
    question.selectedAnswer = undefined;
  });
  clearLocalStorage();
  score = 0;
  attemptedQuestions = 0;
  timeTaken = 0;
  currentQuestionIndex = 0;

  questions.forEach((question) => {
    question.selectedAnswer = undefined;
    question.attempted = false;
  });

  document.getElementById("attempted-questions").textContent =
    attemptedQuestions;

  const timerElement = document.getElementById("timer");
  if (timerElement) {
    timerElement.textContent = "";
  }

  stopTimer();
  loadQuestion();
}

// Load Question Function
function loadQuestion() {
  const questionElement = document.getElementById("question");
  const optionsElement = document.getElementById("options");
  const totalQuestionsElement = document.getElementById(
    "total-questions-created"
  );

  // Check if the elements exist in the current page
  if (!questionElement || !optionsElement || !totalQuestionsElement) {
    console.warn("One or more required elements are missing from the DOM.");
    return; // Exit the function
  }
  const totalQuestions = questions.length;
  document.getElementById("total-questions-created").textContent =
    totalQuestions;

  if (
    questions.length === 0 ||
    currentQuestionIndex < 0 ||
    currentQuestionIndex >= questions.length
  ) {
    questionElement.textContent = "No questions available.";
    optionsElement.innerHTML = "";
    return;
  }

  const currentQuestion = questions[currentQuestionIndex];

  questionElement.textContent = currentQuestion.questionText;
  optionsElement.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.classList.add(
      "btn",
      "btn-outline-primary",
      "w-100",
      "mb-2",
      "option"
    );
    button.style.color = "white";
    button.dataset.questionIndex = currentQuestionIndex;
    button.onclick = () => selectOption(option, button);
    optionsElement.appendChild(button);

    if (currentQuestion.selectedAnswer === option) {
      button.style.backgroundColor = "#bb86fc";
      if (mode === "practice") {
        if (option === currentQuestion.correctAnswer) {
          button.style.backgroundColor = "green";
        } else {
          button.style.backgroundColor = "red";

          optionsElement.querySelectorAll(".option").forEach((btn) => {
            if (btn.textContent.trim() === currentQuestion.correctAnswer) {
              btn.style.backgroundColor = "green";
            }
          });
        }
      }
    }
  });

  trackAttemptedQuestions();
}
function trackAttemptedQuestions() {
  const optionInputs = document.querySelectorAll(".option");
  optionInputs.forEach((input) => {
    input.addEventListener("click", function () {
      const questionIndex = this.dataset.questionIndex;

      if (!questions[questionIndex].attempted) {
        questions[questionIndex].attempted = true;
        attemptedQuestions++;
        document.getElementById("attempted-questions").textContent =
          attemptedQuestions;
      }
    });
  });
}
loadQuizQuestions();
function loadQuizQuestions(title) {
  const quizRef = ref(database, "quizzes");

  get(quizRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const quizzes = snapshot.val();
        const quizKey = Object.keys(quizzes).find(
          (key) => quizzes[key].title === title
        );
        if (quizKey) {
          const quizData = quizzes[quizKey];
          if (quizData.questions && quizData.questions.length > 0) {
            questions = quizData.questions;
            currentQuestionIndex = 0;

            loadQuestion();
          } else {
            showAlert("No questions found for the selected quiz.", "danger");
          }
        }
      } else {
        if (page === "attempt-quiz") {
          showAlert("Quiz not found. Please check the title.", "danger");
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching quizzes:", error);
    });
}
document.addEventListener("DOMContentLoaded", function () {
  const savedQuestions = JSON.parse(localStorage.getItem("questions"));
  if (savedQuestions) {
    questions = savedQuestions;
    currentQuestionIndex = 0;
    loadQuestion();

    attemptedQuestions =
      parseInt(localStorage.getItem("attemptedQuestions"), 10) || 0;
    score = parseInt(localStorage.getItem("score"), 10) || 0;

    const attemptedQuestionsElement = document.getElementById(
      "attempted-questions"
    );
    if (attemptedQuestionsElement) {
      attemptedQuestionsElement.textContent = attemptedQuestions;
    }
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const page = document.body.getAttribute("data-page");
  if (page === "home") {
    const startQuizBtn = document.getElementById("start-quiz-btn");
    if (startQuizBtn) {
      startQuizBtn.addEventListener("click", () => {
        console.log("Navigating to Attempt Quiz!");
        window.location.href = "attempt-quiz.html";
        navigateToAttemptQuiz();
      });
    }
    const creatQuizBtn = document.getElementById("create-quiz-btn");
    if (creatQuizBtn) {
      creatQuizBtn.addEventListener("click", () => {
        console.log("Navigating to Create Quiz!");
        window.location.href = "create-quiz.html";
      });
    }

    function navigateToAttemptQuiz(event) {
      clearLocalStorage();
      localStorage.removeItem("questions");
      resetQuizState();
      window.location.href = "attempt-quiz.html";
    }

    document
      .getElementById("attemptQuizLink")
      .addEventListener("click", navigateToAttemptQuiz);
  }
  if (page === "create-quiz") {
    document.getElementById("upload-csv-btn").addEventListener("click", () => {
      const fileInput = document.getElementById("csv-upload");
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();

        reader.onload = function (event) {
          const fileContent = event.target.result;
          const parsedQuestions = parseCSV(fileContent);
          if (parsedQuestions && parsedQuestions.length > 0) {
            questions = parsedQuestions;
            displayQuestions();
            showAlert("CSV file uploaded successfully.", "success");
          } else {
            showAlert("No valid questions found in the CSV file.", "danger");
          }
        };

        reader.onerror = function () {
          showAlert("Failed to read CSV file.", "danger");
        };

        reader.readAsText(file);
      } else {
        showAlert("Please select a CSV file to upload.", "danger");
      }
    });

    function parseCSV(csvContent) {
      const rows = csvContent
        .split("\n")
        .map((row) => row.trim())
        .filter((row) => row);
      const questionsArray = [];

      rows.forEach((row) => {
        const columns = row.split(",").map((column) => column.trim());
        if (columns.length === 6) {
          const [
            questionText,
            option1,
            option2,
            option3,
            option4,
            correctAnswer,
          ] = columns;
          questionsArray.push({
            question: questionText,
            options: [option1, option2, option3, option4],
            correctAnswer: correctAnswer,
          });
        }
      });

      return questionsArray;
    }

    document.getElementById("save-title-btn").addEventListener("click", () => {
      const titleInput = document.getElementById("question-title-input").value;
      if (titleInput) {
        document.getElementById("question-title").textContent = titleInput;
        displayQuestions();

        document.getElementById("question-title-input").value = "";

        const modalElement = document.getElementById("titleModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
      } else {
        const inputField = document.getElementById("question-title-input");
        inputField.placeholder = "Please add a title";
        inputField.classList.add("is-invalid");
      }
    });
    document.querySelectorAll(".circle").forEach((circle) => {
      circle.addEventListener("click", function () {
        document
          .querySelectorAll(".circle")
          .forEach((c) => c.classList.remove("selected"));
        this.classList.add("selected");
      });
    });

    document
      .getElementById("add-question-btn")
      .addEventListener("click", () => {
        const question = document.getElementById("question-input").value;
        const options = Array.from(
          document.querySelectorAll(".option-input")
        ).map((input) => input.value);
        const correctOptionIndex = Array.from(
          document.querySelectorAll(".circle")
        ).findIndex((circle) => circle.classList.contains("selected"));

        if (
          question &&
          options.every((option) => option) &&
          correctOptionIndex !== -1
        ) {
          if (!questions.length || questions.some((q) => !q || !q.question)) {
            questions = [];
          }
          const questionNo = questions.length + 1;
          questions.push({
            question,
            options,
            correctAnswer: options[correctOptionIndex],
          });
          displayQuestions();
          resetInputs();
          document.getElementById("update-questionNo").textContent =
            questionNo + 1;
        } else {
          showAlert(
            "Please fill all fields and select the correct answer.",
            "danger"
          );
        }
      });
    function displayQuestions() {
      const questionList = document.getElementById("question-list");
      const questionContainer = document.querySelector(".questionListDisplay");

      questionList.innerHTML = "";

      if (questions.length > 0) {
        questionContainer.style.display = "block";

        questions.forEach((q, index) => {
          const li = document.createElement("li");
          li.style.listStyle = "none";
          li.textContent = `${index + 1}. ${q.question}`;
          questionList.appendChild(li);
        });
      } else {
        questionContainer.style.display = "none";
      }
    }

    function resetInputs() {
      document.getElementById("question-input").value = "";
      document
        .querySelectorAll(".option-input")
        .forEach((input) => (input.value = ""));
      document
        .querySelectorAll(".circle")
        .forEach((circle) => circle.classList.remove("selected"));
    }

    document.getElementById("save-quiz-btn").addEventListener("click", () => {
      const titleInput = document.getElementById("question-title").textContent;

      if (!titleInput) {
        showAlert("Please add a title to save the quiz.", "danger");
        return;
      }

      if (questions.length > 0) {
        const quizData = {
          title: titleInput,
          questions: questions.map((q) => ({
            questionText: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        };

        const quizRef = ref(database, "quizzes");
        push(quizRef, quizData)
          .then(() => {
            showAlert("Quiz saved successfully.", "success");
            questionsSaved = true;
          })
          .catch((error) => {
            console.error("Error saving quiz:", error);
            alert("Failed to save quiz. Please try again.");
          });
      } else {
        showAlert("Please add questions to the quiz before saving.", "danger");
      }
    });
    document
      .getElementById("go-to-attempt-btn")
      .addEventListener("click", () => {
        if (!questionsSaved) {
          showAlert("Please save the quiz before attempting it.", "danger");
          return;
        }
        window.location.href = "attempt-quiz.html";
      });

    function navigateToAttemptQuiz(event) {
      clearLocalStorage();
      localStorage.removeItem("questions");
      resetQuizState();
      window.location.href = "attempt-quiz.html";
    }

    document
      .getElementById("attemptQuizLink")
      .addEventListener("click", navigateToAttemptQuiz);
  }

  if (page === "attempt-quiz") {
    // const questionContainer = document.getElementById("question-container");
    // const questionElement = document.getElementById("question");
    // const optionsElement = document.getElementById("options");
    // const navigationButtons = document.querySelectorAll("#previous-btn, #next-btn");
    // const arrowButton = document.getElementById("toggle-arrow");

    // if (!questionContainer || !arrowButton) {
    //   console.error("❌ Required elements (#question-container or #toggle-arrow) are missing from the DOM!");
    //   return;
    // }

    // let showAll = false;

    // function toggleQuestionView(mode) {
    //   if (mode === "all") {
    //     showAll = true;
    //     questionContainer.innerHTML = ""; // Clear single question view
    //     questionElement.style.display = "none"; // Hide single question view
    //     optionsElement.style.display = "none"; // Hide single options view

    //     // Display all questions
    //     questions.forEach((q, index) => {
    //       const questionBlock = document.createElement("div");
    //       questionBlock.classList.add("question-block", "mb-3", "p-2");
    //       questionBlock.innerHTML = `
    //         <h5 class= "mb-3">Q${index + 1}: ${q.questionText}</h5>
    //         <div>
    //           ${q.options
    //             .map(option => `<button class="btn btn-outline-primary w-100 mb-2 option">${option}</button>`)
    //             .join('')}
    //         </div>
    //       `;
    //       questionContainer.appendChild(questionBlock);
    //     });

    //     // Hide navigation buttons
    //     navigationButtons.forEach(btn => btn.style.display = "none");
    //     arrowButton.innerHTML = "↑"; // Change to up arrow
    //   } else {
    //     showAll = false;
    //     questionContainer.innerHTML = ""; // Clear all questions
    //     questionElement.style.display = "block"; // Show single question
    //     optionsElement.style.display = "block"; // Show options

    //     currentQuestionIndex = 0;
    //     loadQuestion();

    //     // Show navigation buttons
    //     navigationButtons.forEach(btn => {
    //       btn.style.display = "inline-block";
    //       btn.style.float = "left";
    //     });
    //     arrowButton.innerHTML = "↓"; // Change to down arrow
    //   }
    // }

    // // Event Listener for Arrow Button
    // arrowButton.addEventListener("click", () => {
    //   toggleQuestionView(showAll ? "one" : "all");
    // });

    // // Initial question load
    // loadQuestion();

    const modeToggle = document.getElementById("mode-toggle");
    modeToggle.addEventListener("change", () => {
      if (modeToggle.checked) {
        mode = "exam";
        modeLabel.textContent = "Exam Mode";
        startExamMode();
      } else {
        mode = "practice";
        modeLabel.textContent = "Practice Mode";
        startPracticeMode();
        stopTimer();
      }
    });
    loadQuestion();
    attemptQuiz();

    function loadQuizQuestions(quizKey) {
      const quizRef = ref(database, "quizzes/" + quizKey);

      attemptedQuestions = 0;
      localStorage.setItem("attemptedQuestions", attemptedQuestions);

      onValue(
        quizRef,
        (snapshot) => {
          const quizData = snapshot.val();
          if (quizData) {
            questions = quizData.questions;
            currentQuestionIndex = 0;
            loadQuestion();
          } else {
            showAlert("Quiz not found. Please check the title.", "danger");
          }
        },
        {
          onlyOnce: true,
        }
      );
    }

    function attemptQuiz() {
      const quizzesRef = ref(database, "quizzes");
      const loadingIndicator = document.getElementById("loading-indicator");
      const buttonContainer = document.getElementById("button-container");

      loadingIndicator.style.display = "block";
      buttonContainer.innerHTML = "";

      onValue(quizzesRef, (snapshot) => {
        const quizzes = snapshot.val();

        loadingIndicator.style.display = "none";

        if (quizzes) {
          Object.keys(quizzes).forEach((key) => {
            const quiz = quizzes[key];
            const button = document.createElement("button");
            button.textContent = quiz.title;
            button.classList.add("btn", "btn-primary");
            buttonContainer.insertBefore(button, buttonContainer.firstChild);
            button.onclick = () => {
              let titleText = quiz.title;
              sessionStorage.setItem("titleText", titleText);
              const storedTitleText = sessionStorage.getItem("titleText");
              document.getElementById("showQuizTitle").textContent =
                storedTitleText;


              score = 0;
              localStorage.setItem("score", score);

              timeTaken = 0;
              const timerElement = document.getElementById("timer");
              if (timerElement) {
                timerElement.textContent = "";
              }
              stopTimer();

              const modeToggle = document.getElementById("mode-toggle");
              if (modeToggle) {
                modeToggle.checked = false;
                modeLabel.textContent = "Practice Mode";
                mode = "practice";
              }

              loadQuizQuestions(key);
            };
          });
        } else {
          buttonContainer.innerHTML = "<p>No quizzes available.</p>";
        }
      });
    }

    document.getElementById("next-btn").addEventListener("click", () => {
      if (currentQuestionIndex + 1 < questions.length) {
        currentQuestionIndex++;
        loadQuestion();
      } else {
        showAlert("You have reached the end of the quiz.", "info");
      }
    });
    document.getElementById("previous-btn").addEventListener("click", () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
      }
    });

    //reset quiz
    document.getElementById("reset-btn").addEventListener("click", () => {
      clearLocalStorage();
      resetQuizState();
    });

    document.getElementById("submit-quiz-btn").addEventListener("click", () => {
      if (mode === "exam") {
        stopTimer();
      }

      localStorage.setItem("questions", JSON.stringify(questions));
      localStorage.setItem("score", score);
      localStorage.setItem("attemptedQuestions", attemptedQuestions);
      localStorage.setItem("timeTaken", timeTaken);
      window.location.href = "dashboard.html";
    });
    function startTimer() {
      let startTime = Date.now();
      const timerElement = document.getElementById("timer");

      timerInterval = setInterval(() => {
        timeTaken = Math.floor((Date.now() - startTime) / 1000);

        if (timerElement) {
          timerElement.textContent = `Time: ${timeTaken} sec`;
        }
      }, 1000);
    }
  }
  if (page === "dashboard") {
    const storedTitleText = sessionStorage.getItem("titleText");
    document.getElementById("show-title-inDashboard").textContent =
      storedTitleText;
    document.getElementById("show-title-inDashboard").textContent =
      storedTitleText;
    const storedQuestions = JSON.parse(localStorage.getItem("questions"));
    const storedScore = parseInt(localStorage.getItem("score"), 10) || 0;
    const storedAttemptedQuestions =
      parseInt(localStorage.getItem("attemptedQuestions"), 10) || 0;
    const storedTimeTaken =
      parseInt(localStorage.getItem("timeTaken"), 10) || 0;

    // Use stored data
    if (storedQuestions && storedQuestions.length > 0) {
      questions = storedQuestions;
      score = storedScore;
      attemptedQuestions = storedAttemptedQuestions;
      timeTaken = storedTimeTaken;

      displayResult();
    } else {
      console.error("No quiz data found in localStorage.");
    }
    function displayResult() {
      const totalQuestions = questions.length;
      const totalCorrect = score;
      const totalWrong = attemptedQuestions - totalCorrect;

      document.getElementById("total-questions").textContent = totalQuestions;
      document.getElementById("total-questions-attempt").textContent =
        attemptedQuestions;
      document.getElementById("total-correct").textContent = totalCorrect;
      document.getElementById("total-wrong").textContent = totalWrong;
      // Display the time taken
      const timeTakenElement = document.getElementById("time-taken");
      if (timeTaken > 0) {
        timeTakenElement.textContent = `Time Taken: ${timeTaken} sec`;
      }
      const reviewContainer = document.querySelector(".review-container");
      const reviewList = document.getElementById("view-review");
      reviewList.innerHTML = "";

      if (attemptedQuestions > 0) {
        questions.forEach((question, index) => {
          if (question.attempted) {
            const reviewItem = document.createElement("li");
            reviewItem.classList.add("review-item");

            const questionText = document.createElement("p");
            questionText.textContent = `${index + 1}. ${question.questionText}`;
            reviewItem.appendChild(questionText);

            const selectedAnswer = question.selectedAnswer;
            const correctAnswer = question.correctAnswer;

            const answerText = document.createElement("p");
            if (selectedAnswer === undefined) {
              answerText.textContent = "You did not attempt this question.";
              answerText.style.color = "orange";
            } else {
              answerText.textContent = `Your answer: ${selectedAnswer}`;
              answerText.style.color =
                selectedAnswer === correctAnswer ? "green" : "red";
            }
            reviewItem.appendChild(answerText);

            const correctText = document.createElement("p");
            correctText.textContent = `Correct answer: ${correctAnswer}`;
            correctText.style.color = "green";
            reviewItem.appendChild(correctText);

            reviewList.appendChild(reviewItem);
          }
        });

        reviewContainer.style.display = "block";
      } else {
        reviewContainer.style.display = "none";
      }

      if (mode === "exam") {
        stopTimer();
        document.getElementById(
          "time-taken"
        ).textContent = `${timeTaken} sec`;
      }
    }
    displayResult();
    document.getElementById("re-Quiz").addEventListener("click", () => {
      window.location.replace("attempt-quiz.html");
      attemptQuiz();
    });

    document
      .getElementById("dashboard-to-home-btn")
      .addEventListener("click", () => {
        clearLocalStorage();
        localStorage.removeItem("questions");
        window.location.replace("index.html");
      });

    function navigateToAttemptQuiz(event) {
      clearLocalStorage();
      localStorage.removeItem("questions");
      resetQuizState();
      window.location.replace("attempt-quiz.html");
    }

    document
      .getElementById("attemptQuizLink")
      .addEventListener("click", navigateToAttemptQuiz);
  }

  if (page === "feedback") {
    const stars = document.querySelectorAll(".rating-star");
    let selectedRating = 0;

    // Star Rating Logic
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        selectedRating = star.getAttribute("data-value");
        stars.forEach((s, index) => {
          s.classList.toggle("active", index < selectedRating);
        });
      });
    });

    // Submit Feedback Logic
    document.getElementById("submitFeedback").addEventListener("click", () => {
      const errorReported = document.getElementById("errorSelect").value;
      const improvementSuggestions =
        document.getElementById("improvement").value;

      if (!selectedRating) {
        alert("Please select a rating before submitting feedback.");
        return;
      }

      const emailBody = `
          Feedback from Quiz App User:
          - Error Encountered: ${errorReported}
          - Rating: ${selectedRating} stars
          - Suggestions: ${improvementSuggestions || "No suggestions provided"}
        `;

      // Open mail client
      window.location.href = `mailto:onlysonuk2@gmail.com?subject=Quiz App Feedback&body=${encodeURIComponent(
        emailBody
      )}`;
    });
  }
});
