/**
 * Κοινές σταθερές & helpers για τα components της σχολής.
 */
export const LEVEL_LABEL = { beginner: 'Αρχάριος', intermediate: 'Μεσαίο', advanced: 'Προχωρημένο' }
export const SPORT_ICON = { ski: '⛷️', snowboard: '🏂' }

export const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Αρχάριος' },
  { value: 'intermediate', label: 'Μεσαίο' },
  { value: 'advanced', label: 'Προχωρημένο' },
]
export const SPORT_OPTIONS = [
  { value: 'ski', label: '⛷️ Σκι' },
  { value: 'snowboard', label: '🏂 Snowboard' },
]
export const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map(d => ({ value: d, label: `${d} ώρα${d > 1 ? 'ες' : ''}` }))
export const PERSONS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ value: n, label: `${n} άτομο${n > 1 ? 'α' : ''}` }))

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase()

export const getValidStartTimes = (dur) => {
  const maxStart = 16 - parseInt(dur)
  const times = []
  for (let h = 9; h <= maxStart; h++) times.push(`${h.toString().padStart(2, '0')}:00`)
  return times
}

export const calculatePrice = (persons, hours) => {
  const table = { 1: 50, 2: 60, 3: 75, 4: 80 }
  return (table[persons] ?? persons * 20) * hours
}
