export type SuggestionId = 'risks' | 'germany' | 'apacEurope' | 'forecastMiss';

/**
 * Demo questions, one per scripted answer. The button label is translated
 * (`assistant.suggestions.<id>`), but the question sent is always English:
 * the mock assistant matches English keywords only (owner decision, 2026-11-03).
 */
export const SUGGESTED_QUESTIONS: readonly {
  id: SuggestionId;
  fixtureId: string;
  question: string;
}[] = [
  { id: 'risks', fixtureId: 'at-risk', question: 'Which markets are at risk this quarter?' },
  { id: 'germany', fixtureId: 'germany-dip', question: 'Why did Germany dip in March?' },
  { id: 'apacEurope', fixtureId: 'apac-vs-europe', question: 'Compare APAC and Europe.' },
  {
    id: 'forecastMiss',
    fixtureId: 'forecast-miss',
    question: "What's driving the portfolio's forecast miss?",
  },
];
