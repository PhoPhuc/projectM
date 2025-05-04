// data/lichsu.js

// Dữ liệu quiz cho môn Lịch sử
const lichSuQuizData = {
    subjectName: 'Lịch sử',
    icon: 'ph-scroll',
    quizzes: [
        // --- Bài quiz ôn tập Học kì 2 môn Sinh học ---
        {
            id: 'ls-1',
            title: 'Lịch sử Học kì 2',
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
            title: '(LUYỆT TẬP) Lịch sử Học kì 2',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/baiozn', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        }
    ]
};


// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default lichSuQuizData;

