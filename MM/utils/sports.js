// utils/sports.js — Sport-specific terminology mapping

export const SPORT_TERMS = {
  soccer:     { miss: 'missed penalty', event: 'Soccer Game',      action: 'shot',     fieldPos: 'the pitch',    emoji: '⚽' },
  basketball: { miss: 'missed free throw', event: 'Basketball Game', action: 'shot',   fieldPos: 'the court',    emoji: '🏀' },
  football:   { miss: 'incomplete pass', event: 'Football Game',   action: 'threw',    fieldPos: 'the field',    emoji: '🏈' },
  baseball:   { miss: 'struck out',     event: 'Baseball Game',    action: 'swung',    fieldPos: 'the diamond',  emoji: '⚾' },
  volleyball: { miss: 'missed serve',   event: 'Volleyball Game',  action: 'served',   fieldPos: 'the court',    emoji: '🏐' },
  swimming:   { miss: 'missed split',   event: 'Swim Meet',        action: 'swam',     fieldPos: 'the pool',     emoji: '🏊' },
  track:      { miss: 'false start',    event: 'Track Meet',       action: 'ran',      fieldPos: 'the track',    emoji: '🏃' },
  tennis:     { miss: 'double fault',   event: 'Tennis Match',     action: 'served',   fieldPos: 'the court',    emoji: '🎾' },
  wrestling:  { miss: 'missed takedown',event: 'Wrestling Match',  action: 'wrestled', fieldPos: 'the mat',      emoji: '🤼' },
  gymnastics: { miss: 'stumbled on landing', event: 'Gymnastics Meet', action: 'performed', fieldPos: 'the floor', emoji: '🤸' },
  lacrosse:   { miss: 'missed shot',    event: 'Lacrosse Game',    action: 'shot',     fieldPos: 'the field',    emoji: '🥍' },
  other:      { miss: 'missed play',    event: 'Game',             action: 'played',   fieldPos: 'the field',    emoji: '🏅' }
};

export function getSportTerms(sportId) {
  return SPORT_TERMS[sportId] || SPORT_TERMS.other;
}
