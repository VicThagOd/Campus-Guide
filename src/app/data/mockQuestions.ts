export type SubjectName =
  | "English Language"
  | "Mathematics"
  | "General Knowledge"
  | "Current Affairs";

export interface MockQuestion {
  id: number;
  subject: SubjectName;
  question: string;
  options: string[];
  correctAnswer: number;
}

const subjectQuestionSets: Record<SubjectName, Omit<MockQuestion, "id" | "subject">[]> = {
  "English Language": [
    {
      question: "Choose the word that best completes the sentence: The principal asked the students to remain ____ during the assembly.",
      options: ["silent", "silence", "silencing", "silently"],
      correctAnswer: 0,
    },
    {
      question: "Identify the synonym of 'diligent'.",
      options: ["careless", "hardworking", "hostile", "weak"],
      correctAnswer: 1,
    },
    {
      question: "Choose the correct option: If I ____ earlier, I would have caught the bus.",
      options: ["left", "had left", "leave", "am leaving"],
      correctAnswer: 1,
    },
    {
      question: "Which of the following is correctly punctuated?",
      options: [
        "However we continued the journey.",
        "However, we continued the journey.",
        "However we, continued the journey.",
        "However; we continued, the journey.",
      ],
      correctAnswer: 1,
    },
    {
      question: "Choose the antonym of 'scarce'.",
      options: ["few", "limited", "abundant", "rare"],
      correctAnswer: 2,
    },
    {
      question: "In the sentence 'The boys have finished their homework,' the underlined word is a ____.",
      options: ["verb", "pronoun", "noun", "adjective"],
      correctAnswer: 1,
    },
    {
      question: "Choose the correctly spelt word.",
      options: ["Occassion", "Ocassion", "Occasion", "Occassionn"],
      correctAnswer: 2,
    },
    {
      question: "Which literary device is used in 'The wind whispered through the trees'?",
      options: ["hyperbole", "metaphor", "personification", "irony"],
      correctAnswer: 2,
    },
    {
      question: "Choose the most suitable title for a passage about the importance of reading habits.",
      options: [
        "How to Sleep Better",
        "The Value of Reading Daily",
        "Playing Outdoor Games",
        "Understanding Basic Algebra",
      ],
      correctAnswer: 1,
    },
    {
      question: "Select the correct reported speech: Ada said, 'I am studying.'",
      options: [
        "Ada said that she is studying.",
        "Ada said that she was studying.",
        "Ada said that she studies.",
        "Ada said she studied yesterday.",
      ],
      correctAnswer: 1,
    },
    {
      question: "Choose the word that best fits: The teacher's explanation was very ____.",
      options: ["clarity", "clear", "clearly", "cleared"],
      correctAnswer: 1,
    },
    {
      question: "What is the function of a paragraph topic sentence?",
      options: [
        "To close the essay",
        "To introduce the main idea",
        "To provide references",
        "To summarize the title",
      ],
      correctAnswer: 1,
    },
    {
      question: "Select the correct meaning of the idiom 'once in a blue moon'.",
      options: ["very regularly", "very rarely", "in anger", "without planning"],
      correctAnswer: 1,
    },
  ],
  Mathematics: [
    {
      question: "Solve: 3x + 7 = 22.",
      options: ["3", "4", "5", "6"],
      correctAnswer: 2,
    },
    {
      question: "What is 15% of 200?",
      options: ["15", "20", "25", "30"],
      correctAnswer: 3,
    },
    {
      question: "Find the value of 2^5.",
      options: ["10", "16", "32", "64"],
      correctAnswer: 2,
    },
    {
      question: "A triangle has angles 50° and 60°. What is the third angle?",
      options: ["70°", "80°", "90°", "100°"],
      correctAnswer: 0,
    },
    {
      question: "Simplify: 5(2a - 3).",
      options: ["10a - 3", "10a - 15", "7a - 15", "10a + 15"],
      correctAnswer: 1,
    },
    {
      question: "What is the median of 2, 4, 6, 8, 10?",
      options: ["4", "5", "6", "7"],
      correctAnswer: 2,
    },
    {
      question: "If y = 4 when x = 2, what is y/x?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 1,
    },
    {
      question: "The perimeter of a square is 36 cm. What is one side?",
      options: ["6 cm", "8 cm", "9 cm", "12 cm"],
      correctAnswer: 2,
    },
    {
      question: "Convert 0.75 to a fraction.",
      options: ["1/2", "2/3", "3/4", "4/5"],
      correctAnswer: 2,
    },
    {
      question: "What is the value of 9 x 7?",
      options: ["56", "63", "72", "79"],
      correctAnswer: 1,
    },
    {
      question: "Solve: 12 ÷ 3 + 4.",
      options: ["6", "7", "8", "9"],
      correctAnswer: 2,
    },
    {
      question: "If a book costs N1,200 and is discounted by N200, what is the new price?",
      options: ["N800", "N900", "N1,000", "N1,100"],
      correctAnswer: 2,
    },
    {
      question: "What is the area of a rectangle of length 8 cm and width 5 cm?",
      options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"],
      correctAnswer: 2,
    },
  ],
  "General Knowledge": [
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Mars", "Venus", "Mercury", "Jupiter"],
      correctAnswer: 0,
    },
    {
      question: "Who wrote 'Things Fall Apart'?",
      options: ["Wole Soyinka", "Chinua Achebe", "Ben Okri", "Buchi Emecheta"],
      correctAnswer: 1,
    },
    {
      question: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      correctAnswer: 2,
    },
    {
      question: "Which organ pumps blood around the human body?",
      options: ["lungs", "kidney", "heart", "liver"],
      correctAnswer: 2,
    },
    {
      question: "The largest ocean in the world is the ____.",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctAnswer: 3,
    },
    {
      question: "Which Nigerian city is known as the Coal City?",
      options: ["Enugu", "Kano", "Ibadan", "Benin"],
      correctAnswer: 0,
    },
    {
      question: "What is the boiling point of water at sea level?",
      options: ["50°C", "75°C", "100°C", "120°C"],
      correctAnswer: 2,
    },
    {
      question: "Which continent is Nigeria located in?",
      options: ["Asia", "Europe", "South America", "Africa"],
      correctAnswer: 3,
    },
    {
      question: "Who painted the Mona Lisa?",
      options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Van Gogh"],
      correctAnswer: 1,
    },
    {
      question: "Which instrument is used to measure temperature?",
      options: ["barometer", "thermometer", "speedometer", "ammeter"],
      correctAnswer: 1,
    },
    {
      question: "How many states are in Nigeria?",
      options: ["24", "30", "36", "40"],
      correctAnswer: 2,
    },
    {
      question: "Which part of the plant conducts photosynthesis most actively?",
      options: ["root", "stem", "leaf", "flower"],
      correctAnswer: 2,
    },
  ],
  "Current Affairs": [
    {
      question: "What are the green-white-green colours on the Nigerian flag meant to represent?",
      options: [
        "peace and unity",
        "agriculture and peace",
        "wealth and bravery",
        "strength and justice",
      ],
      correctAnswer: 1,
    },
    {
      question: "Nigeria celebrates Independence Day on ____.",
      options: ["October 1", "May 29", "June 12", "January 1"],
      correctAnswer: 0,
    },
    {
      question: "The capital city of Rivers State is ____.",
      options: ["Warri", "Port Harcourt", "Yenagoa", "Owerri"],
      correctAnswer: 1,
    },
    {
      question: "Which arm of government interprets the law?",
      options: ["Executive", "Legislature", "Judiciary", "Council"],
      correctAnswer: 2,
    },
    {
      question: "The current Nigerian currency is the ____.",
      options: ["cedi", "naira", "dollar", "franc"],
      correctAnswer: 1,
    },
    {
      question: "Which day is commonly recognized as Democracy Day in Nigeria?",
      options: ["June 12", "October 1", "May 1", "December 25"],
      correctAnswer: 0,
    },
    {
      question: "INEC is responsible for ____ in Nigeria.",
      options: [
        "conducting elections",
        "setting fuel prices",
        "building roads",
        "regulating universities",
      ],
      correctAnswer: 0,
    },
    {
      question: "Which security agency is primarily responsible for internal policing in Nigeria?",
      options: ["Nigerian Navy", "Nigerian Police Force", "NDLEA", "Civil Defence only"],
      correctAnswer: 1,
    },
    {
      question: "The National Assembly of Nigeria consists of the Senate and the ____.",
      options: ["House of Chiefs", "House of Elders", "House of Representatives", "Federal Council"],
      correctAnswer: 2,
    },
    {
      question: "Which sector is strongly associated with crude oil production in Nigeria?",
      options: ["telecommunications", "agriculture", "solid minerals", "petroleum"],
      correctAnswer: 3,
    },
    {
      question: "The official language of Nigeria is ____.",
      options: ["Hausa", "English", "Yoruba", "Igbo"],
      correctAnswer: 1,
    },
    {
      question: "NYSC stands for ____.",
      options: [
        "National Youth Service Corps",
        "Nigerian Youth Support Council",
        "National Young Scholars Commission",
        "New Youth Service Committee",
      ],
      correctAnswer: 0,
    },
  ],
};

export const mockQuestions: MockQuestion[] = (
  Object.entries(subjectQuestionSets) as [SubjectName, Omit<MockQuestion, "id" | "subject">[]][]
).flatMap(([subject, questions]) =>
  questions.map((question, index) => ({
    id: mockId(subject, index),
    subject,
    ...question,
  })),
);

const courseWeights: Array<{
  test: (course: string) => boolean;
  weights: Partial<Record<SubjectName, number>>;
}> = [
  {
    test: (course) => /engineer/i.test(course),
    weights: { Mathematics: 4, "English Language": 3, "Current Affairs": 2, "General Knowledge": 1 },
  },
  {
    test: (course) => /(medicine|medical|pharmacy|nursing|dentistry|health|bio)/i.test(course),
    weights: { "General Knowledge": 3, "Current Affairs": 3, "English Language": 2, Mathematics: 2 },
  },
  {
    test: (course) => /law/i.test(course),
    weights: { "English Language": 4, "General Knowledge": 3, "Current Affairs": 2, Mathematics: 1 },
  },
  {
    test: (course) => /(business|accounting|economics|management|admin|marketing|finance)/i.test(course),
    weights: { Mathematics: 3, "English Language": 3, "Current Affairs": 2, "General Knowledge": 2 },
  },
];

const allSubjects: SubjectName[] = ["English Language", "Mathematics", "General Knowledge", "Current Affairs"];

export function getSubjectWeightsForCourse(course: string): Record<SubjectName, number> {
  const matched = courseWeights.find((entry) => entry.test(course));
  return allSubjects.reduce((acc, subject) => {
    acc[subject] = matched?.weights[subject] ?? 1;
    return acc;
  }, {} as Record<SubjectName, number>);
}

export function selectTestQuestions(course: string, avoidIds: number[], count: number): MockQuestion[] {
  const weights = getSubjectWeightsForCourse(course);
  const available = mockQuestions.filter((question) => !avoidIds.includes(question.id));
  const bySubject = allSubjects.reduce((acc, subject) => {
    acc[subject] = shuffle(available.filter((question) => question.subject === subject));
    return acc;
  }, {} as Record<SubjectName, MockQuestion[]>);

  const weightedSubjects: SubjectName[] = allSubjects.flatMap((subject) =>
    Array(Math.max(1, weights[subject])).fill(subject),
  );
  const selected: MockQuestion[] = [];
  let pointer = 0;

  while (selected.length < count && weightedSubjects.length > 0) {
    const subject = weightedSubjects[pointer % weightedSubjects.length];
    pointer += 1;

    const bucket = bySubject[subject];
    if (bucket.length > 0) {
      selected.push(bucket.shift()!);
    }

    if (pointer >= weightedSubjects.length && selected.length < count) {
      const remaining = allSubjects.some((subjectName) => bySubject[subjectName].length > 0);
      if (!remaining) {
        break;
      }
    }
  }

  if (selected.length < count) {
    const fallback = shuffle(
      mockQuestions.filter((question) => !selected.some((selectedQuestion) => selectedQuestion.id === question.id)),
    ).slice(0, count - selected.length);
    selected.push(...fallback);
  }

  return shuffle(selected).slice(0, count);
}

function shuffle<T>(items: T[]) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function mockId(subject: SubjectName, index: number) {
  const prefix = {
    "English Language": 100,
    Mathematics: 200,
    "General Knowledge": 300,
    "Current Affairs": 400,
  }[subject];

  return prefix + index + 1;
}
