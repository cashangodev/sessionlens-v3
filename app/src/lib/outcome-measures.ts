// Standardized outcome measures for clinical assessment
// PHQ-9 and GAD-7 questionnaires with scoring logic

export interface OutcomeMeasureScore {
  measureId: string;
  measureName: string;
  totalScore: number;
  severity: string;
  severityColor: string;
  responses: number[];
  completedAt: string;
}

export interface OutcomeMeasureQuestion {
  id: number;
  text: string;
  scale: { value: number; label: string }[];
}

// PHQ-9: Patient Health Questionnaire (Depression)
export const PHQ9_QUESTIONS: OutcomeMeasureQuestion[] = [
  {
    id: 1,
    text: 'Little interest or pleasure in doing things',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 2,
    text: 'Feeling down, depressed, or hopeless',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 3,
    text: 'Trouble falling or staying asleep, or sleeping too much',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 4,
    text: 'Feeling tired or having little energy',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 5,
    text: 'Poor appetite or overeating',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 6,
    text: 'Feeling bad about yourself, or that you are a failure or have let your family down',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 7,
    text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 8,
    text: 'Moving or speaking so slowly that other people could have noticed, or the opposite; being so fidgety or restless that you have been moving around a lot more than usual',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 9,
    text: 'Thoughts that you would be better off dead or of hurting yourself in some way',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
];

// GAD-7: Generalized Anxiety Disorder 7
export const GAD7_QUESTIONS: OutcomeMeasureQuestion[] = [
  {
    id: 1,
    text: 'Feeling nervous, anxious, or on edge',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 2,
    text: 'Not being able to stop or control worrying',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 3,
    text: 'Worrying too much about different things',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 4,
    text: 'Trouble relaxing',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 5,
    text: 'Being so restless that it is hard to sit still',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 6,
    text: 'Becoming easily annoyed or irritable',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
  {
    id: 7,
    text: 'Feeling afraid as if something awful might happen',
    scale: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
  },
];

// Scoring functions
export function calculatePHQ9Score(responses: number[]): {
  score: number;
  severity: string;
  color: string;
} {
  const score = responses.reduce((sum, val) => sum + (val || 0), 0);
  let severity = '';
  let color = '';

  if (score <= 4) {
    severity = 'Minimal';
    color = 'bg-green-100 text-green-800 border-green-300';
  } else if (score <= 9) {
    severity = 'Mild';
    color = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (score <= 14) {
    severity = 'Moderate';
    color = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  } else if (score <= 19) {
    severity = 'Moderately Severe';
    color = 'bg-orange-100 text-orange-800 border-orange-300';
  } else {
    severity = 'Severe';
    color = 'bg-red-100 text-red-800 border-red-300';
  }

  return { score, severity, color };
}

export function calculateGAD7Score(responses: number[]): {
  score: number;
  severity: string;
  color: string;
} {
  const score = responses.reduce((sum, val) => sum + (val || 0), 0);
  let severity = '';
  let color = '';

  if (score <= 4) {
    severity = 'Minimal';
    color = 'bg-green-100 text-green-800 border-green-300';
  } else if (score <= 9) {
    severity = 'Mild';
    color = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (score <= 14) {
    severity = 'Moderate';
    color = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  } else {
    severity = 'Severe';
    color = 'bg-red-100 text-red-800 border-red-300';
  }

  return { score, severity, color };
}

// Get max score for a measure
export function getMaxScore(measureId: string): number {
  if (measureId === 'phq9') return 27;
  if (measureId === 'gad7') return 21;
  return 0;
}
