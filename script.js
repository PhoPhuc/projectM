// --- Hàm Helper: Ngẫu nhiên hóa mảng (Fisher-Yates Shuffle) ---
function shuffleArray(array) {
    const shuffledArray = [...array]; // Tạo bản sao để không thay đổi mảng gốc
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Hoán đổi vị trí
    }
    return shuffledArray;
}

// --- Code chính của ứng dụng Quiz ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Tham chiếu DOM ---
    const appContainer = document.getElementById('app-container');
    const screens = {
        subjectSelection: document.getElementById('subject-selection-screen'),
        quizList: document.getElementById('quiz-list-screen'),
        info: document.getElementById('info-screen'),
        quiz: document.getElementById('quiz-section'),
    };
    const subjectListContainer = document.getElementById('subject-list');
    const quizListContainer = document.getElementById('quiz-list');
    const quizListTitle = document.getElementById('quiz-list-title')?.querySelector('span');
    const backToSubjectsBtn = document.getElementById('back-to-subjects-btn');
    const backToQuizListBtn = document.getElementById('back-to-quiz-list-btn');
    const backToListAfterResultBtn = document.getElementById('back-to-list-after-result-btn');
    const infoQuizTitle = document.getElementById('quiz-title');
    const infoTotalQuestions = document.getElementById('info-total-questions');
    const infoTimeLimit = document.getElementById('info-time-limit');
    const startBtn = document.getElementById('start-btn');

    const quizToolbar = document.getElementById('quiz-toolbar');
    const backToQuizListFromQuizBtn = document.getElementById('back-to-quiz-list-from-quiz-btn');
    const submitButtonToolbar = document.getElementById('submit-btn-toolbar');

    const timerContainer = document.getElementById('timer-container');
    const timeLeftElement = document.getElementById('time-left');
    const quizContentContainer = document.getElementById('quiz');
    const submitButton = document.getElementById('submit-btn');
    const retryButton = document.getElementById('retry-btn');
    const scoreContainer = document.getElementById('score-container');
    const filterContainer = document.getElementById('filter-container');
    const resultContainer = document.getElementById('result-container');

    const multiFunctionButton = document.getElementById('multi-function-button');
    const multiFunctionMenu = document.getElementById('multi-function-menu');

    // --- Trạng thái ứng dụng ---
    let currentView = 'subjectSelection';
    let selectedSubjectSlug = null;
    let currentSubjectData = null;
    let selectedQuizData = null;
    let timerIntervalId = null;
    let remainingTime = 0;
    let shuffledQuizQuestions = [];

    // --- Danh sách các môn học có sẵn ---
    const availableSubjects = {
        'vat-li': { name: 'Vật lí', icon: 'ph-atom' },
        'hoa-hoc': { name: 'Hoá học', icon: 'ph-flask' },
        'lich-su': { name: 'Lịch sử', icon: 'ph-scroll' },
        'sinh-hoc': { name: 'Sinh học', icon: 'ph-dna' },
        'tin-hoc': { name: 'Tin học', icon: 'ph-laptop' }
    };

    // --- Biến toàn cục cho Countdown ---
    let currentCountdownTargetDate = null; // Lưu trữ đối tượng Date của môn thi tiếp theo
    let examCountdownInterval = null;
    const countdownEl = document.getElementById('countdown');
    const messageEl = document.getElementById('message'); // Tin nhắn phụ dưới bộ đếm (ví dụ: "Chúc bạn thi tốt")
    const countdownTitleEl = document.getElementById('countdown-title'); // Tiêu đề của bộ đếm

    // Lưu trữ giá trị trước đó của các chữ số countdown để tạo hiệu ứng
    let prevCountdownValues = {
        'days-tens': -1, 'days-units': -1, 'hours-tens': -1, 'hours-units': -1,
        'minutes-tens': -1, 'minutes-units': -1, 'seconds-tens': -1, 'seconds-units': -1,
    };


    // --- Hàm điều hướng màn hình ---
    function navigateTo(screenId) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenId]) {
            screens[screenId].classList.add('active');
            currentView = screenId;
            window.scrollTo(0, 0);

            const examScheduleEl = document.getElementById('exam-schedule-container');
            if (examScheduleEl) {
                if (screenId === 'subjectSelection') {
                    examScheduleEl.style.display = 'block';
                    displayExamSchedule(); // Làm mới lịch thi và bộ đếm khi quay lại màn hình chọn môn
                } else {
                    examScheduleEl.style.display = 'none';
                    if (examCountdownInterval) { // Dừng bộ đếm nếu không ở màn hình chọn môn
                        clearInterval(examCountdownInterval);
                        examCountdownInterval = null;
                    }
                }
            }
        } else {
            console.error("Screen ID not found:", screenId);
        }
    }

    // --- Hàm tạo thẻ môn học ---
    function createSubjectCard(subjectSlug, subjectInfo) {
        const card = document.createElement('div');
        card.classList.add('subject-card');
        card.dataset.subject = subjectSlug;
        card.innerHTML = `<i class="ph ${subjectInfo.icon || 'ph-book-open'}"></i><h3>${subjectInfo.name}</h3>`;
        card.addEventListener('click', () => {
            selectedSubjectSlug = subjectSlug;
            displayQuizList(subjectSlug);
        });
        return card;
    }

    // --- Hàm hiển thị danh sách môn học ---
    function displaySubjectSelection() {
        if (!subjectListContainer) {
            console.error("Lỗi: Không tìm thấy phần tử #subject-list trong HTML.");
            return;
        }
        subjectListContainer.innerHTML = '';
        for (const slug in availableSubjects) {
            const subjectInfo = availableSubjects[slug];
            const card = createSubjectCard(slug, subjectInfo);
            subjectListContainer.appendChild(card);
        }
        navigateTo('subjectSelection'); // Điều này cũng sẽ gọi displayExamSchedule
    }

    // --- Hàm tạo mục bài thi trong danh sách ---
    function createQuizListItem(quiz) {
        const listItem = document.createElement('div');
        listItem.classList.add('quiz-list-item');
        listItem.dataset.quizId = quiz.id;
        listItem.innerHTML = `<span>${quiz.title}</span><i class="ph ph-caret-right"></i>`;

        listItem.addEventListener('click', () => {
            const clickedQuizData = currentSubjectData?.quizzes.find(q => q.id === quiz.id);
            if (clickedQuizData && clickedQuizData.redirectUrl) {
                window.location.href = clickedQuizData.redirectUrl;
            } else if (clickedQuizData) {
                selectedQuizData = clickedQuizData;
                displayQuizInfo();
            } else {
                displayQuizList(selectedSubjectSlug);
            }
        });
        return listItem;
    }

    // --- Hàm hiển thị danh sách bài thi theo môn (Async) ---
    async function displayQuizList(subjectSlug) {
        if (!quizListContainer) return;
        quizListContainer.innerHTML = '<p>Đang tải danh sách bài thi...</p>';
        if (quizListTitle) {
             const subjectInfo = availableSubjects[subjectSlug];
             quizListTitle.textContent = subjectInfo?.name || '...';
        }

        try {
            const subjectModule = await import(`./data/${subjectSlug}.js`);
            currentSubjectData = subjectModule.default;

            if (!currentSubjectData || !currentSubjectData.quizzes) {
                quizListContainer.innerHTML = '<p>Không thể tải dữ liệu bài thi.</p>';
                navigateTo('quizList');
                return;
            }
            if (quizListTitle) quizListTitle.textContent = currentSubjectData.subjectName;

            quizListContainer.innerHTML = '';
            if (currentSubjectData.quizzes.length > 0) {
                currentSubjectData.quizzes.forEach(quiz => {
                    quizListContainer.appendChild(createQuizListItem(quiz));
                });
            } else {
                quizListContainer.innerHTML = '<p>Chưa có bài thi nào.</p>';
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu môn học:", subjectSlug, error);
            quizListContainer.innerHTML = '<p>Lỗi tải danh sách bài thi.</p>';
            currentSubjectData = null;
        }
        navigateTo('quizList');
    }

    // --- Hàm hiển thị thông tin bài thi ---
    function displayQuizInfo() {
        if (!selectedQuizData) {
            if (selectedSubjectSlug) displayQuizList(selectedSubjectSlug);
            else displaySubjectSelection();
            return;
        }
        if (infoQuizTitle) infoQuizTitle.textContent = selectedQuizData.title;
        if (infoTotalQuestions) infoTotalQuestions.textContent = selectedQuizData.questions.length;
        if (infoTimeLimit) infoTimeLimit.textContent = selectedQuizData.timeLimitMinutes;
        navigateTo('info');
    }

    // --- Các hàm tạo câu hỏi (MC, TF, Fill) ---
    function addImageToQuestionBlock(questionBlock, question) {
        if (question.imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = question.imageUrl;
            imgElement.alt = "Hình ảnh câu hỏi";
            imgElement.classList.add('question-image');
            const questionTextElement = questionBlock.querySelector('.question-text');
            if (questionTextElement) {
                questionTextElement.parentNode.insertBefore(imgElement, questionTextElement.nextSibling);
            } else {
                questionBlock.prepend(imgElement);
            }
        }
    }
    function createMCQuestionBlock(question, index) {
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');
        const questionText = document.createElement('p');
        questionText.classList.add('question-text');
        questionText.textContent = `Câu ${index + 1}. ${question.question}`;
        questionBlock.appendChild(questionText);
        addImageToQuestionBlock(questionBlock, question);
        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('options');
        question.options.forEach((option, optionIndex) => {
            const label = document.createElement('label');
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = `question-${index}`;
            radioInput.value = optionIndex;
            label.id = `q${index}_opt${optionIndex}`;
            label.appendChild(radioInput);
            label.appendChild(document.createTextNode(` ${option}`));
            optionsDiv.appendChild(label);
        });
        questionBlock.appendChild(optionsDiv);
        return questionBlock;
    }
    function createTFQuestionBlock(question, index) {
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');
        const questionText = document.createElement('p');
        questionText.classList.add('question-text');
        questionText.textContent = `Câu ${index + 1}. ${question.question}`;
        questionBlock.appendChild(questionText);
        addImageToQuestionBlock(questionBlock, question);
        const statementsContainer = document.createElement('div');
        statementsContainer.classList.add('statements-container');
        question.statements.forEach((statement, subIndex) => {
            const label = document.createElement('label');
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.name = `question-${index}-statement-${subIndex}`;
            checkboxInput.value = subIndex;
            label.id = `q${index}_s${subIndex}`;
            label.appendChild(checkboxInput);
            label.appendChild(document.createTextNode(` ${statement.text}`));
            statementsContainer.appendChild(label);
        });
        questionBlock.appendChild(statementsContainer);
        return questionBlock;
    }
    function createFillQuestionBlock(question, index) {
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');
        const questionText = document.createElement('p');
        questionText.classList.add('question-text');
        questionText.textContent = `Câu ${index + 1}. ${question.question}`;
        questionBlock.appendChild(questionText);
        addImageToQuestionBlock(questionBlock, question);
        const fillContainer = document.createElement('div');
        fillContainer.classList.add('fill-container');
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.classList.add('fill-input');
        inputElement.id = `question-${index}-input`;
        inputElement.placeholder = "Nhập câu trả lời của bạn...";
        fillContainer.appendChild(inputElement);
        questionBlock.appendChild(fillContainer);
        return questionBlock;
    }

    // --- Hàm hiển thị nội dung quiz ---
    function displayQuizContent(questionsArray) {
        if (!quizContentContainer) return;
        quizContentContainer.innerHTML = '';
        questionsArray.forEach((q, index) => {
            let questionBlock;
            if (q.type === 'mc') questionBlock = createMCQuestionBlock(q, index);
            else if (q.type === 'tf') questionBlock = createTFQuestionBlock(q, index);
            else if (q.type === 'fill') questionBlock = createFillQuestionBlock(q, index);
            if (questionBlock) quizContentContainer.appendChild(questionBlock);
        });
        if (resultContainer) { resultContainer.style.display = 'none'; resultContainer.innerHTML = ''; }
        if (scoreContainer) scoreContainer.style.display = 'none';
        if (filterContainer) filterContainer.style.display = 'none';
        if (retryButton) retryButton.style.display = 'none';
        if (backToListAfterResultBtn) backToListAfterResultBtn.style.display = 'inline-block'; // Should be none initially
        if (submitButton) submitButton.style.display = 'inline-block';
        if (submitButtonToolbar) submitButtonToolbar.style.display = 'inline-block';
    }

    // --- Logic Timer (Bài thi) ---
    function startTimer(durationMinutes) {
        if (timerIntervalId) clearInterval(timerIntervalId);
        if (!timeLeftElement) return;
        remainingTime = durationMinutes * 60;
        updateTimerDisplay();
        timerIntervalId = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            if (remainingTime <= 0) handleTimeUp();
        }, 1000);
    }
    function updateTimerDisplay() {
        if (!timeLeftElement || !timerContainer) return;
        if (remainingTime < 0) remainingTime = 0;
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timeLeftElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (remainingTime <= 60 && remainingTime > 0) {
            timerContainer.style.backgroundColor = 'var(--incorrect-option-bg)';
            timerContainer.style.borderColor = 'var(--incorrect-color)';
            timerContainer.style.color = 'var(--incorrect-color)';
        } else {
            timerContainer.style.backgroundColor = 'var(--timer-bg)';
            timerContainer.style.borderColor = 'var(--timer-border)';
            timerContainer.style.color = 'var(--timer-text)';
        }
    }
    function handleTimeUp() {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        alert("Đã hết thời gian làm bài! Bài thi sẽ được nộp tự động.");
        calculateAndDisplayScore(true);
    }

    // --- Logic Tính điểm ---
    // ... (calculateMCQuestionScore, calculateTFQuestionScore, calculateFillQuestionScore - không thay đổi)
    function calculateMCQuestionScore(question, index, pointsPerMainQuestion) {
        const resultP = document.createElement('p');
        resultP.innerHTML = `<strong>Câu ${index + 1} (Trắc nghiệm):</strong> ${question.question}<br>`;
        if (question.imageUrl) {
             const imgElement = document.createElement('img');
             imgElement.src = question.imageUrl;
             imgElement.alt = "Hình ảnh câu hỏi";
             imgElement.classList.add('question-image-result');
             resultP.appendChild(imgElement);
        }
        const selectedOptionInput = quizContentContainer.querySelector(`input[name="question-${index}"]:checked`);
        const allOptionsInputs = quizContentContainer.querySelectorAll(`input[name="question-${index}"]`);
        const shuffledOptions = question.options;
        const newCorrectAnswerIndex = question.correctAnswer;
        let userAnswerIndex = -1;
        let questionPoints = 0;
        let isQuestionCorrect = false;

        allOptionsInputs.forEach((input, optIndex) => {
            input.disabled = true;
            const label = input.closest('label');
            if(label){
                if (optIndex === newCorrectAnswerIndex) label.classList.add('correct-option');
                if (input.checked) {
                    userAnswerIndex = parseInt(input.value);
                    if (userAnswerIndex !== newCorrectAnswerIndex) label.classList.add('incorrect-option');
                }
            }
        });

        if (userAnswerIndex !== -1) {
            const correctAnswerText = shuffledOptions[newCorrectAnswerIndex];
            const userAnswerText = shuffledOptions[userAnswerIndex];
            resultP.innerHTML += `&nbsp;&nbsp;Bạn chọn: <span class="user-answer">${userAnswerText}</span>. `;
            if (userAnswerIndex === newCorrectAnswerIndex) {
                questionPoints = pointsPerMainQuestion;
                isQuestionCorrect = true;
                resultP.innerHTML += `<span class="correct">Đúng!</span>`;
            } else {
                isQuestionCorrect = false;
                resultP.innerHTML += `&nbsp;&nbsp;<span class="incorrect">Sai.</span> Đáp án đúng là: <span class="correct">${correctAnswerText}</span>`;
            }
        } else {
            isQuestionCorrect = false;
            const correctAnswerText = shuffledOptions[newCorrectAnswerIndex];
            resultP.innerHTML += `&nbsp;&nbsp;<span class="incorrect">Bạn chưa trả lời.</span> Đáp án đúng là: <span class="correct">${correctAnswerText}</span>`;
        }
        resultP.dataset.correctness = isQuestionCorrect ? 'correct' : 'incorrect';
        return { element: resultP, points: questionPoints, isCorrect: isQuestionCorrect };
    }

    function calculateTFQuestionScore(question, index, pointsPerMainQuestion) {
        const resultDiv = document.createElement('div');
        resultDiv.innerHTML = `<strong>Câu ${index + 1} (Đúng/Sai):</strong> ${question.question}<br>`;
         if (question.imageUrl) {
              const imgElement = document.createElement('img');
              imgElement.src = question.imageUrl;
              imgElement.alt = "Hình ảnh câu hỏi";
              imgElement.classList.add('question-image-result');
              resultDiv.appendChild(imgElement);
         }
        let pointsForThisTF = 0;
        const totalStatements = question.statements.length;
        const pointsPerStatement = totalStatements > 0 ? (pointsPerMainQuestion / totalStatements) : 0;
        let allStatementsCorrectForFilter = true;

        question.statements.forEach((statement, subIndex) => {
            const statementResultDiv = document.createElement('div');
            statementResultDiv.classList.add('statement-result-item');
            statementResultDiv.innerHTML = `&nbsp;&nbsp;- ${statement.text}: `;
            const checkboxInput = quizContentContainer.querySelector(`input[name="question-${index}-statement-${subIndex}"][type="checkbox"]`);
            const label = checkboxInput?.closest('label');

            if (checkboxInput) {
                checkboxInput.disabled = true;
                const isChecked = checkboxInput.checked;
                const correctAnswerBool = statement.correctAnswer;
                let isStatementAnswerCorrect = false;
                if (correctAnswerBool === true) {
                    if (isChecked) {
                        isStatementAnswerCorrect = true;
                        pointsForThisTF += pointsPerStatement;
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Đã chọn</span>. <span class="correct">Chính xác!</span>`;
                         if (label) label.classList.add('correct-option');
                    } else {
                        isStatementAnswerCorrect = false;
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Chưa chọn</span>. <span class="incorrect">Sai.</span> Đáp án là: <span class="correct">Đúng</span>`;
                         if (label) label.classList.add('incorrect-option');
                    }
                } else { // correctAnswerBool === false
                    if (!isChecked) {
                        isStatementAnswerCorrect = true;
                        pointsForThisTF += pointsPerStatement;
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Chưa chọn</span>. <span class="correct">Chính xác!</span>`;
                    } else {
                        isStatementAnswerCorrect = false;
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Đã chọn</span>. <span class="incorrect">Sai.</span> Đáp án là: <span class="correct">Sai</span>`;
                         if (label) label.classList.add('incorrect-option');
                    }
                }
                if (!isStatementAnswerCorrect) allStatementsCorrectForFilter = false;
            } else {
                 allStatementsCorrectForFilter = false;
                 statementResultDiv.innerHTML += `<span class="incorrect">Lỗi: Không tìm thấy input.</span>`;
            }
            resultDiv.appendChild(statementResultDiv);
        });
        const questionPoints = pointsForThisTF;
        resultDiv.dataset.correctness = allStatementsCorrectForFilter ? 'correct' : 'incorrect';
        return { element: resultDiv, points: questionPoints, isCorrect: allStatementsCorrectForFilter };
    }

    function calculateFillQuestionScore(question, index, pointsPerMainQuestion) {
        const resultP = document.createElement('p');
        resultP.innerHTML = `<strong>Câu ${index + 1} (Điền từ):</strong> ${question.question}<br>`;
         if (question.imageUrl) {
              const imgElement = document.createElement('img');
              imgElement.src = question.imageUrl;
              imgElement.alt = "Hình ảnh câu hỏi";
              imgElement.classList.add('question-image-result');
              resultP.appendChild(imgElement);
         }
        const inputElement = quizContentContainer.querySelector(`#question-${index}-input`);
        let userAnswer = '';
        let normalizedUserAnswer = '';
        if (inputElement) {
            inputElement.disabled = true;
            userAnswer = inputElement.value;
            normalizedUserAnswer = userAnswer.trim().toLowerCase();
        }
        let isMatch = false;
        let displayCorrectAnswer = '';
        let questionPoints = 0;
        let isQuestionCorrect = false;
        if (Array.isArray(question.correctAnswer)) {
            displayCorrectAnswer = question.correctAnswer.join(' hoặc ');
            isMatch = question.correctAnswer.some(ans => ans.trim().toLowerCase() === normalizedUserAnswer);
        } else {
            displayCorrectAnswer = question.correctAnswer;
            isMatch = (displayCorrectAnswer.trim().toLowerCase() === normalizedUserAnswer);
        }
        resultP.innerHTML += `&nbsp;&nbsp;Bạn đã điền: <span class="user-answer">${userAnswer || '(chưa điền)'}</span>. `;
        if (isMatch) {
            questionPoints = pointsPerMainQuestion;
            isQuestionCorrect = true;
            resultP.innerHTML += `<span class="correct">Đúng!</span>`;
             if (inputElement) inputElement.classList.add('correct-option');
        } else {
            isQuestionCorrect = false;
            resultP.innerHTML += `&nbsp;&nbsp;<span class="incorrect">Sai.</span> Đáp án đúng là: <span class="correct">${displayCorrectAnswer}</span>`;
            if (inputElement) inputElement.classList.add('incorrect-option');
        }
        resultP.dataset.correctness = isQuestionCorrect ? 'correct' : 'incorrect';
        return { element: resultP, points: questionPoints, isCorrect: isQuestionCorrect };
    }
    function calculateAndDisplayScore(isAutoSubmit = false) {
        if (!selectedQuizData) return;
        if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
        let totalScore = 0;
        if (!resultContainer) return;
        resultContainer.innerHTML = '';
        const currentQuestions = shuffledQuizQuestions;
        const totalMainQuestions = currentQuestions.length;
        const pointsPerMainQuestion = totalMainQuestions > 0 ? (10 / totalMainQuestions) : 0;

        currentQuestions.forEach((q, index) => {
            let scoreResult;
            if (q.type === 'mc') scoreResult = calculateMCQuestionScore(q, index, pointsPerMainQuestion);
            else if (q.type === 'tf') scoreResult = calculateTFQuestionScore(q, index, pointsPerMainQuestion);
            else if (q.type === 'fill') scoreResult = calculateFillQuestionScore(q, index, pointsPerMainQuestion);
            if (scoreResult) {
                resultContainer.appendChild(scoreResult.element);
                totalScore += scoreResult.points;
            }
        });
        const finalScoreRounded = totalScore.toFixed(2);
        if (scoreContainer) {
            scoreContainer.innerHTML = `Kết quả: <strong style="font-size: 1.1em;">Điểm: ${finalScoreRounded} / 10</strong>`;
            scoreContainer.style.display = 'block';
        }
        if (filterContainer) filterContainer.style.display = 'block';
        if (resultContainer) resultContainer.style.display = 'block';
        if (submitButtonToolbar) submitButtonToolbar.style.display = 'none';
        if (submitButton) submitButton.style.display = 'none';
        if (retryButton) retryButton.style.display = 'inline-block';
        if (backToListAfterResultBtn) backToListAfterResultBtn.style.display = 'inline-block';
        if (filterContainer) {
            applyFilter('all');
            filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === 'all') btn.classList.add('active');
            });
        }
        if (!isAutoSubmit && resultContainer) {
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --- Logic Lọc kết quả ---
    function applyFilter(filterType) {
        if (!resultContainer) return;
        const resultItems = resultContainer.querySelectorAll('p[data-correctness], div[data-correctness]');
        resultItems.forEach(item => {
            const correctness = item.dataset.correctness;
            item.classList.remove('hidden-result');
            if (filterType === 'correct' && correctness !== 'correct') {
                item.classList.add('hidden-result');
            } else if (filterType === 'incorrect' && correctness === 'correct') {
                item.classList.add('hidden-result');
            }
        });
    }

    // --- Logic Xử lý nút ---
    function handleRetryQuiz() {
        if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
        if (selectedSubjectSlug) displayQuizList(selectedSubjectSlug);
        else displaySubjectSelection();
        shuffledQuizQuestions = [];
        selectedQuizData = null;
        currentSubjectData = null;
    }
    function handleStartQuiz() {
        if (!selectedQuizData) return;
        const mcQuestions = selectedQuizData.questions.filter(q => q.type === 'mc');
        const tfQuestions = selectedQuizData.questions.filter(q => q.type === 'tf');
        const fillQuestions = selectedQuizData.questions.filter(q => q.type === 'fill');
        const shuffledMc = shuffleArray(mcQuestions);
        const shuffledTf = shuffleArray(tfQuestions);
        const shuffledFill = shuffleArray(fillQuestions);
        shuffledQuizQuestions = shuffledMc.concat(shuffledTf, shuffledFill);
        shuffledQuizQuestions = shuffledQuizQuestions.map(q => {
            if (q.type === 'mc') {
                const originalOptions = q.options;
                const originalCorrectAnswerIndex = q.correctAnswer;
                const correctAnswerText = originalOptions[originalCorrectAnswerIndex];
                const shuffledOptions = shuffleArray(originalOptions);
                const newCorrectAnswerIndex = shuffledOptions.indexOf(correctAnswerText);
                return { ...q, options: shuffledOptions, correctAnswer: newCorrectAnswerIndex };
            }
            return q;
        });
        displayQuizContent(shuffledQuizQuestions);
        if (selectedQuizData.timeLimitMinutes > 0) {
            startTimer(selectedQuizData.timeLimitMinutes);
            if (timerContainer) timerContainer.style.display = 'inline-flex';
        } else {
            if (timerContainer) timerContainer.style.display = 'none';
        }
        if (submitButton) submitButton.style.display = 'inline-block';
        if (submitButtonToolbar) submitButtonToolbar.style.display = 'inline-block';
        navigateTo('quiz');
    }

    // --- LOGIC BỘ ĐẾM NGƯỢC NGÀY THI (COUNTDOWN) ---
    function updateDigit(elementId, newDigit) {
        const prevDigit = prevCountdownValues[elementId];
        if (newDigit !== prevDigit) {
            const currentElement = document.getElementById(elementId);
            if (!currentElement) return;
            currentElement.style.transform = 'translateY(100%)';
            currentElement.style.transition = 'transform 0.4s ease-in-out';
            currentElement.addEventListener('transitionend', function handler() {
                currentElement.removeEventListener('transitionend', handler);
                currentElement.textContent = newDigit;
                currentElement.style.transition = 'none';
                currentElement.style.transform = 'translateY(-100%)';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        currentElement.style.transition = 'transform 0.4s ease-in-out';
                        currentElement.style.transform = 'translateY(0)';
                    });
                });
            });
            prevCountdownValues[elementId] = newDigit;
        }
    }

    function startOrUpdateGlobalCountdown() {
        if (examCountdownInterval) {
            clearInterval(examCountdownInterval);
            examCountdownInterval = null;
        }

        if (currentCountdownTargetDate && currentCountdownTargetDate.getTime() > new Date().getTime()) {
            if (countdownEl) countdownEl.style.display = 'flex';
            if (messageEl) messageEl.textContent = ''; // Xóa tin nhắn chung

            initializeExamCountdownDisplay(); // Sử dụng currentCountdownTargetDate toàn cục
            examCountdownInterval = setInterval(updateExamCountdown, 1000); // Sử dụng currentCountdownTargetDate toàn cục
        } else {
            // Không có ngày mục tiêu hợp lệ trong tương lai
            if (countdownEl) countdownEl.style.display = 'none';
            // countdownTitleEl đã được cập nhật bởi displayExamSchedule
            Object.keys(prevCountdownValues).forEach(id => updateDigit(id, '0')); // Reset các chữ số
            if (messageEl && currentView === 'subjectSelection') { // Chỉ hiển thị tin nhắn "chúc thi tốt" nếu không có môn nào sắp tới
                 if (currentCountdownTargetDate === null && document.getElementById('all-exams-passed-message')?.style.display !== 'none') {
                    // messageEl.textContent = "Tất cả các môn thi đã kết thúc."; // Tiêu đề đã xử lý
                 } else if (currentCountdownTargetDate === null && document.getElementById('no-upcoming-message')?.style.display !== 'none') {
                    // messageEl.textContent = "Hiện tại không có lịch thi nào sắp tới."; // Tiêu đề đã xử lý
                 } else if (currentCountdownTargetDate && currentCountdownTargetDate.getTime() <= new Date().getTime()){
                    // messageEl.textContent = "Chúc bạn thi tốt!"; // Môn thi vừa qua
                 }
            }
        }
    }

    function initializeExamCountdownDisplay() {
        if (!currentCountdownTargetDate) {
            Object.keys(prevCountdownValues).forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = '0';
                prevCountdownValues[id] = 0;
            });
            if (countdownEl) countdownEl.style.display = 'none';
            return;
        }

        const now = new Date().getTime();
        const targetTime = currentCountdownTargetDate.getTime();
        const distance = targetTime - now > 0 ? targetTime - now : 0;

        if (distance <= 0) {
            Object.keys(prevCountdownValues).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '0';
                prevCountdownValues[id] = 0;
            });
            if (countdownEl) countdownEl.style.display = 'none';
            return;
        }
        if (countdownEl) countdownEl.style.display = 'flex';

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const initialTimeValues = {
            'days-tens': Math.floor(days / 10), 'days-units': days % 10,
            'hours-tens': Math.floor(hours / 10), 'hours-units': hours % 10,
            'minutes-tens': Math.floor(minutes / 10), 'minutes-units': minutes % 10,
            'seconds-tens': Math.floor(seconds / 10), 'seconds-units': seconds % 10,
        };
        for (const id in initialTimeValues) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = initialTimeValues[id]; // Đặt trực tiếp khi khởi tạo
                prevCountdownValues[id] = initialTimeValues[id];
            }
        }
    }

    function updateExamCountdown() {
        if (!currentCountdownTargetDate) {
            if (examCountdownInterval) clearInterval(examCountdownInterval);
            examCountdownInterval = null;
            if (countdownEl) countdownEl.style.display = 'none';
            return;
        }

        const now = new Date().getTime();
        const distance = currentCountdownTargetDate.getTime() - now;

        if (distance < 0) {
            // Thời gian thi đã qua. displayExamSchedule sẽ tìm mục tiêu tiếp theo hoặc hiển thị "tất cả đã qua".
            // Nó cũng sẽ gọi startOrUpdateGlobalCountdown để xóa interval cũ.
            displayExamSchedule();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        updateDigit('days-tens', Math.floor(days / 10)); updateDigit('days-units', days % 10);
        updateDigit('hours-tens', Math.floor(hours / 10)); updateDigit('hours-units', hours % 10);
        updateDigit('minutes-tens', Math.floor(minutes / 10)); updateDigit('minutes-units', minutes % 10);
        updateDigit('seconds-tens', Math.floor(seconds / 10)); updateDigit('seconds-units', seconds % 10);
    }
    // --- KẾT THÚC LOGIC BỘ ĐẾM NGƯỢC NGÀY THI ---


    // --- LOGIC BẢNG LỊCH THI ---
    function displayExamSchedule() {
        const exams = [ // Dữ liệu lịch thi
            { ngayThi: "12/05/2025", monThi: "Văn", thoiGianBatDau: "7g20", thoiGianLamBai: "90 phút" },
            { ngayThi: "12/05/2025", monThi: "Vật lý", thoiGianBatDau: "9h00", thoiGianLamBai: "45 phút" },
            { ngayThi: "13/05/2025", monThi: "Toán", thoiGianBatDau: "7g20", thoiGianLamBai: "90 phút" },
            { ngayThi: "13/05/2025", monThi: "Sinh", thoiGianBatDau: "9h00", thoiGianLamBai: "45 phút" },
            { ngayThi: "14/05/2025", monThi: "Lịch sử", thoiGianBatDau: "7g20", thoiGianLamBai: "45 phút" },
            { ngayThi: "14/05/2025", monThi: "Tiếng Anh", thoiGianBatDau: "8g15", thoiGianLamBai: "60 phút" },
            { ngayThi: "15/05/2025", monThi: "Hóa", thoiGianBatDau: "7g20", thoiGianLamBai: "45 phút" },
            { ngayThi: "15/05/2025", monThi: "Tin học", thoiGianBatDau: "8g20", thoiGianLamBai: "45 phút" }
        ];

        function parseDateTime(dateStr, timeStr) {
            const [day, month, year] = dateStr.split('/').map(Number);
            const normalizedTimeStr = timeStr.replace('g', ':').replace('h', ':');
            const timeParts = normalizedTimeStr.split(':').map(Number);
            const hours = timeParts[0];
            const minutes = timeParts.length > 1 ? timeParts[1] : 0;
            return new Date(year, month - 1, day, hours, minutes, 0);
        }

        function calculateEndTime(startTime, durationStr) {
            const durationMinutes = parseInt(durationStr.replace(' phút', ''));
            return new Date(startTime.getTime() + durationMinutes * 60000);
        }

        const processedExams = exams.map(exam => ({
            ...exam,
            dateTime: parseDateTime(exam.ngayThi, exam.thoiGianBatDau)
        })).sort((a, b) => a.dateTime - b.dateTime);

        const now = new Date();
        const tbody = document.getElementById('exam-schedule-body');
        const noUpcomingMessage = document.getElementById('no-upcoming-message');
        const allExamsPassedMessage = document.getElementById('all-exams-passed-message');

        if (!tbody || !noUpcomingMessage || !allExamsPassedMessage || !countdownTitleEl) {
            console.warn("Một số phần tử DOM cho lịch thi hoặc countdown không tìm thấy.");
            return;
        }
        tbody.innerHTML = '';

        // Xác định môn thi tiếp theo cho countdown và trạng thái chung
        let firstUpcomingExamForCountdown = null;
        for (const exam of processedExams) {
            if (exam.dateTime > now) {
                firstUpcomingExamForCountdown = exam;
                break;
            }
        }

        if (firstUpcomingExamForCountdown) {
            currentCountdownTargetDate = firstUpcomingExamForCountdown.dateTime;
            countdownTitleEl.textContent = `Thời gian còn lại đến môn thi tiếp theo:`;
        } else {
            currentCountdownTargetDate = null;
            if (processedExams.length > 0 && processedExams.every(exam => calculateEndTime(exam.dateTime, exam.thoiGianLamBai) < now)) {
                countdownTitleEl.textContent = "Tất cả các môn thi đã kết thúc.";
                 if (messageEl) messageEl.textContent = "Chúc bạn ôn tập tốt cho các kỳ thi sau!";
            } else if (processedExams.length === 0) {
                countdownTitleEl.textContent = "Không có lịch thi.";
                 if (messageEl) messageEl.textContent = "Vui lòng kiểm tra lại sau.";
            } else {
                // Trường hợp có môn thi nhưng không phải "sắp tới" và cũng không phải "tất cả đã qua"
                // (ví dụ: dữ liệu lỗi, hoặc một môn đang diễn ra)
                // Tìm môn đang diễn ra hoặc môn vừa kết thúc gần nhất để hiển thị thông báo phù hợp
                let lastExamToday = null;
                const todayExams = processedExams.filter(exam =>
                    exam.dateTime.getDate() === now.getDate() &&
                    exam.dateTime.getMonth() === now.getMonth() &&
                    exam.dateTime.getFullYear() === now.getFullYear()
                );
                if(todayExams.length > 0){
                    lastExamToday = todayExams.reduce((last, current) => {
                        return calculateEndTime(current.dateTime, current.thoiGianLamBai) > calculateEndTime(last.dateTime, last.thoiGianLamBai) ? current : last;
                    });
                }

                if (lastExamToday && lastExamToday.dateTime <= now && calculateEndTime(lastExamToday.dateTime, lastExamToday.thoiGianLamBai) >= now) {
                    countdownTitleEl.textContent = `Môn ${lastExamToday.monThi} đang diễn ra!`;
                } else {
                     countdownTitleEl.textContent = "Lịch thi chưa được cập nhật chính xác.";
                }
                 if (messageEl) messageEl.textContent = "";
            }
        }
        startOrUpdateGlobalCountdown(); // Khởi động hoặc cập nhật bộ đếm toàn cục


        // Hiển thị bảng lịch thi và các tin nhắn
        let nextExamDayForHighlight = null;
        if (firstUpcomingExamForCountdown) {
            nextExamDayForHighlight = firstUpcomingExamForCountdown.ngayThi;
        }


        let allPassedCheck = true;
        if (processedExams.length > 0) {
            processedExams.forEach(exam => {
                if (calculateEndTime(exam.dateTime, exam.thoiGianLamBai) > now) {
                    allPassedCheck = false;
                }
                const row = document.createElement('tr');
                row.classList.add('bg-white');
                const cellClasses = ['py-3', 'px-2', 'md:px-4', 'text-sm', 'md:text-base', 'align-middle', 'md:whitespace-nowrap'];
                const examEndTime = calculateEndTime(exam.dateTime, exam.thoiGianLamBai);

                if (examEndTime < now) {
                    row.classList.add('exam-row-passed');
                } else if (exam.ngayThi === nextExamDayForHighlight) {
                    row.classList.remove('bg-white');
                    row.classList.add('exam-row-next-day');
                } else {
                    row.classList.add('exam-row-upcoming');
                }
                row.classList.add('hover:bg-gray-50', 'transition-colors', 'duration-150');
                row.innerHTML = `
                    <td class="${cellClasses.join(' ')}">${exam.ngayThi}</td>
                    <td class="${cellClasses.join(' ')}">${exam.monThi}</td>
                    <td class="${cellClasses.join(' ')}">${exam.thoiGianBatDau.replace('g', 'h')}</td>
                    <td class="${cellClasses.join(' ')}">${exam.thoiGianLamBai}</td>
                `;
                tbody.appendChild(row);
            });
        }


        if (processedExams.length === 0) {
            noUpcomingMessage.style.display = 'block';
            allExamsPassedMessage.style.display = 'none';
        } else if (allPassedCheck) {
            allExamsPassedMessage.style.display = 'block';
            noUpcomingMessage.style.display = 'none';
        } else if (!firstUpcomingExamForCountdown && !allPassedCheck) {
            // Có exam nhưng không có exam nào sắp tới và cũng không phải tất cả đã qua (ví dụ đang diễn ra)
            noUpcomingMessage.style.display = 'none'; // Hoặc một tin nhắn khác
            allExamsPassedMessage.style.display = 'none';
        }
        else {
            noUpcomingMessage.style.display = 'none';
            allExamsPassedMessage.style.display = 'none';
        }
    }
    // --- KẾT THÚC LOGIC BẢNG LỊCH THI ---

    // --- Gắn sự kiện ---
    if (startBtn) startBtn.addEventListener('click', handleStartQuiz);
    if (submitButtonToolbar) submitButtonToolbar.addEventListener('click', () => calculateAndDisplayScore(false));
    if (submitButton) submitButton.addEventListener('click', () => calculateAndDisplayScore(false));
    if (retryButton) retryButton.addEventListener('click', handleRetryQuiz);
    if (backToListAfterResultBtn) backToListAfterResultBtn.addEventListener('click', handleRetryQuiz);

    if (backToSubjectsBtn) backToSubjectsBtn.addEventListener('click', () => {
        if (timerIntervalId) clearInterval(timerIntervalId); timerIntervalId = null;
        shuffledQuizQuestions = []; selectedQuizData = null; currentSubjectData = null;
        displaySubjectSelection();
    });
    if (backToQuizListBtn) backToQuizListBtn.addEventListener('click', () => {
        if (timerIntervalId) clearInterval(timerIntervalId); timerIntervalId = null;
        shuffledQuizQuestions = []; selectedQuizData = null;
        if (selectedSubjectSlug && currentSubjectData) displayQuizListFromData(currentSubjectData);
        else displaySubjectSelection();
    });
    if (backToQuizListFromQuizBtn) backToQuizListFromQuizBtn.addEventListener('click', () => {
        if (timerIntervalId) clearInterval(timerIntervalId); timerIntervalId = null;
        shuffledQuizQuestions = []; selectedQuizData = null;
        if (selectedSubjectSlug && currentSubjectData) displayQuizListFromData(currentSubjectData);
        else displaySubjectSelection();
    });

    function displayQuizListFromData(subjectData) {
        if (!quizListContainer || !subjectData || !subjectData.quizzes) {
            displaySubjectSelection(); return;
        }
        if (quizListTitle) quizListTitle.textContent = subjectData.subjectName;
        quizListContainer.innerHTML = '';
        if (subjectData.quizzes.length > 0) {
            subjectData.quizzes.forEach(quiz => quizListContainer.appendChild(createQuizListItem(quiz)));
        } else {
            quizListContainer.innerHTML = '<p>Chưa có bài thi nào.</p>';
        }
        navigateTo('quizList');
    }

    if (filterContainer) {
        filterContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('filter-btn')) {
                const filterType = event.target.dataset.filter;
                filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');
                applyFilter(filterType);
            }
        });
    }

    // --- Logic nút đa năng ---
    if (multiFunctionButton && multiFunctionMenu) {
        multiFunctionButton.addEventListener('click', (event) => {
            event.stopPropagation();
            multiFunctionMenu.classList.toggle('visible');
            multiFunctionMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (event) => {
            if (!multiFunctionButton.contains(event.target) && !multiFunctionMenu.contains(event.target)) {
                multiFunctionMenu.classList.remove('visible');
                multiFunctionMenu.classList.add('hidden');
            }
        });
        multiFunctionMenu.addEventListener('click', () => {
            multiFunctionMenu.classList.remove('visible');
            multiFunctionMenu.classList.add('hidden');
        });
    }

    // --- Khởi tạo ứng dụng ---
    displaySubjectSelection(); // Gọi lần đầu để hiển thị môn học, lịch thi và khởi động bộ đếm

}); // Kết thúc DOMContentLoaded
