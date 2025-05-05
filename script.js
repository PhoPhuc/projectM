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
    // Tham chiếu nút submit gốc (không còn bị ẩn cứng trong CSS)
    const submitButton = document.getElementById('submit-btn'); // Nút submit gốc ở dưới
    const retryButton = document.getElementById('retry-btn');
    const scoreContainer = document.getElementById('score-container');
    const filterContainer = document.getElementById('filter-container');
    const resultContainer = document.getElementById('result-container');

    // --- Tham chiếu cho nút và menu đa năng (Mới) ---
    const multiFunctionButton = document.getElementById('multi-function-button');
    const multiFunctionMenu = document.getElementById('multi-function-menu');

    // --- Trạng thái ứng dụng ---
    let currentView = 'subjectSelection';
    let selectedSubjectSlug = null;
    let currentSubjectData = null; // Lưu dữ liệu môn học hiện tại sau khi import
    let selectedQuizData = null; // Dữ liệu quiz gốc được chọn
    let timerIntervalId = null;
    let remainingTime = 0;
    let shuffledQuizQuestions = []; // Danh sách câu hỏi đã xáo trộn cho bài thi hiện tại (theo thứ tự loại)

    // --- Danh sách các môn học có sẵn (Dựa trên tên file trong thư mục data) ---
    // Cần đảm bảo các file data/SLUG.js tồn tại
    const availableSubjects = {
        'vat-li': { name: 'Vật lí', icon: 'ph-atom' },
        'hoa-hoc': { name: 'Hoá học', icon: 'ph-flask' },
        'lich-su': { name: 'Lịch sử', icon: 'ph-scroll' },
        'sinh-hoc': { name: 'Sinh học', icon: 'ph-dna' },
        'tin-hoc': { name: 'Tin học', icon: 'ph-laptop' }
    };

    // --- Hàm Helper: Ngẫu nhiên hóa mảng (Fisher-Yates Shuffle) ---
    function shuffleArray(array) {
        const shuffledArray = [...array]; // Tạo bản sao để không thay đổi mảng gốc
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Hoán đổi vị trí
        }
        return shuffledArray;
    }

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

    // --- Hàm tạo mục bài thi trong danh sách (Đã cập nhật logic click) ---
    function createQuizListItem(quiz) {
        const listItem = document.createElement('div');
        listItem.classList.add('quiz-list-item');
        listItem.dataset.quizId = quiz.id;
        listItem.innerHTML = `<span>${quiz.title}</span><i class="ph ph-caret-right"></i>`;

        // --- LOGIC CLICK ĐÃ THAY ĐỔI ---
        listItem.addEventListener('click', () => {
            // Tìm dữ liệu quiz gốc từ dữ liệu môn học đã tải
            const clickedQuizData = currentSubjectData?.quizzes.find(q => q.id === quiz.id);

            if (clickedQuizData && clickedQuizData.redirectUrl) {
                // Nếu tìm thấy quiz và có redirectUrl, chuyển hướng đến URL đó
                console.log(`Chuyển hướng đến: ${clickedQuizData.redirectUrl}`);
                window.location.href = clickedQuizData.redirectUrl;
            } else if (clickedQuizData) {
                // Nếu tìm thấy quiz nhưng không có redirectUrl, giữ nguyên chức năng cũ (hiển thị thông tin quiz)
                console.warn(`Bài thi "${clickedQuizData.title}" không có thuộc tính redirectUrl. Hiển thị thông tin bài thi.`);
                selectedQuizData = clickedQuizData; // Cập nhật selectedQuizData cho chức năng cũ
                displayQuizInfo();
            } else {
                console.error("Không tìm thấy dữ liệu bài thi:", quiz.id);
                // Có thể quay lại danh sách quiz hoặc hiển thị thông báo lỗi
                displayQuizList(selectedSubjectSlug); // Quay lại danh sách quiz
            }
        });
        // --- KẾT THÚC LOGIC CLICK ĐÃ THAY ĐỔI ---

        return listItem;
    }

    // --- Hàm hiển thị danh sách bài thi theo môn (Async do dynamic import) ---
    async function displayQuizList(subjectSlug) {
        if (!quizListContainer) {
            console.error("Lỗi: Không tìm thấy phần tử #quiz-list trong HTML.");
            return;
        }

        // Hiển thị trạng thái tải
        quizListContainer.innerHTML = '<p>Đang tải danh sách bài thi...</p>';
        if (quizListTitle) {
             const subjectInfo = availableSubjects[subjectSlug];
             quizListTitle.textContent = subjectInfo?.name || '...';
        } else {
             console.warn("Phần tử tiêu đề danh sách quiz không tồn tại.");
        }


        try {
            // Dynamic import file JavaScript của môn học
            // Đường dẫn giả định là các file nằm trong thư mục 'data' cùng cấp với index.html
            const subjectModule = await import(`./data/${subjectSlug}.js`);
            currentSubjectData = subjectModule.default; // Lưu dữ liệu môn học đã tải

            // Kiểm tra dữ liệu sau khi tải
            if (!currentSubjectData || !currentSubjectData.quizzes) {
                quizListContainer.innerHTML = '<p>Không thể tải dữ liệu bài thi cho môn học này.</p>';
                console.error("Dữ liệu môn học không hợp lệ sau khi import:", subjectSlug);
                navigateTo('quizList'); // Vẫn chuyển màn hình để hiển thị thông báo
                return;
            }

            // Cập nhật tiêu đề sau khi tải dữ liệu chính xác
            if (quizListTitle) {
                 quizListTitle.textContent = currentSubjectData.subjectName;
            }


            quizListContainer.innerHTML = ''; // Xóa trạng thái tải
            if (currentSubjectData.quizzes.length > 0) {
                currentSubjectData.quizzes.forEach(quiz => {
                    const listItem = createQuizListItem(quiz); // Sử dụng hàm tạo mục
                    quizListContainer.appendChild(listItem);
                });
            } else {
                quizListContainer.innerHTML = '<p>Chưa có bài thi nào cho môn học này.</p>';
            }

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu môn học:", subjectSlug, error);
            quizListContainer.innerHTML = '<p>Đã xảy ra lỗi khi tải danh sách bài thi.</p>';
            currentSubjectData = null; // Đảm bảo dữ liệu môn học bị xóa khi có lỗi
        }

        navigateTo('quizList'); // Chuyển màn hình dù có lỗi hay không để hiển thị kết quả tải
    }

    // --- Hàm hiển thị thông tin bài thi (Chức năng cũ khi không có redirectUrl) ---
    function displayQuizInfo() {
        // selectedQuizData đã được cập nhật trong hàm createQuizListItem
        if (!selectedQuizData) {
            console.error("No quiz selected for info display.");
            // Quay lại danh sách quiz nếu không có quiz được chọn
            if (selectedSubjectSlug) {
                 displayQuizList(selectedSubjectSlug);
            } else {
                 displaySubjectSelection();
            }
            return;
        }

        if (infoQuizTitle) infoQuizTitle.textContent = selectedQuizData.title; else console.warn("Phần tử tiêu đề quiz info không tồn tại.");
        const mainQuestionsCount = selectedQuizData.questions.length;
        if (infoTotalQuestions) infoTotalQuestions.textContent = mainQuestionsCount; else console.warn("Phần tử tổng số câu hỏi info không tồn tại.");
        if (infoTimeLimit) infoTimeLimit.textContent = selectedQuizData.timeLimitMinutes; else console.warn("Phần tử giới hạn thời gian info không tồn tại.");

        navigateTo('info');
    }

    // --- Helper function to add image if imageUrl exists ---
    function addImageToQuestionBlock(questionBlock, question) {
        if (question.imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = question.imageUrl;
            imgElement.alt = "Hình ảnh câu hỏi"; // Add a default alt text
            imgElement.classList.add('question-image'); // Apply the CSS class
            // Insert the image after the question text
            const questionTextElement = questionBlock.querySelector('.question-text');
            if (questionTextElement) {
                questionTextElement.parentNode.insertBefore(imgElement, questionTextElement.nextSibling);
            } else {
                // Fallback: Add image at the beginning if question text not found
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

        // Add image if available
        addImageToQuestionBlock(questionBlock, question);

        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('options');
        // question.options lúc này đã là mảng đáp án đã xáo trộn
        question.options.forEach((option, optionIndex) => {
            const label = document.createElement('label');
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            // Name vẫn dựa trên index CỦA CÂU HỎI TRONG MẢNG ĐÃ XÁO TRỘN
            radioInput.name = `question-${index}`;
            // Value là index CỦA LỰA CHỌN TRONG MẢNG OPTIONS ĐÃ XÁO TRỘN
            radioInput.value = optionIndex;
            label.id = `q${index}_opt${optionIndex}`;
            label.appendChild(radioInput);
            label.appendChild(document.createTextNode(` ${option}`));
            optionsDiv.appendChild(label);
        });
        questionBlock.appendChild(optionsDiv);
        return questionBlock;
    }

    // --- Hàm tạo khối câu hỏi Đúng/Sai (TF) - Đã cập nhật để dùng checkbox ---
    function createTFQuestionBlock(question, index) {
        const questionBlock = document.createElement('div');
        questionBlock.classList.add('question-block');

        const questionText = document.createElement('p');
        questionText.classList.add('question-text');
        questionText.textContent = `Câu ${index + 1}. ${question.question}`;
        questionBlock.appendChild(questionText);

        // Add image if available
        addImageToQuestionBlock(questionBlock, question);


        const statementsContainer = document.createElement('div');
        statementsContainer.classList.add('statements-container'); // Giữ class này để áp dụng style chung

        // Lặp qua từng statement và tạo checkbox tương ứng
        question.statements.forEach((statement, subIndex) => {
            const label = document.createElement('label'); // Sử dụng label cho toàn bộ dòng
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            // Name dựa trên index CỦA CÂU HỎI VÀ index CỦA STATEMENT
            checkboxInput.name = `question-${index}-statement-${subIndex}`;
            // Value có thể là index của statement hoặc true/false của statement gốc
            // Để đơn giản cho việc chấm điểm, lưu trữ index của statement
            checkboxInput.value = subIndex;
            label.id = `q${index}_s${subIndex}`; // ID cho label
            label.appendChild(checkboxInput);
            label.appendChild(document.createTextNode(` ${statement.text}`)); // Hiển thị nội dung statement

            statementsContainer.appendChild(label); // Thêm label (bao gồm checkbox và text) vào container
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

        // Add image if available
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


    // Hàm hiển thị nội dung quiz (sử dụng danh sách câu hỏi đã xáo trộn VÀ SẮP XẾP LẠI)
    function displayQuizContent(questionsArray) {
         if (!quizContentContainer) {
              console.error("Lỗi: Không tìm thấy phần tử chứa nội dung quiz (#quiz).");
              return;
         }
        quizContentContainer.innerHTML = ''; // Xóa nội dung cũ

        // Duyệt qua mảng câu hỏi đã được sắp xếp theo loại và tạo block tương ứng
        questionsArray.forEach((q, index) => {
            let questionBlock;
            if (q.type === 'mc') {
                questionBlock = createMCQuestionBlock(q, index);
            } else if (q.type === 'tf') {
                questionBlock = createTFQuestionBlock(q, index);
            } else if (q.type === 'fill') {
                questionBlock = createFillQuestionBlock(q, index);
            }
            if (questionBlock) {
                quizContentContainer.appendChild(questionBlock);
            }
        });

        // Đảm bảo các nút và kết quả được thiết lập đúng trạng thái ban đầu
         if (resultContainer) resultContainer.style.display = 'none'; else console.warn("Result container not found.");
         if (resultContainer) resultContainer.innerHTML = '';
         if (scoreContainer) scoreContainer.style.display = 'none'; else console.warn("Score container not found.");
         if (filterContainer) filterContainer.style.display = 'none'; else console.warn("Filter container not found.");
         if (retryButton) retryButton.style.display = 'none'; else console.warn("Retry button not found.");
         if (backToListAfterResultBtn) backToListAfterResultBtn.style.display = 'inline-block';

         // Hiển thị cả hai nút submit ban đầu
         if (submitButton) submitButton.style.display = 'inline-block';
         if (submitButtonToolbar) submitButtonToolbar.style.display = 'inline-block';


    }

    // --- Logic Timer ---
    function startTimer(durationMinutes) {
        if (timerIntervalId) clearInterval(timerIntervalId);
         if (!timeLeftElement) {
              console.error("Lỗi: Không tìm thấy phần tử hiển thị thời gian (#time-left). Timer sẽ không chạy.");
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
         if (!timeLeftElement || !timerContainer) {
             return;
         }
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
        // Sử dụng alert thay cho message box đơn giản
        alert("Đã hết thời gian làm bài! Bài thi sẽ được nộp tự động.");
        calculateAndDisplayScore(true);
    }
    // --- Kết thúc Logic Timer ---

    // --- Logic Tính điểm theo loại câu hỏi ---
    function calculateMCQuestionScore(question, index, pointsPerMainQuestion) {
        const resultP = document.createElement('p');
        resultP.innerHTML = `<strong>Câu ${index + 1} (Trắc nghiệm):</strong> ${question.question}<br>`;

        // Add image to result if available
        if (question.imageUrl) {
             const imgElement = document.createElement('img');
             imgElement.src = question.imageUrl;
             imgElement.alt = "Hình ảnh câu hỏi"; // Add a default alt text
             imgElement.classList.add('question-image-result'); // Use result class if needed
             resultP.appendChild(imgElement); // Append image to the result paragraph
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

    // --- Hàm tính điểm câu hỏi Đúng/Sai (TF) - Đã cập nhật cho checkbox và tính điểm từng ý ---
    function calculateTFQuestionScore(question, index, pointsPerMainQuestion) {
        const resultDiv = document.createElement('div');
        resultDiv.innerHTML = `<strong>Câu ${index + 1} (Đúng/Sai):</strong> ${question.question}<br>`;

         // Add image to result if available
         if (question.imageUrl) {
              const imgElement = document.createElement('img');
              imgElement.src = question.imageUrl;
              imgElement.alt = "Hình ảnh câu hỏi"; // Add a default alt text
              imgElement.classList.add('question-image-result'); // Use result class if needed
              resultDiv.appendChild(imgElement); // Append image to the result div
         }


        let pointsForThisTF = 0;
        const totalStatements = question.statements.length;
        // Chia đều điểm cho mỗi statement
        const pointsPerStatement = totalStatements > 0 ? (pointsPerMainQuestion / totalStatements) : 0;

        let allStatementsCorrectForFilter = true; // Biến kiểm tra toàn bộ câu hỏi có đúng hoàn hảo không (dùng cho bộ lọc)

        question.statements.forEach((statement, subIndex) => {
            const statementResultDiv = document.createElement('div');
            statementResultDiv.classList.add('statement-result-item');
            statementResultDiv.innerHTML = `&nbsp;&nbsp;- ${statement.text}: `;

            const checkboxInput = quizContentContainer.querySelector(`input[name="question-${index}-statement-${subIndex}"][type="checkbox"]`);
            const label = checkboxInput?.closest('label'); // Lấy label cha của checkbox

            if (checkboxInput) {
                checkboxInput.disabled = true; // Vô hiệu hóa checkbox sau khi nộp bài

                const isChecked = checkboxInput.checked;
                const correctAnswerBool = statement.correctAnswer; // true nếu ý đó đúng, false nếu ý đó sai

                let isStatementAnswerCorrect = false; // Biến kiểm tra người dùng trả lời ý này có đúng không

                if (correctAnswerBool === true) {
                    // Ý đúng: Người dùng phải tích chọn
                    if (isChecked) {
                        isStatementAnswerCorrect = true;
                        pointsForThisTF += pointsPerStatement; // Cộng điểm cho ý đúng được chọn
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Đã chọn</span>. <span class="correct">Chính xác!</span>`;
                         if (label) label.classList.add('correct-option'); // Highlight label xanh
                    } else {
                        isStatementAnswerCorrect = false;
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Chưa chọn</span>. <span class="incorrect">Sai.</span> Đáp án là: <span class="correct">Đúng</span>`;
                         if (label) label.classList.add('incorrect-option'); // Highlight label đỏ
                    }
                } else { // correctAnswerBool === false
                    // Ý sai: Người dùng không được tích chọn
                    if (!isChecked) {
                        isStatementAnswerCorrect = true;
                        pointsForThisTF += pointsPerStatement; // Cộng điểm cho ý sai không được chọn
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Chưa chọn</span>. <span class="correct">Chính xác!</span>`;
                         // Không highlight xanh cho ý sai không chọn, giữ nguyên style mặc định hoặc thêm style riêng nếu cần
                    } else {
                        isStatementAnswerCorrect = false;
                        statementResultDiv.innerHTML += `Bạn chọn <span class="user-answer">Đã chọn</span>. <span class="incorrect">Sai.</span> Đáp án là: <span class="correct">Sai</span>`;
                         if (label) label.classList.add('incorrect-option'); // Highlight label đỏ
                    }
                }

                // Cập nhật biến kiểm tra toàn bộ câu hỏi đúng hoàn hảo (dùng cho bộ lọc)
                if (!isStatementAnswerCorrect) {
                    allStatementsCorrectForFilter = false;
                }

            } else {
                 console.warn(`Checkbox for statement ${subIndex} in question ${index} not found.`);
                 allStatementsCorrectForFilter = false; // Coi như sai nếu không tìm thấy input
                 statementResultDiv.innerHTML += `<span class="incorrect">Lỗi: Không tìm thấy input.</span>`;
            }

            resultDiv.appendChild(statementResultDiv);
        });

        // Tổng điểm của câu hỏi là tổng điểm các ý nhỏ đúng
        const questionPoints = pointsForThisTF;

        // Correctness cho bộ lọc dựa trên việc trả lời đúng hoàn hảo tất cả các ý
        resultDiv.dataset.correctness = allStatementsCorrectForFilter ? 'correct' : 'incorrect';
        return { element: resultDiv, points: questionPoints, isCorrect: allStatementsCorrectForFilter }; // isCorrect vẫn dựa trên allStatementsCorrectForFilter cho bộ lọc
    }


    function calculateFillQuestionScore(question, index, pointsPerMainQuestion) {
        const resultP = document.createElement('p');
        resultP.innerHTML = `<strong>Câu ${index + 1} (Điền từ):</strong> ${question.question}<br>`;

         // Add image to result if available
         if (question.imageUrl) {
              const imgElement = document.createElement('img');
              imgElement.src = question.imageUrl;
              imgElement.alt = "Hình ảnh câu hỏi"; // Add a default alt text
              imgElement.classList.add('question-image-result'); // Use result class if needed
              resultP.appendChild(imgElement); // Append image to the result paragraph
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

    // Hàm tính điểm tổng và hiển thị kết quả
    function calculateAndDisplayScore(isAutoSubmit = false) {
        if (!selectedQuizData) return;
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }

        let totalScore = 0;
         if (!resultContainer) {
             console.error("Lỗi: Không tìm thấy phần tử kết quả (#result-container) để hiển thị.");
             return;
         }
        resultContainer.innerHTML = '';

        const currentQuestions = shuffledQuizQuestions;
        const totalMainQuestions = currentQuestions.length;
        const pointsPerMainQuestion = totalMainQuestions > 0 ? (10 / totalMainQuestions) : 0;

        currentQuestions.forEach((q, index) => {
            let scoreResult;
            if (q.type === 'mc') {
                scoreResult = calculateMCQuestionScore(q, index, pointsPerMainQuestion);
            } else if (q.type === 'tf') {
                // Sử dụng hàm tính điểm TF đã cập nhật
                scoreResult = calculateTFQuestionScore(q, index, pointsPerMainQuestion);
            } else if (q.type === 'fill') {
                scoreResult = calculateFillQuestionScore(q, index, pointsPerMainQuestion);
            }

            if (scoreResult) {
                resultContainer.appendChild(scoreResult.element);
                totalScore += scoreResult.points;
            }
        });

        const finalScoreRounded = totalScore.toFixed(2);

        // Hiển thị kết quả và các nút điều khiển
         if (scoreContainer) scoreContainer.innerHTML = `Kết quả: <strong style="font-size: 1.1em;">Điểm: ${finalScoreRounded} / 10</strong>`;
         if (scoreContainer) scoreContainer.style.display = 'block';
         if (filterContainer) filterContainer.style.display = 'block';
         if (resultContainer) resultContainer.style.display = 'block';

         // Ẩn cả hai nút submit, hiển thị các nút khác
         if (submitButtonToolbar) submitButtonToolbar.style.display = 'none';
         if (submitButton) submitButton.style.display = 'none'; // Ẩn nút submit gốc
         if (retryButton) retryButton.style.display = 'inline-block';
         if (backToListAfterResultBtn) backToListAfterResultBtn.style.display = 'inline-block';


        // Áp dụng bộ lọc mặc định là hiển thị tất cả
         if (filterContainer) {
              applyFilter('all');
              // Cập nhật trạng thái active cho nút lọc "Tất cả"
              filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                  btn.classList.remove('active');
                  if (btn.dataset.filter === 'all') btn.classList.add('active');
              });
         }

        // Cuộn đến phần kết quả nếu không phải nộp tự động
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
            item.classList.remove('hidden-result'); // Hiển thị tất cả trước khi lọc
            if (filterType === 'all') {
                // Không làm gì cả
            } else if (filterType === 'correct') {
                if (correctness !== 'correct') {
                    item.classList.add('hidden-result');
                }
            } else if (filterType === 'incorrect') {
                if (correctness === 'correct') {
                    item.classList.add('hidden-result');
                }
            }
        });
    }
    // --- Kết thúc Logic Lọc kết quả ---


    // --- Logic Xử lý nút ---
    function handleRetryQuiz() {
        // Dừng timer nếu đang chạy
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        // Quay lại danh sách quiz của môn học hiện tại
        if (selectedSubjectSlug) {
            displayQuizList(selectedSubjectSlug);
        } else {
            // Trường hợp không có môn học được chọn (lỗi), quay về màn hình chọn môn
            displaySubjectSelection();
        }
        // Đặt lại biến lưu câu hỏi đã xáo trộn
        shuffledQuizQuestions = [];
        selectedQuizData = null; // Đặt lại dữ liệu quiz đã chọn
        currentSubjectData = null; // Đặt lại dữ liệu môn học hiện tại
    }

    // --- Logic Bắt đầu bài thi (Đã cập nhật để sắp xếp loại câu hỏi) ---
    function handleStartQuiz() {
        if (!selectedQuizData) {
             console.error("Không có dữ liệu quiz để bắt đầu.");
             return;
        }

        // Tách câu hỏi theo loại
        const mcQuestions = selectedQuizData.questions.filter(q => q.type === 'mc');
        const tfQuestions = selectedQuizData.questions.filter(q => q.type === 'tf');
        const fillQuestions = selectedQuizData.questions.filter(q => q.type === 'fill');

        // Xáo trộn câu hỏi trong từng loại
        const shuffledMc = shuffleArray(mcQuestions);
        const shuffledTf = shuffleArray(tfQuestions); // Có thể không cần xáo trộn statements bên trong, chỉ xáo trộn thứ tự các câu TF
        const shuffledFill = shuffleArray(fillQuestions);

        // Ghép lại theo thứ tự: Trắc nghiệm -> Đúng/Sai -> Điền từ
        shuffledQuizQuestions = shuffledMc.concat(shuffledTf, shuffledFill);

        // --- Logic Xáo trộn đáp án MC (vẫn cần sau khi xáo trộn câu hỏi) ---
        shuffledQuizQuestions = shuffledQuizQuestions.map(q => {
            if (q.type === 'mc') {
                const originalOptions = q.options;
                const originalCorrectAnswerIndex = q.correctAnswer;
                const correctAnswerText = originalOptions[originalCorrectAnswerIndex];
                const shuffledOptions = shuffleArray(originalOptions);
                const newCorrectAnswerIndex = shuffledOptions.indexOf(correctAnswerText);
                return {
                    ...q,
                    options: shuffledOptions,
                    correctAnswer: newCorrectAnswerIndex
                };
            }
            // Đối với câu hỏi TF và Fill, trả về nguyên bản (statements TF không cần xáo trộn)
            return q;
        });
        // --- Kết thúc Logic Xáo trộn đáp án MC ---


        displayQuizContent(shuffledQuizQuestions);

        // Kiểm tra trước khi bắt đầu timer
        if (selectedQuizData.timeLimitMinutes > 0) {
             startTimer(selectedQuizData.timeLimitMinutes);
             // Hiển thị timer trong toolbar
             if(timerContainer) timerContainer.style.display = 'inline-flex';
        } else {
             // Nếu không có giới hạn thời gian, ẩn timer
             if(timerContainer) timerContainer.style.display = 'none';
        }

        // Hiển thị cả hai nút submit
        if (submitButton) submitButton.style.display = 'inline-block';
        if (submitButtonToolbar) submitButtonToolbar.style.display = 'inline-block';


        navigateTo('quiz');
    }
    // --- Kết thúc Logic Xử lý nút ---


    // --- LOGIC COUNTDOWN ĐẾN NGÀY THI (Đã cập nhật) ---
    // --- THAY ĐỔI NGÀY GIỜ KẾT THÚC TẠI ĐÂY ---
    // Giữ nguyên ngày từ script.js ban đầu
    const countdownDate = new Date("May 12, 2025 07:15:00").getTime();
    // --------------------------------------------

    const messageEl = document.getElementById('message');
    const countdownEl = document.getElementById('countdown');

    // Biến để lưu giá trị trước đó của từng chữ số
    let prevCountdownValues = {
        'days-tens': -1, 'days-units': -1,
        'hours-tens': -1, 'hours-units': -1,
        'minutes-tens': -1, 'minutes-units': -1,
        'seconds-tens': -1, 'seconds-units': -1,
    };

    // Hàm cập nhật một chữ số với hiệu ứng trượt (Đã sửa lỗi mất số)
    function updateDigit(elementId, newDigit) {
        const prevDigit = prevCountdownValues[elementId];

        if (newDigit !== prevDigit) {
            const currentElement = document.getElementById(elementId);
            if (!currentElement) {
                 console.warn(`Element with ID ${elementId} not found for countdown.`);
                 return;
            }

            // Thêm class để kích hoạt animation trượt xuống
            currentElement.style.transform = 'translateY(100%)';
            currentElement.style.transition = 'transform 0.4s ease-in-out';


            // Sau khi animation trượt xuống hoàn thành, cập nhật nội dung và trượt lên
            currentElement.addEventListener('transitionend', function handler() {
                // Chỉ thực hiện một lần cho sự kiện transitionend
                currentElement.removeEventListener('transitionend', handler);

                // Cập nhật nội dung văn bản của phần tử hiện tại
                currentElement.textContent = newDigit;

                // Tắt transition tạm thời để đặt lại vị trí mà không thấy nhảy
                currentElement.style.transition = 'none';
                currentElement.style.transform = 'translateY(-100%)'; // Đặt lại vị trí ở trên

                // Kích hoạt lại transition và trượt lên vị trí ban đầu
                requestAnimationFrame(() => {
                     requestAnimationFrame(() => { // Cần requestAnimationFrame kép để đảm bảo style 'none' được áp dụng trước khi kích hoạt lại transition
                          currentElement.style.transition = 'transform 0.4s ease-in-out';
                          currentElement.style.transform = 'translateY(0)';
                     });
                });

            });

             // Cập nhật giá trị đã lưu sau khi bắt đầu animation
             prevCountdownValues[elementId] = newDigit;
        }
    }


    // Cập nhật bộ đếm ngược
    function updateExamCountdown() {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        // Khi hết thời gian
        if (distance < 0) {
            clearInterval(examCountdownInterval);
             const allDigitIds = Object.keys(prevCountdownValues);
             allDigitIds.forEach(id => {
                  // Sử dụng updateDigit để đưa các số về 0 với animation
                  updateDigit(id, '0');
                  // Sau khi gọi updateDigit, đảm bảo giá trị 0 được lưu
                  prevCountdownValues[id] = '0';
             });

            if (countdownEl) countdownEl.style.display = 'none';
            if (messageEl) messageEl.textContent = "Chúc bạn thi tốt!"; // Hoặc thông báo khác khi hết giờ
            return;
        }

        // Tính toán thời gian
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Tách thành các chữ số và cập nhật
        updateDigit('days-tens', Math.floor(days / 10));
        updateDigit('days-units', days % 10);
        updateDigit('hours-tens', Math.floor(hours / 10));
        updateDigit('hours-units', hours % 10);
        updateDigit('minutes-tens', Math.floor(minutes / 10));
        updateDigit('minutes-units', minutes % 10);
        updateDigit('seconds-tens', Math.floor(seconds / 10));
        updateDigit('seconds-units', seconds % 10);
    }

    // Hàm khởi tạo hiển thị ban đầu (không có animation)
    function initializeExamCountdownDisplay() {
        const now = new Date().getTime();
        const distance = countdownDate - now > 0 ? countdownDate - now : 0;

        if (distance <= 0) {
            if (messageEl) messageEl.textContent = "Chúc bạn thi tốt!";
            if (countdownEl) countdownEl.style.display = 'none';
             // Đảm bảo các chữ số hiển thị 0
             const allDigitIds = Object.keys(prevCountdownValues);
             allDigitIds.forEach(id => {
                  const el = document.getElementById(id);
                  if (el) el.textContent = '0';
                  prevCountdownValues[id] = 0; // Lưu giá trị 0 ban đầu
             });
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Thiết lập giá trị ban đầu cho các chữ số (không animation) và lưu vào prevCountdownValues
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
                prevCountdownValues[id] = initialTimeValues[id]; // Lưu giá trị ban đầu
            } else {
                 console.warn("Initial digit span element not found in HTML:", id);
            }
        }
    }


    // Bắt đầu bộ đếm ngược nếu các phần tử cần thiết tồn tại
    let examCountdownInterval = null; // Khai báo biến interval ở phạm vi ngoài
    if (countdownEl && messageEl) {
        initializeExamCountdownDisplay(); // Khởi tạo hiển thị ban đầu
        examCountdownInterval = setInterval(updateExamCountdown, 1000); // Bắt đầu interval cập nhật
    } else {
         console.warn("Countdown elements (#countdown hoặc #message) not found. Countdown feature disabled.");
    }
    // --- KẾT THÚC LOGIC COUNTDOWN ---


    // --- Gắn sự kiện ---
    // Gắn sự kiện cho nút Bắt đầu (chức năng cũ khi không có redirectUrl)
    if (startBtn) startBtn.addEventListener('click', handleStartQuiz); else console.warn("Start button not found.");

    // Gắn sự kiện cho nút Nộp bài (trên toolbar)
    // Cả hai nút submit sẽ gọi cùng một hàm tính điểm
    if (submitButtonToolbar) submitButtonToolbar.addEventListener('click', () => calculateAndDisplayScore(false)); else console.warn("Submit button toolbar not found (event listener not attached).");

    // Gắn sự kiện cho nút Nộp bài (gốc ở dưới)
    if (submitButton) submitButton.addEventListener('click', () => calculateAndDisplayScore(false)); else console.warn("Submit button (original) not found (event listener not attached).");


    // Gắn sự kiện cho nút Làm lại
    if (retryButton) retryButton.addEventListener('click', handleRetryQuiz); else console.warn("Retry button not found.");

    // Gắn sự kiện cho nút Về danh sách bài thi sau khi có kết quả
    if (backToListAfterResultBtn) backToListAfterResultBtn.addEventListener('click', handleRetryQuiz); else console.warn("Back to list after result button not found.");

    // Gắn sự kiện cho nút Quay lại màn hình chọn môn
    if (backToSubjectsBtn) backToSubjectsBtn.addEventListener('click', () => {
        // Dừng timer nếu đang chạy khi quay lại
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        shuffledQuizQuestions = []; // Reset câu hỏi đã xáo trộn
        selectedQuizData = null; // Reset dữ liệu quiz đã chọn
        currentSubjectData = null; // Reset dữ liệu môn học hiện tại
        displaySubjectSelection();
    }); else console.warn("Back to subjects button not found.");

    // Gắn sự kiện cho nút Quay lại danh sách bài thi (từ màn hình info)
    if (backToQuizListBtn) backToQuizListBtn.addEventListener('click', () => {
        // Dừng timer nếu đang chạy khi quay lại (trường hợp hiếm xảy ra từ info screen)
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        shuffledQuizQuestions = []; // Reset câu hỏi đã xáo trộn
        selectedQuizData = null; // Reset dữ liệu quiz đã chọn
        // Quay lại danh sách quiz của môn học hiện tại (dữ liệu đã được lưu trong currentSubjectData)
        if (selectedSubjectSlug && currentSubjectData) {
            // Tái hiển thị danh sách quiz từ dữ liệu đã tải
            displayQuizListFromData(currentSubjectData);
        } else {
            // Trường hợp không có môn học được chọn hoặc dữ liệu bị mất, quay về màn hình chọn môn
            displaySubjectSelection();
        }
    }); else console.warn("Back to quiz list button not found.");

     // Gắn sự kiện cho nút Quay lại danh sách bài thi (từ toolbar làm bài)
     if (backToQuizListFromQuizBtn) backToQuizListFromQuizBtn.addEventListener('click', () => {
         // Dừng timer nếu đang chạy khi quay lại
         if (timerIntervalId) {
             clearInterval(timerIntervalId);
             timerIntervalId = null;
         }
         shuffledQuizQuestions = []; // Reset câu hỏi đã xáo trộn
         selectedQuizData = null; // Reset dữ liệu quiz đã chọn
         // Quay lại danh sách quiz của môn học hiện tại (dữ liệu đã được lưu trong currentSubjectData)
         if (selectedSubjectSlug && currentSubjectData) {
             // Tái hiển thị danh sách quiz từ dữ liệu đã tải
             displayQuizListFromData(currentSubjectData);
         } else {
             // Trường hợp không có môn học được chọn hoặc dữ liệu bị mất, quay về màn hình chọn môn
             displaySubjectSelection();
         }
     }); else console.warn("Back to quiz list from quiz button not found.");


    // Hàm hỗ trợ hiển thị danh sách quiz từ dữ liệu môn học đã có sẵn (sau khi import)
    function displayQuizListFromData(subjectData) {
         if (!quizListContainer || !subjectData || !subjectData.quizzes) {
              console.error("Không thể hiển thị danh sách quiz từ dữ liệu đã có.");
              // Quay lại màn hình chọn môn nếu không đủ dữ liệu
              displaySubjectSelection();
              return;
         }

         if (quizListTitle) {
              quizListTitle.textContent = subjectData.subjectName;
         } else {
              console.warn("Phần tử tiêu đề danh sách quiz không tồn tại.");
         }

         quizListContainer.innerHTML = ''; // Xóa nội dung cũ
         if (subjectData.quizzes.length > 0) {
             subjectData.quizzes.forEach(quiz => {
                 const listItem = createQuizListItem(quiz);
                 quizListContainer.appendChild(listItem);
             });
         } else {
             quizListContainer.innerHTML = '<p>Chưa có bài thi nào cho môn học này.</p>';
         }
         navigateTo('quizList');
    }


    // Lắng nghe sự kiện click trên container bộ lọc
    if (filterContainer) {
         filterContainer.addEventListener('click', (event) => {
             if (event.target.classList.contains('filter-btn')) {
                 const filterType = event.target.dataset.filter;
                 filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                 event.target.classList.add('active');
                 applyFilter(filterType);
             }
         });
    } else {
         console.warn("Filter container not found.");
    }

    // --- Logic cho nút và menu đa năng (Mới) ---
    if (multiFunctionButton && multiFunctionMenu) {
        multiFunctionButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
            multiFunctionMenu.classList.toggle('visible');
            multiFunctionMenu.classList.toggle('hidden');
        });

        // Đóng menu khi click ra ngoài
        document.addEventListener('click', (event) => {
            // Kiểm tra xem click có nằm ngoài nút và menu không
            if (!multiFunctionButton.contains(event.target) && !multiFunctionMenu.contains(event.target)) {
                multiFunctionMenu.classList.remove('visible');
                multiFunctionMenu.classList.add('hidden');
            }
        });

        // Đóng menu khi một mục trong menu được click (tùy chọn)
        multiFunctionMenu.addEventListener('click', () => {
             multiFunctionMenu.classList.remove('visible');
             multiFunctionMenu.classList.add('hidden');
        });

    } else {
        console.warn("Multi-function button or menu not found.");
    }
    // --- Kết thúc Logic nút đa năng ---


    // --- Kết thúc Gắn sự kiện ---


    // --- Khởi tạo ứng dụng ---
    displaySubjectSelection(); // Bắt đầu bằng màn hình chọn môn học

}); // Kết thúc DOMContentLoaded
