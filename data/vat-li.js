// data/vatli.js

// Dữ liệu quiz cho môn Vật lí
const vatLiQuizData = {
    subjectName: 'Vật lí',
    icon: 'ph-atom',
    quizzes: [
        // --- Bài quiz ôn tập Học kì 2 môn Sinh học ---
        {
            id: 'vl-1',
            title: 'Vật lí Học kì 2',
            timeLimitMinutes: 55, // 55 phút cho 58 câu + 9 câu TF + 1 câu MC mới = 68 câu. Có thể cần điều chỉnh thời gian.
            redirectUrl: 'https://azota.vn/de-thi/en31uf', // <-- Thêm URL chuyển hướng tại đây
            questions: [
                // ... (các câu hỏi cũ) ...
                { type: 'mc', question: "Biểu hiện nào sau đây không phải là biểu hiện của sinh trưởng?", options: ["Tăng chiều cao của cây.", "Tăng số lượng tế bào trong cơ thể.", "Tăng khối lượng của cơ thể.", "Nở hoa, kết trái."], correctAnswer: 3 },
                // ... (các câu hỏi khác) ...
            ]
        },
        {
            id: 'vl-2',
            title: '(LUYỆT TẬP) Vật Lí Học kì 2',
            timeLimitMinutes: 45,
            redirectUrl: 'https://azota.vn/de-thi/ef7yrg', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        }
    ]
};

// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default vatLiQuizData;
