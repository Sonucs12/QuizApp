import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getDatabase,
  ref,
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("create-quiz-btn").addEventListener("click", () => {
    toggleSections("create-quiz-section");
  });
  let questionsSaved = false; // Flag to track if questions are saved
  let questions = [];
  let currentQuestionIndex = 0;
  let score = 0;

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
  // Function to display questions in the list
  function displayQuestions() {
    const questionList = document.getElementById("question-list");
    questionList.innerHTML = ""; // Clear the current list
    questions.forEach((q, index) => {
      const li = document.createElement("li");
      li.style.listStyle = "none";
      li.textContent = `${index + 1}. ${q.question}`;
      questionList.appendChild(li);
    });
  }

  /// Firebase save question
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
              currentQuestionIndex = 0; //
              loadQuestion();
              toggleSections("attempt-quiz-section");
            } else {
              showAlert("No questions found for the selected quiz.", "danger");
            }
          }
        } else {
          showAlert("Quiz not found. Please check the title.", "danger");
        }
      })
      .catch((error) => {
        console.error("Error fetching quizzes:", error);
      });
  }

  document.getElementById("attempt-quiz-btn").addEventListener("click", () => {
    toggleSections("attempt-quiz-section");
    attemptQuiz();
    loadQuestion();
  });

  function attemptQuiz() {
    const quizzesRef = ref(database, "quizzes");
    // Fetch all quizzes
    onValue(quizzesRef, (snapshot) => {
      const quizzes = snapshot.val();
      const buttonContainer = document.getElementById("button-container");
      buttonContainer.innerHTML = ""; // Clear previous buttons
      if (quizzes) {
        Object.keys(quizzes).forEach((key) => {
          const quiz = quizzes[key];
          const button = document.createElement("button");
          button.textContent = quiz.title;
          button.classList.add("btn", "btn-primary");
          buttonContainer.insertBefore(button, buttonContainer.firstChild);
          button.onclick = () => loadQuizQuestions(key);
        });
      } else {
        buttonContainer.innerHTML = "<p>No quizzes available.</p>";
      }
    });
  }

  // Function to load questions for the selected quiz
  function loadQuizQuestions(quizKey) {
    const quizRef = ref(database, "quizzes/" + quizKey);

    // Fetch the quiz data from Firebase
    onValue(
      quizRef,
      (snapshot) => {
        const quizData = snapshot.val();
        if (quizData) {
          questions = quizData.questions;
          currentQuestionIndex = 0;
          loadQuestion();

          toggleSections("attempt-quiz-section");
        } else {
          showAlert("Quiz not found. Please check the title.", "danger");
        }
      },
      {
        onlyOnce: true, // Fetch data only once
      }
    );
  }

  // Load Question Function
  function loadQuestion() {
    const questionElement = document.getElementById("question");
    const optionsElement = document.getElementById("options");

    if (
      questions.length === 0 ||
      currentQuestionIndex < 0 ||
      currentQuestionIndex >= questions.length
    ) {
      questionElement.textContent = "No questions available.";
      optionsElement.innerHTML = "";
      return; // Exit the function
    }

    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;

    document.getElementById("total-questions-created").textContent =
      totalQuestions;

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
          }}
      }
    });

    trackAttemptedQuestions(); 
  }

  document.getElementById("back-to-home-btn").addEventListener("click", () => {
    toggleSections("home-section");
  });

  document.getElementById("add-question-btn").addEventListener("click", () => {
    const question = document.getElementById("question-input").value;
    const options = Array.from(document.querySelectorAll(".option-input")).map(
      (input) => input.value
    );
    const correctOptionIndex = Array.from(
      document.querySelectorAll(".circle")
    ).findIndex((circle) => circle.classList.contains("selected"));

    if (
      question &&
      options.every((option) => option) &&
      correctOptionIndex !== -1
    ) {
      const questionNo = questions.length + 1;
      questions.push({
        question,
        options,
        correctAnswer: options[correctOptionIndex],
      });
      displayQuestions();
      resetInputs();
      document.getElementById("update-questionNo").textContent = questionNo + 1; // Update question number display
    } else {
      showAlert(
        "Please fill all fields and select the correct answer.",
        "danger"
      );
    }
  });

  document.getElementById("go-to-attempt-btn").addEventListener("click", () => {
    if (!questionsSaved) {
      showAlert("Please save the quiz before attempting it.", "danger");
      return;
    }
    // If questions are saved, proceed to attempt the quiz
    currentQuestionIndex = 0;
    loadQuestion();
    toggleSections("attempt-quiz-section");
    attemptQuiz();
  });

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

  document.querySelectorAll(".circle").forEach((circle) => {
    circle.addEventListener("click", function () {
      document
        .querySelectorAll(".circle")
        .forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
    });
  });

  function toggleSections(sectionId) {
    document.querySelectorAll(".container-section").forEach((section) => {
      section.classList.remove("active");
    });
    document.getElementById(sectionId).classList.add("active");
  }

  function displayQuestions() {
    const questionList = document.getElementById("question-list");
    questionList.innerHTML = "";
    questions.forEach((q, index) => {
      const li = document.createElement("li");
      li.style.listStyle = "none";
      li.textContent = `${index + 1}. ${q.question}`;
      questionList.appendChild(li);
    });
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

  function selectOption(selectedOption, button) {
    const currentQuestion = questions[currentQuestionIndex];
    const previousAnswer = currentQuestion.selectedAnswer; // Store previous selection
  
    // Save the new selected answer
    currentQuestion.selectedAnswer = selectedOption;
    localStorage.setItem(
      `selectedAnswer_${currentQuestionIndex}`,
      selectedOption
    );
  
    // Deselect all buttons first
    const buttons = document.querySelectorAll(".options button");
    buttons.forEach((btn) => {
      btn.style.backgroundColor = "";
    });
  
    button.style.backgroundColor = "#bb86fc";
  
    // Adjust Score Dynamically
    if (previousAnswer) {
      // If the previous answer was correct, decrement the score
      if (previousAnswer === currentQuestion.correctAnswer) {
        score--;
      }
    }
  
    // If the new selected answer is correct, increment the score
    if (selectedOption === currentQuestion.correctAnswer) {
      score++;
    }
  
    // Practice Mode: Highlight Correct and Incorrect Answers
    if (mode === "practice") {
      if (selectedOption === currentQuestion.correctAnswer) {
        button.style.backgroundColor = "green"; // Correct answer selected
      } else {
        button.style.backgroundColor = "red"; // Incorrect answer selected
  
        // Highlight the correct option after 1 second
        setTimeout(() => {
          buttons.forEach((btn) => {
            if (
              btn.textContent.trim() ===
              questions[currentQuestionIndex].correctAnswer
            ) {
              btn.style.backgroundColor = "green";
            }
          });
        }, 1000);
      }
    }
  }
  

  //reset quiz
  document.getElementById("reset-btn").addEventListener("click", () => {
    clearLocalStorage();
    resetQuizState();
  });

  function clearLocalStorage() {
    questions.forEach((_, index) => {
      localStorage.removeItem(`selectedAnswer_${index}`);
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
      // Clear selected answers for each question
      questions.forEach(question => {
        question.selectedAnswer = undefined; // Clear the selected answer
        question.attempted = false; // Reset attempted status
    });
    // Update the UI to reflect the reset
    document.getElementById("attempted-questions").textContent = attemptedQuestions;
    document.getElementById("total-questions-attempt").textContent =
      attemptedQuestions;
    document.getElementById("total-correct").textContent = 0; 
    document.getElementById("total-wrong").textContent = 0; 
    document.getElementById("total-questions").textContent = questions.length; 
    currentQuestionIndex = 0;
    loadQuestion();
  }

// Function to display result and review answers
function displayResult() {
  const totalQuestions = questions.length;
  const totalCorrect = score;
  const totalWrong = attemptedQuestions - totalCorrect;

  document.getElementById("total-questions").textContent = totalQuestions;
  document.getElementById("total-questions-attempt").textContent = attemptedQuestions;
  document.getElementById("total-correct").textContent = totalCorrect;
  document.getElementById("total-wrong").textContent = totalWrong;

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
                  answerText.style.color = (selectedAnswer === correctAnswer) ? "green" : "red"; 
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
    document.getElementById(
      "time-taken"
    ).textContent = `${timeTaken} seconds`;
    stopTimer();
  }

  toggleSections("results-dashboard");
}


  // Ensure Timer Stops on Quiz Submission
  document.getElementById("submit-quiz-btn").addEventListener("click", () => {
    if (mode === "exam") {
      stopTimer();
    }
    displayResult();
  });
  document.getElementById("re-Quiz").addEventListener("click", () => {
    toggleSections("attempt-quiz-section");
    attemptQuiz();
  });

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

  // CSV upload button handler
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

  // Function to parse the CSV file content
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

  let attemptedQuestions = 0;
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

  // Mode Toggle and Timer Logic Integration
  let mode = "practice";
  let timerInterval;
  let timeTaken = 0;
  // Mode Toggle Event Listener
  const modeToggle = document.getElementById("mode-toggle");
  const modeLabel = document.querySelector('label[for="mode-toggle"]');

  modeToggle.addEventListener("change", () => {
    if (modeToggle.checked) {
      mode = "exam";
      modeLabel.textContent = "Exam Mode";
      startExamMode();
    } else {
      mode = "practice";
      modeLabel.textContent = "Practice Mode";
      stopTimer();
    }
  });

  function startExamMode() {
    console.log("Exam Mode Activated");
    timeTaken = 0;
    startTimer();
  }

  // Start Practice Mode
  function startPracticeMode() {
    console.log("Practice Mode Activated");
    stopTimer();
  }

  // Timer Logic
  function startTimer() {
    let startTime = Date.now();
    timerInterval = setInterval(() => {
      timeTaken = Math.floor((Date.now() - startTime) / 1000); // Time in seconds
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }
});
