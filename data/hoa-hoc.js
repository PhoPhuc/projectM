// data/hoahoc.js

// Dữ liệu quiz cho môn Hoá học
const hoaHocQuizData = {
    subjectName: 'Hoá học',
    icon: 'ph-flask',
    quizzes: [
        // --- Bài quiz ôn tập Học kì 2 môn Sinh học ---
        {
            id: 'hh-1',
            title: 'Hoá học Học kì 2',
            timeLimitMinutes: 55, // 55 phút cho 58 câu + 9 câu TF + 1 câu MC mới = 68 câu. Có thể cần điều chỉnh thời gian.
            redirectUrl: 'https://azota.vn/de-thi/fbtu4u', // <-- Thêm URL chuyển hướng tại đây
            questions: [
                // ... (các câu hỏi cũ) ...
                { type: 'mc', question: "Biểu hiện nào sau đây không phải là biểu hiện của sinh trưởng?", options: ["Tăng chiều cao của cây.", "Tăng số lượng tế bào trong cơ thể.", "Tăng khối lượng của cơ thể.", "Nở hoa, kết trái."], correctAnswer: 3 },
                // ... (các câu hỏi khác) ...
            ]
        },
        {
            id: 'hh-2',
            title: '(LUYỆT TẬP) Hoá học Học kì 2',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/r7b6cp', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        }
    ]
};

// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default hoaHocQuizData;

