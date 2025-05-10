// data/lichsu.js

// Dữ liệu quiz cho môn Lịch sử
const lichSuQuizData = {
    subjectName: 'Lịch sử',
    icon: 'ph-scroll',
    quizzes: [
        // --- Bài quiz ôn tập Học kì 2 môn Sinh học ---
        {
            id: 'ls-1',
            title: 'Full trắc nghiệm',
            timeLimitMinutes: 55, // 55 phút cho 58 câu + 9 câu TF + 1 câu MC mới = 68 câu. Có thể cần điều chỉnh thời gian.
            redirectUrl: 'https://azota.vn/de-thi/dxsx3a', // <-- Thêm URL chuyển hướng tại đây
            questions: [
                // ... (các câu hỏi cũ) ...
                { type: 'mc', question: "Biểu hiện nào sau đây không phải là biểu hiện của sinh trưởng?", options: ["Tăng chiều cao của cây.", "Tăng số lượng tế bào trong cơ thể.", "Tăng khối lượng của cơ thể.", "Nở hoa, kết trái."], correctAnswer: 3 },
                // ... (các câu hỏi khác) ...
            ]
        },
        {
            id: 'ls-2',
            title: '(LUYỆT TẬP) Full trắc nghiệm',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/baiozn', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        },
        {
            id: 'ls-ds',
            title: '(Internet) Tham khảo đúng sai',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/hbkn5j', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        },
        {
            id: 'ls-3',
            title: '(1-35) Trắc nghiệm 35 câu đầu',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/fc1chs', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        },
        {
            id: 'ls-4',
            title: '(36-70) Trắc nghiệm 35 câu tiếp theo',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/zpzzmt', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        },
        {
            id: 'ls-5',
            title: '(71-106) Trắc nghiệm 36 câu cuối',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/304r8l', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        }
    ]
};


// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default lichSuQuizData;

