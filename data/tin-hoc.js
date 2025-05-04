// data/tinhoc.js

// Dữ liệu quiz cho môn Tin học
const tinHocQuizData = {
    subjectName: 'Tin học',
    icon: 'ph-laptop',
    quizzes: [
        {
            id: 'th-1',
            title: 'Đang cập nhật.....',
            timeLimitMinutes: 25,
            questions: [
                { type: 'mc', question: "CPU là viết tắt của?", options: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Control Processing Unit"], correctAnswer: 0 },
                { type: 'tf', question: "Đánh giá về phần cứng và phần mềm:", statements: [ { text: "RAM là bộ nhớ truy cập ngẫu nhiên.", correctAnswer: true }, { text: "Hệ điều hành là một phần cứng.", correctAnswer: false }, { text: "Màn hình là thiết bị nhập.", correctAnswer: false }, { text: "Chuột là thiết bị xuất.", correctAnswer: false } ] }
            ]
        }
    ]
};

// Xuất dữ liệu để file script.js chính có thể nhập (import)
export default tinHocQuizData;

