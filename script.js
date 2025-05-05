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

    // Tham chiếu cho toolbar và nút submit trên toolbar
    const quizToolbar = document.getElementById('quiz-toolbar');
    const backToQuizListFromQuizBtn = document.getElementById('back-to-quiz-list-from-quiz-btn');
    const submitButtonToolbar = document.getElementById('submit-btn-toolbar'); // Nút submit trên toolbar

    const timerContainer = document.getElementById('timer-container');
    const timeLeftElement = document.getElementById('time-left');
    const quizContentContainer = document.getElementById('quiz');
    // Tham chiếu nút submit gốc
    const submitButton = document.getElementById('submit-btn'); // Nút submit gốc ở dưới
    const retryButton = document.getElementById('retry-btn');
    const scoreContainer = document.getElementById('score-container');
    const filterContainer = document.getElementById('filter-container');
    const resultContainer = document.getElementById('result-container');

    // Tham chiếu cho nút và menu đa năng
    const multiFunctionButton = document.getElementById('multi-function-button');
    const multiFunctionMenu = document.getElementById('multi-function-menu');

    // --- Trạng thái ứng dụng ---
    let currentView = 'subjectSelection';
    let selectedSubjectSlug = null;
    let currentSubjectData = null; // Lưu dữ liệu môn học hiện tại sau khi import
    let selectedQuizData = null; // Dữ liệu quiz gốc được chọn
    let timerIntervalId = null;
    let remainingTime = 0;
    let shuffledQuizQuestions = []; // Danh sách câu hỏi đã xáo trộn cho bài thi hiện tại

    // --- Danh sách các môn học có sẵn ---
    const availableSubjects = {
        'vat-li': { name: 'Vật lí', icon: 'ph-atom' },
        'hoa-hoc': { name: 'Hoá học', icon: 'ph-flask' },
        'lich-su': { name: 'Lịch sử', icon: 'ph-scroll' },
        'sinh-hoc': { name: 'Sinh học', icon: 'ph-dna' },
        'tin-hoc': { name: 'Tin học', icon: 'ph-laptop' }
    };

    // --- Hàm điều hướng màn hình ---
    function navigateTo(screenId) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenId]) {
            screens[screenId].classList.add('active');
            currentView = screenId;
            window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển màn hình
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
            displayQuizList(subjectSlug); // Gọi hàm hiển thị danh sách quiz
        });
        return card;
    }

    // --- Hàm hiển thị danh sách môn học ---
    function displaySubjectSelection() {
        if (!subjectListContainer) {
            console.error("Lỗi: Không tìm thấy phần tử #subject-list trong HTML.");
            return;
        }
        subjectListContainer.innerHTML = ''; // Xóa nội dung cũ
        for (const slug in availableSubjects) {
            const subjectInfo = availableSubjects[slug];
            const card = createSubjectCard(slug, subjectInfo); // Sử dụng hàm tạo thẻ
            subjectListContainer.appendChild(card);
        }
        navigateTo('subjectSelection');
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
                console.log(`Chuyển hướng đến: ${clickedQuizData.redirectUrl}`);
                window.location.href = clickedQuizData.redirectUrl;
            } else if (clickedQuizData) {
                console.warn(`Bài thi "${clickedQuizData.title}" không có redirectUrl. Hiển thị thông tin.`);
                selectedQuizData = clickedQuizData;
                displayQuizInfo();
            } else {
                console.error("Không tìm thấy dữ liệu bài thi:", quiz.id);
                displayQuizList(selectedSubjectSlug);
            }
        });
        return listItem;
    }

    // --- Hàm hiển thị danh sách bài thi theo môn (Async) ---
    async function displayQuizList(subjectSlug) {
        if (!quizListContainer) {
            console.error("Lỗi: Không tìm thấy phần tử #quiz-list trong HTML.");
            return;
        }
        quizListContainer.innerHTML = '<p>Đang tải danh sách bài thi...</p>';
        if (quizListTitle) {
             const subjectInfo = availableSubjects[subjectSlug];
             quizListTitle.textContent = subjectInfo?.name || '...';
        } else {
             console.warn("Phần tử tiêu đề danh sách quiz không tồn tại.");
        }

        try {
            const subjectModule = await import(`./data/${subjectSlug}.js`);
            currentSubjectData = subjectModule.default;

            if (!currentSubjectData || !currentSubjectData.quizzes) {
                quizListContainer.innerHTML = '<p>Không thể tải dữ liệu bài thi.</p>';
                console.error("Dữ liệu môn học không hợp lệ:", subjectSlug);
                navigateTo('quizList');
                return;
            }

            if (quizListTitle) {
                 quizListTitle.textContent = currentSubjectData.subjectName;
            }

            quizListContainer.innerHTML = '';
            if (currentSubjectData.quizzes.length > 0) {
                currentSubjectData.quizzes.forEach(quiz => {
                    const listItem = createQuizListItem(quiz);
                    quizListContainer.appendChild(listItem);
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
            console.error("No quiz selected for info display.");
            if (selectedSubjectSlug) {
                 displayQuizList(selectedSubjectSlug);
            } else {
                 displaySubjectSelection();
            }
            return;
        }
        if (infoQuizTitle) infoQuizTitle.textContent = selectedQuizData.title;
        const mainQuestionsCount = selectedQuizData.questions.length;
        if (infoTotalQuestions) infoTotalQuestions.textContent = mainQuestionsCount;
        if (infoTimeLimit) infoTimeLimit.textContent = selectedQuizData.timeLimitMinutes;
        navigateTo('info');
    }

    // --- Helper function to add image ---
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

    // --- Hàm tạo khối câu hỏi Trắc nghiệm (MC) ---
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

    // --- Hàm tạo khối câu hỏi Đúng/Sai (TF) ---
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

    // --- Hàm tạo khối câu hỏi Điền từ (Fill) ---
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
         if (!quizContentContainer) {
              console.error("Lỗi: Không tìm thấy phần tử #quiz.");
              return;
         }
        quizContentContainer.innerHTML = '';
        questionsArray.forEach((q, index) => {
            let questionBlock;
            if (q.type === 'mc') questionBlock = createMCQuestionBlock(q, index);
            else if (q.type === 'tf') questionBlock = createTFQuestionBlock(q, index);
            else if (q.type === 'fill') questionBlock = createFillQuestionBlock(q, index);
            if (questionBlock) quizContentContainer.appendChild(questionBlock);
        });
         if (resultContainer) resultContainer.style.display = 'none';
         if (resultContainer) resultContainer.innerHTML = '';
         if (scoreContainer) scoreContainer.style.display = 'none';
         if (filterContainer) filterContainer.style.display = 'none';
         if (retryButton) retryButton.style.display = 'none';
         if (backToListAfterResultBtn) backToListAfterResultBtn.style.display = 'inline-block';
         if (submitButton) submitButton.style.display = 'inline-block';
         if (submitButtonToolbar) submitButtonToolbar.style.display = 'inline-block';
    }

    // --- Logic Timer ---
    function startTimer(durationMinutes) {
        if (timerIntervalId) clearInterval(timerIntervalId);
         if (!timeLeftElement) {
              console.error("Lỗi: Không tìm thấy phần tử #time-left.");
              return;
         }
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
    // --- Kết thúc Logic Timer ---

    // --- Logic Tính điểm ---
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
                 console.warn(`Checkbox for statement ${subIndex} in question ${index} not found.`);
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
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        let totalScore = 0;
         if (!resultContainer) {
             console.error("Lỗi: Không tìm thấy phần tử #result-container.");
             return;
         }
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
         if (scoreContainer) scoreContainer.innerHTML = `Kết quả: <strong style="font-size: 1.1em;">Điểm: ${finalScoreRounded} / 10</strong>`;
         if (scoreContainer) scoreContainer.style.display = 'block';
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
    // --- Kết thúc Logic Tính điểm ---

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
    // --- Kết thúc Logic Lọc kết quả ---

    // --- Logic Xử lý nút ---
    function handleRetryQuiz() {
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        if (selectedSubjectSlug) {
            displayQuizList(selectedSubjectSlug);
        } else {
            displaySubjectSelection();
        }
        shuffledQuizQuestions = [];
        selectedQuizData = null;
        currentSubjectData = null;
    }

    function handleStartQuiz() {
        if (!selectedQuizData) {
             console.error("Không có dữ liệu quiz để bắt đầu.");
             return;
        }
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
             if(timerContainer) timerContainer.style.display = 'inline-flex';
        } else {
             if(timerContainer) timerContainer.style.display = 'none';
        }
        if (submitButton) submitButton.style.display = 'inline-block';
        if (submitButtonToolbar) submitButtonToolbar.style.display = 'inline-block';
        navigateTo('quiz');
    }
    // --- Kết thúc Logic Xử lý nút ---

    // --- LOGIC COUNTDOWN ĐẾN NGÀY THI ---
    const countdownDate = new Date("May 12, 2025 07:15:00").getTime();
    const messageEl = document.getElementById('message');
    const countdownEl = document.getElementById('countdown');
    let prevCountdownValues = {
        'days-tens': -1, 'days-units': -1, 'hours-tens': -1, 'hours-units': -1,
        'minutes-tens': -1, 'minutes-units': -1, 'seconds-tens': -1, 'seconds-units': -1,
    };

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

    function updateExamCountdown() {
        const now = new Date().getTime();
        const distance = countdownDate - now;
        if (distance < 0) {
            clearInterval(examCountdownInterval);
             Object.keys(prevCountdownValues).forEach(id => updateDigit(id, '0'));
            if (countdownEl) countdownEl.style.display = 'none';
            if (messageEl) messageEl.textContent = "Chúc bạn thi tốt!";
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

    function initializeExamCountdownDisplay() {
        const now = new Date().getTime();
        const distance = countdownDate - now > 0 ? countdownDate - now : 0;
        if (distance <= 0) {
            if (messageEl) messageEl.textContent = "Chúc bạn thi tốt!";
            if (countdownEl) countdownEl.style.display = 'none';
             Object.keys(prevCountdownValues).forEach(id => {
                  const el = document.getElementById(id);
                  if (el) el.textContent = '0';
                  prevCountdownValues[id] = 0;
             });
            return;
        }
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
                element.textContent = initialTimeValues[id];
                prevCountdownValues[id] = initialTimeValues[id];
            }
        }
    }

    let examCountdownInterval = null;
    if (countdownEl && messageEl) {
        initializeExamCountdownDisplay();
        examCountdownInterval = setInterval(updateExamCountdown, 1000);
    } else {
         console.warn("Countdown elements not found.");
    }
    // --- KẾT THÚC LOGIC COUNTDOWN ---

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
              console.error("Không thể hiển thị danh sách quiz từ dữ liệu.");
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
    } else {
        console.warn("Multi-function button or menu not found.");
    }
    // --- Kết thúc Logic nút đa năng ---

    // --- Khởi tạo ứng dụng ---
    displaySubjectSelection();

}); // Kết thúc DOMContentLoaded cho Quiz App

// --- Code riêng cho Thanh Tiến Trình (đã được chuyển vào HTML) ---
// Không cần thêm code JS ở đây nữa vì đã đặt trong thẻ <script> ở cuối index.html
