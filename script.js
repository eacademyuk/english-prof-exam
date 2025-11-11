// Timer Configuration
const TOTAL_TIME = 60 * 60; // 60 minutes in seconds
let timeRemaining = TOTAL_TIME;
let timerStarted = false; // Add a flag to prevent multiple timer starts
let timerInterval = null;
let examSubmitted = false;

// Flag to prevent the form from submitting prematurely
let allowSubmission = false;

// Answer Keys
const answerKeys = {
    listening: {
        q1: ['miller'],
        q2: ['0770918452', '0770 918 452'],
        q3: ['filling', 'a filling'],
        q4: ['wednesday'],
        q5: ['10:30', '10:30 am', '10:30am']
    },
    reading: {
        r1: 'B',
        r2: 'B',
        r3: 'B',
        r4: 'B',
        r5: 'B',
        r6: ['accessible'],
        r7: ['weight'],
        r8: ['injuries'],
        r9: ['stress'],
        r10: ['natural']
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeInstructions();
    initializeNavigation();
    initializeWordCounter();
    initializeSubmitButton();
    initializeModal();
});

// Instructions Page Logic
function initializeInstructions() {
    const startBtn = document.getElementById('start-exam-btn');
    const instructionsPage = document.getElementById('instructions-page');
    const mainContent = document.getElementById('main-exam-content');

    // Enable Start button only when name and email are provided and email looks valid
    const studentNameInput = document.getElementById('student-name');
    const studentEmailInput = document.getElementById('student-email');

    function isValidEmail(email) {
        // simple email regex
        return /^\S+@\S+\.\S+$/.test(email);
    }

    function validateStartButton() {
        const nameValid = studentNameInput && studentNameInput.value.trim().length > 0;
        const emailValid = studentEmailInput && isValidEmail(studentEmailInput.value.trim());
        if (startBtn) startBtn.disabled = !(nameValid && emailValid);
    }

    if (studentNameInput) studentNameInput.addEventListener('input', validateStartButton);
    if (studentEmailInput) studentEmailInput.addEventListener('input', validateStartButton);
    // run once on load
    validateStartButton();

    // Initially, only instructions page is active (done in HTML)
    
    startBtn.addEventListener('click', function() {
        // Hide instructions
        instructionsPage.classList.remove('active');
        instructionsPage.style.display = 'none';
        
        // Show main exam content
        mainContent.style.display = 'block';
        
        // Start the timer and navigation for the exam
        if (!timerStarted) {
            initializeTimer();
            timerStarted = true;
        }
        
        // Make the first section active
        switchSection('section1');
        document.querySelector('.nav-btn[data-section="section1"]').classList.add('active');
    });
}

// Timer Functions
function initializeTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(function() {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerElement.textContent = timeString;

    // Change color based on time remaining
    if (timeRemaining <= 300) { // 5 minutes
        timerElement.classList.add('danger');
        timerElement.classList.remove('warning');
    } else if (timeRemaining <= 900) { // 15 minutes
        timerElement.classList.add('warning');
        timerElement.classList.remove('danger');
    } else {
        timerElement.classList.remove('warning', 'danger');
    }
}

// Navigation Functions
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            switchSection(sectionId);
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function switchSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// Word Counter for Writing Section
function initializeWordCounter() {
    const writingTextarea = document.getElementById('writing-answer');
    if (writingTextarea) {
        writingTextarea.addEventListener('input', function() {
            const wordCount = countWords(this.value);
            document.getElementById('word-count-display').textContent = wordCount;
        });
    }
}

function countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Submit Button
function initializeSubmitButton() {
    const form = document.getElementById('exam-form');
    form.addEventListener('submit', function(event) {
        // Prevent submission if not explicitly allowed (i.e., by clicking the submit button)
        if (!allowSubmission) {
            event.preventDefault();
            alert('Please click the "Submit Exam" button at the end of the test to submit your answers.');
            return;
        }
        
        // Stop the timer before submission
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        if (examSubmitted) {
            // Prevent re-submission if already submitted
            event.preventDefault();
            return;
        }

        // 1. Confirm submission
        if (!confirm('Are you sure you want to submit your exam? You cannot make changes after submission.')) {
            event.preventDefault();
            return;
        }

        // 2. Stop the timer and mark as submitted
        examSubmitted = true;
        clearInterval(timerInterval);
        
        // 3. Calculate and display results (local)
        const answers = {
            listening: collectListeningAnswers(),
            reading: collectReadingAnswers(),
            writing: collectWritingAnswers(),
            speaking: collectSpeakingAnswers()
        };
        const results = gradeExam(answers);
        displayResults(results);
        
        // 4. Prepare hidden fields for FormSubmit (optional, FormSubmit handles all fields)
        // We will rely on FormSubmit to collect all form fields.
        
        // 5. Allow the form to submit (default action)
        // The form will now submit to FormSubmit.co
    });

    // We no longer need the old submitExam function, but we'll keep the logic inside the submit listener.
    
    // Add a listener to the actual submit button to allow submission
    const submitButton = document.querySelector('.submit-btn[type="submit"]');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            allowSubmission = true;
        });
    }
}

// The submitExam function is now integrated into the form's submit event listener in initializeSubmitButton.
// We will keep a simplified autoSubmitExam that just stops the timer and submits the form.
function submitExam() {
    // This function is kept for autoSubmitExam compatibility, but the main logic is in initializeSubmitButton.
    examSubmitted = true;
    clearInterval(timerInterval);
    allowSubmission = true; // Allow form submission for auto-submit
    document.getElementById('exam-form').submit();
}

function autoSubmitExam() {
    alert('Time is up! Your exam will be submitted automatically.');
    // We need to ensure the form is submitted when time runs out.
    // The submitExam function now handles the form submission.
    submitExam();
}

// Collect Answers
function collectListeningAnswers() {
    return {
        q1: document.getElementById('q1').value.trim().toLowerCase(),
        q2: document.getElementById('q2').value.trim().toLowerCase(),
        q3: document.getElementById('q3').value.trim().toLowerCase(),
        q4: document.getElementById('q4').value.trim().toLowerCase(),
        q5: document.getElementById('q5').value.trim().toLowerCase()
    };
}

function collectReadingAnswers() {
    return {
        r1: document.querySelector('input[name="r1"]:checked')?.value || '',
        r2: document.querySelector('input[name="r2"]:checked')?.value || '',
        r3: document.querySelector('input[name="r3"]:checked')?.value || '',
        r4: document.querySelector('input[name="r4"]:checked')?.value || '',
        r5: document.querySelector('input[name="r5"]:checked')?.value || '',
        r6: document.getElementById('r6').value.trim().toLowerCase(),
        r7: document.getElementById('r7').value.trim().toLowerCase(),
        r8: document.getElementById('r8').value.trim().toLowerCase(),
        r9: document.getElementById('r9').value.trim().toLowerCase(),
        r10: document.getElementById('r10').value.trim().toLowerCase()
    };
}

function collectWritingAnswers() {
    return {
        text: document.getElementById('writing-answer').value.trim(),
        wordCount: countWords(document.getElementById('writing-answer').value)
    };
}

function collectSpeakingAnswers() {
    const link = document.getElementById('speaking-link').value.trim();
    return {
        link: link
    };
}

// Grading Functions
function gradeExam(answers) {
    const listeningScore = gradeListening(answers.listening);
    const readingScore = gradeReading(answers.reading);
    const writingScore = gradeWriting(answers.writing);
    const speakingScore = gradeSpeaking(answers.speaking);

    const totalScore = listeningScore.score + readingScore.score;
    const totalPossible = 15; // 5 listening + 10 reading

    return {
        listening: listeningScore,
        reading: readingScore,
        writing: writingScore,
        speaking: speakingScore,
        totalScore: totalScore,
        totalPossible: totalPossible,
        percentage: ((totalScore / totalPossible) * 100).toFixed(1),
        bandScore: calculateBandScore(totalScore, totalPossible)
    };
}

function gradeListening(answers) {
    let score = 0;
    const details = [];

    // Q1: Miller
    if (answerKeys.listening.q1.includes(answers.q1)) {
        score++;
        details.push({ question: 1, correct: true, answer: answers.q1, expected: 'Miller' });
    } else {
        details.push({ question: 1, correct: false, answer: answers.q1, expected: 'Miller' });
    }

    // Q2: Phone Number
    if (answerKeys.listening.q2.includes(answers.q2)) {
        score++;
        details.push({ question: 2, correct: true, answer: answers.q2, expected: '0770 918 452' });
    } else {
        details.push({ question: 2, correct: false, answer: answers.q2, expected: '0770 918 452' });
    }

    // Q3: Reason for Visit
    if (answerKeys.listening.q3.includes(answers.q3)) {
        score++;
        details.push({ question: 3, correct: true, answer: answers.q3, expected: 'a filling' });
    } else {
        details.push({ question: 3, correct: false, answer: answers.q3, expected: 'a filling' });
    }

    // Q4: Day
    if (answerKeys.listening.q4.includes(answers.q4)) {
        score++;
        details.push({ question: 4, correct: true, answer: answers.q4, expected: 'Wednesday' });
    } else {
        details.push({ question: 4, correct: false, answer: answers.q4, expected: 'Wednesday' });
    }

    // Q5: Time
    if (answerKeys.listening.q5.includes(answers.q5)) {
        score++;
        details.push({ question: 5, correct: true, answer: answers.q5, expected: '10:30 am' });
    } else {
        details.push({ question: 5, correct: false, answer: answers.q5, expected: '10:30 am' });
    }

    return { score: score, details: details };
}

function gradeReading(answers) {
    let score = 0;
    const details = [];

    // Multiple choice questions (1-5)
    for (let i = 1; i <= 5; i++) {
        const key = 'r' + i;
        const isCorrect = answers[key] === answerKeys.reading[key];
        if (isCorrect) score++;
        details.push({
            question: i,
            correct: isCorrect,
            answer: answers[key],
            expected: answerKeys.reading[key]
        });
    }

    // Short answer questions (6-10)
    for (let i = 6; i <= 10; i++) {
        const key = 'r' + i;
        const isCorrect = answerKeys.reading[key].includes(answers[key]);
        if (isCorrect) score++;
        details.push({
            question: i,
            correct: isCorrect,
            answer: answers[key],
            expected: answerKeys.reading[key].join(' / ')
        });
    }

    return { score: score, details: details };
}

function gradeWriting(answers) {
    const feedback = [];
    const wordCount = answers.wordCount;

    if (wordCount < 150) {
        feedback.push(`⚠️ Word count is ${wordCount} words. Minimum required: 150 words.`);
    } else {
        feedback.push(`✓ Word count: ${wordCount} words (meets minimum requirement)`);
    }

    feedback.push('📝 Your writing will be evaluated by an instructor based on: Task Achievement, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.');

    return { feedback: feedback, wordCount: wordCount, text: answers.text };
}

function gradeSpeaking(answers) {
    const feedback = [];
    const link = answers.link;

    if (link === '') {
        feedback.push('⚠️ No audio link was provided for the Speaking section.');
    } else {
        feedback.push(`✓ Audio Link Provided: ${link}`);
    }

    feedback.push('🎤 Your speaking answer will be evaluated by an instructor based on: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.');

    return { feedback: feedback, link: link };
}

function calculateBandScore(score, total) {
    const percentage = (score / total) * 100;
    
    if (percentage >= 86.7) return '7.0+';
    if (percentage >= 66.7) return '6.0 - 6.5';
    if (percentage >= 46.7) return '5.0 - 5.5';
    if (percentage >= 26.7) return '4.0 - 4.5';
    return 'Below 4.0';
}

// Display Results
function displayResults(results) {
    const resultsBody = document.getElementById('results-body');
    resultsBody.innerHTML = '';

    // Total Score
    const totalScoreHtml = `
        <div class="total-score">
            <h3>Overall Results</h3>
            <p>Listening & Reading Score: <span class="score-display">${results.totalScore}/${results.totalPossible}</span></p>
            <p>Percentage: <span class="score-display">${results.percentage}%</span></p>
            <p>Estimated Band Score (CEFR): <span class="score-display">${results.bandScore}</span></p>
        </div>
    `;
    resultsBody.innerHTML += totalScoreHtml;

    // Listening Results
    const listeningHtml = `
        <div class="result-section">
            <h3>Section 1: Listening (${results.listening.score}/5)</h3>
            ${results.listening.details.map(detail => `
                <div class="result-item ${detail.correct ? 'correct' : 'incorrect'}">
                    <strong>Question ${detail.question}:</strong> 
                    ${detail.correct ? '✓ Correct' : '✗ Incorrect'}<br>
                    Your answer: <em>${detail.answer || '(no answer)'}</em><br>
                    Expected: <em>${detail.expected}</em>
                </div>
            `).join('')}
        </div>
    `;
    resultsBody.innerHTML += listeningHtml;

    // Reading Results
    const readingHtml = `
        <div class="result-section">
            <h3>Section 2: Reading (${results.reading.score}/10)</h3>
            ${results.reading.details.map(detail => `
                <div class="result-item ${detail.correct ? 'correct' : 'incorrect'}">
                    <strong>Question ${detail.question}:</strong> 
                    ${detail.correct ? '✓ Correct' : '✗ Incorrect'}<br>
                    Your answer: <em>${detail.answer || '(no answer)'}</em><br>
                    Expected: <em>${detail.expected}</em>
                </div>
            `).join('')}
        </div>
    `;
    resultsBody.innerHTML += readingHtml;

    // Writing Results
    const writingHtml = `
        <div class="result-section">
            <h3>Section 3: Writing (Manual Review Required)</h3>
            <div class="result-item">
                <strong>Word Count:</strong> ${results.writing.wordCount} words<br>
                ${results.writing.feedback.map(f => `<p>${f}</p>`).join('')}
            </div>
        </div>
    `;
    resultsBody.innerHTML += writingHtml;

    // Speaking Results
    const speakingHtml = `
        <div class="result-section">
            <h3>Section 4: Speaking (Manual Review Required)</h3>
            <div class="result-item">
                <strong>Audio Link:</strong> <a href="${results.speaking.link}" target="_blank">${results.speaking.link || 'No Link Provided'}</a><br>
                ${results.speaking.feedback.map(f => `<p>${f}</p>`).join('')}
            </div>
        </div>
    `;
    resultsBody.innerHTML += speakingHtml;
}

// Modal Functions
function initializeModal() {
    const modal = document.getElementById('results-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', function() {
        modal.classList.remove('show');
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });

    const printBtn = document.getElementById('print-btn');
    printBtn.addEventListener('click', function() {
        window.print();
    });
}

function showResultsModal() {
    const modal = document.getElementById('results-modal');
    modal.classList.add('show');
}

// Prevent accidental page reload
window.addEventListener('beforeunload', function(e) {
    if (!examSubmitted && timeRemaining > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
