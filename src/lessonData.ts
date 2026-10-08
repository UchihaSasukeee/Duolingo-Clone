export type Challenge = 
  | {
      id: number | string;
      type: "multiple_choice";
      question: string;
      options: { id: string; text: string }[];
      answer: string;
    }
  | {
      id: number | string;
      type: "matching";
      question: string;
      pairs: { id: string; text: string; matchText: string }[];
    }
  | {
      id: number | string;
      type: "typing";
      question: string;
      answer: string; // The correct typed answer
    };

export const initialChallenges: Challenge[] = [
  {
    id: 1,
    type: "multiple_choice",
    question: 'Which of these is "the apple"?',
    options: [
      { id: "a", text: "la manzana" },
      { id: "b", text: "el niño" },
      { id: "c", text: "la niña" }
    ],
    answer: "a"
  },
  {
    id: 2,
    type: "typing",
    question: 'Type the translation for: "The boy"',
    answer: "el niño"
  },
  {
    id: 3,
    type: "matching",
    question: "Tap the matching pairs",
    pairs: [
      { id: "1", text: "el niño", matchText: "the boy" },
      { id: "2", text: "la niña", matchText: "the girl" },
      { id: "3", text: "la manzana", matchText: "the apple" },
      { id: "4", text: "la mujer", matchText: "the woman" },
      { id: "5", text: "el hombre", matchText: "the man" },
      { id: "6", text: "el agua", matchText: "the water" },
    ]
  },
  {
    id: 4,
    type: "multiple_choice",
    question: 'Translate: "The boy"',
    options: [
      { id: "a", text: "la mujer" },
      { id: "b", text: "el hombre" },
      { id: "c", text: "el niño" }
    ],
    answer: "c"
  },
  {
    id: 5,
    type: "typing",
    question: 'Type the translation for: "Hello"',
    answer: "hola"
  },
  {
    id: 6,
    type: "multiple_choice",
    question: 'Translate: "I am a man"',
    options: [
      { id: "a", text: "Yo soy un hombre" },
      { id: "b", text: "Yo soy una mujer" },
      { id: "c", text: "El es un niño" }
    ],
    answer: "a"
  },
  {
    id: 7,
    type: "matching",
    question: "Tap the matching pairs",
    pairs: [
      { id: "1", text: "hola", matchText: "hello" },
      { id: "2", text: "adiós", matchText: "goodbye" },
      { id: "3", text: "gracias", matchText: "thank you" },
      { id: "4", text: "por favor", matchText: "please" },
      { id: "5", text: "sí", matchText: "yes" },
      { id: "6", text: "no", matchText: "no" },
    ]
  },
  {
    id: 8,
    type: "multiple_choice",
    question: 'Translate: "The girl drinks water"',
    options: [
      { id: "a", text: "El niño bebe agua" },
      { id: "b", text: "La niña bebe agua" },
      { id: "c", text: "La mujer come pan" }
    ],
    answer: "b"
  }
];
