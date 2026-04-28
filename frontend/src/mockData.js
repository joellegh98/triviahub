/**
 * Quiz shape:
 * {
 *   id: string,
 *   title: string,
 *   category: string,
 *   description: string
 * }
 *
 * Question shape:
 * {
 *   id: string,
 *   quizId: string,
 *   text: string,
 *   options: [string, string, string, string],
 *   correctIndex: number,
 *   hint: string
 * }
 *
 * GameResult shape:
 * {
 *   id: string,
 *   quizId: string,
 *   playerName: string,
 *   score: number,
 *   correctAnswers: number,
 *   totalQuestions: number,
 *   durationSec: number,
 *   hintsUsed: number,
 *   playedAt: string
 * }
 */

export const quizzes = [
  {
    id: 'quiz-js-fundamentals',
    title: 'JavaScript Fundamentals',
    category: 'programming',
    description: 'Variables, arrays, functions, and core JS behavior.',
  },
  {
    id: 'quiz-world-geography',
    title: 'World Geography',
    category: 'geography',
    description: 'Countries, capitals, landmarks, and world regions.',
  },
  {
    id: 'quiz-general-science',
    title: 'General Science',
    category: 'science',
    description: 'Physics, chemistry, biology, and earth science basics.',
  },
]

export const questions = [
  {
    id: 'q-js-1',
    quizId: 'quiz-js-fundamentals',
    text: 'Which keyword declares a block-scoped variable?',
    options: ['var', 'let', 'const', 'both let and const'],
    correctIndex: 3,
    hint: 'Think about ES6 declarations.',
  },
  {
    id: 'q-js-2',
    quizId: 'quiz-js-fundamentals',
    text: 'What does Array.prototype.map return?',
    options: [
      'A filtered array',
      'A new transformed array',
      'The same original array',
      'A single value',
    ],
    correctIndex: 1,
    hint: 'It keeps the same length as original.',
  },
  {
    id: 'q-js-3',
    quizId: 'quiz-js-fundamentals',
    text: 'Which value is strictly equal to itself?',
    options: ['NaN', 'undefined', 'null', '0'],
    correctIndex: 3,
    hint: 'NaN is a famous exception.',
  },
  {
    id: 'q-js-4',
    quizId: 'quiz-js-fundamentals',
    text: 'What is the output type of JSON.parse?',
    options: ['string', 'number', 'javascript value/object', 'boolean only'],
    correctIndex: 2,
    hint: 'It recreates native structures from JSON.',
  },
  {
    id: 'q-js-5',
    quizId: 'quiz-js-fundamentals',
    text: 'Which method adds an item to the end of an array?',
    options: ['shift', 'push', 'unshift', 'concat'],
    correctIndex: 1,
    hint: 'Its opposite is pop.',
  },
  {
    id: 'q-geo-1',
    quizId: 'quiz-world-geography',
    text: 'What is the capital city of Canada?',
    options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'],
    correctIndex: 2,
    hint: 'It is in Ontario but not Toronto.',
  },
  {
    id: 'q-geo-2',
    quizId: 'quiz-world-geography',
    text: 'Which desert is the largest hot desert in the world?',
    options: ['Gobi', 'Sahara', 'Kalahari', 'Arabian'],
    correctIndex: 1,
    hint: 'It spans North Africa.',
  },
  {
    id: 'q-geo-3',
    quizId: 'quiz-world-geography',
    text: 'The Andes mountain range is mainly on which continent?',
    options: ['Asia', 'Europe', 'South America', 'Africa'],
    correctIndex: 2,
    hint: 'Think of Chile and Peru.',
  },
  {
    id: 'q-geo-4',
    quizId: 'quiz-world-geography',
    text: 'Which country has the largest land area?',
    options: ['Canada', 'China', 'United States', 'Russia'],
    correctIndex: 3,
    hint: 'It stretches across Europe and Asia.',
  },
  {
    id: 'q-geo-5',
    quizId: 'quiz-world-geography',
    text: 'Which river flows through Egypt into the Mediterranean Sea?',
    options: ['Amazon', 'Nile', 'Danube', 'Volga'],
    correctIndex: 1,
    hint: 'Often called the longest river in the world.',
  },
  {
    id: 'q-sci-1',
    quizId: 'quiz-general-science',
    text: 'What is the chemical symbol for gold?',
    options: ['Gd', 'Ag', 'Au', 'Go'],
    correctIndex: 2,
    hint: 'It comes from the Latin word aurum.',
  },
  {
    id: 'q-sci-2',
    quizId: 'quiz-general-science',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
    correctIndex: 1,
    hint: 'Its color comes from iron oxide.',
  },
  {
    id: 'q-sci-3',
    quizId: 'quiz-general-science',
    text: 'What is the process by which plants make food?',
    options: ['Respiration', 'Digestion', 'Photosynthesis', 'Fermentation'],
    correctIndex: 2,
    hint: 'It needs sunlight, water, and carbon dioxide.',
  },
  {
    id: 'q-sci-4',
    quizId: 'quiz-general-science',
    text: 'What force keeps planets in orbit around the sun?',
    options: ['Magnetism', 'Friction', 'Electricity', 'Gravity'],
    correctIndex: 3,
    hint: 'It is proportional to mass.',
  },
  {
    id: 'q-sci-5',
    quizId: 'quiz-general-science',
    text: 'Which gas do humans mainly inhale for survival?',
    options: ['Nitrogen', 'Carbon dioxide', 'Oxygen', 'Hydrogen'],
    correctIndex: 2,
    hint: 'It is about 21% of Earth atmosphere.',
  },
]

export const gameResults = [
  {
    id: 'gr-001',
    quizId: 'quiz-js-fundamentals',
    playerName: 'Noa',
    score: 86,
    correctAnswers: 4,
    totalQuestions: 5,
    durationSec: 78,
    hintsUsed: 1,
    playedAt: '2026-04-25T10:30:00.000Z',
  },
  {
    id: 'gr-002',
    quizId: 'quiz-world-geography',
    playerName: 'Joelle',
    score: 92,
    correctAnswers: 5,
    totalQuestions: 5,
    durationSec: 65,
    hintsUsed: 0,
    playedAt: '2026-04-25T11:05:00.000Z',
  },
  {
    id: 'gr-003',
    quizId: 'quiz-general-science',
    playerName: 'Dana',
    score: 74,
    correctAnswers: 4,
    totalQuestions: 5,
    durationSec: 120,
    hintsUsed: 2,
    playedAt: '2026-04-26T08:40:00.000Z',
  },
]

