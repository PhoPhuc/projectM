// data/vatli.js

// Dữ liệu quiz cho môn Vật lí
const vatLiQuizData = {// data/vatli.js

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
            redirectUrl: 'https://azota.vn/de-thi/vuoute', // <-- Thêm URL chuyển hướng tại đây
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
            redirectUrl: 'https://azota.vn/de-thi/nuicif', // Thêm dấu phẩy ở đây
            questions: [
                 // ... các câu hỏi ...
            ]
        }
    ]
};

// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default vatLiQuizData;
    subjectName: 'Vật lí',
    icon: 'ph-atom',
    quizzes: [
        {
            id: 'vl-1',
            title: 'Đang cập nhật.....',
            timeLimitMinutes: 30,
            questions: [
                { type: 'mc', question: "Công thức tính chu kỳ dao động của con lắc lò xo?", options: ["T=2π√(m/k)", "T=2π√(k/m)", "T=2π√(l/g)", "T=1/f"], correctAnswer: 0 },
                { type: 'tf', question: "Đánh giá về dao động điều hòa:", statements: [ { text: "Li độ biến thiên điều hòa theo thời gian.", correctAnswer: true }, { text: "Vận tốc luôn cùng pha với li độ.", correctAnswer: false }, { text: "Gia tốc luôn ngược pha với li độ.", correctAnswer: true }, { text: "Năng lượng được bảo toàn nếu bỏ qua ma sát.", correctAnswer: true } ] },
                { type: 'fill', question: "Đơn vị của tần số là gì?", correctAnswer: "Hertz" }, // Có thể là mảng: ["Hertz", "Hz"]
            ]
        },
        { id: 'vl-2', title: 'Đang cập nhật.....', timeLimitMinutes: 45, questions: [ { type: 'mc', question: "Sóng ngang truyền được trong môi trường nào?", options: ["Chất rắn và bề mặt chất lỏng", "Chất khí", "Chân không", "Cả rắn, lỏng, khí"], correctAnswer: 0 } ] }
    ]
};

// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default vatLiQuizData;
