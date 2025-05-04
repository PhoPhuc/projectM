// data/hoahoc.js

// Dữ liệu quiz cho môn Hoá học
const hoaHocQuizData = {
    subjectName: 'Hoá học',
    icon: 'ph-flask',
    quizzes: [
        {
            id: 'hh-1',
            title: 'Đang cập nhật.....',
            timeLimitMinutes: 20,
            questions: [
                { type: 'mc', question: "Hạt nhân nguyên tử được cấu tạo bởi?", options: ["Proton và Electron", "Neutron và Electron", "Proton và Neutron", "Chỉ Proton"], correctAnswer: 2 },
                { type: 'fill', question: "Ký hiệu hóa học của nước là gì?", correctAnswer: "H2O" }
            ]
        }
    ]
};

// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default hoaHocQuizData;

