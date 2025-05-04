// data/vatli.js

// Dữ liệu quiz cho môn Vật lí
const vatLiQuizData = {
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
