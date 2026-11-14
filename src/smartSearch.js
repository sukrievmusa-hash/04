// «Умный» поиск: разбирает фразу на понятные условия (город, пол, возраст, дети...)
// и оставшиеся слова ищет по тексту анкеты. Работает без сервера и без AI.
import { LOCATIONS } from './data.js'

const norm = (s) => s.toLowerCase().replace(/ё/g, 'е')

// Основа города для поиска в любом падеже: «Алматы», «Астаны», «Шымкента», «Москвы»...
const CITY_STEMS = Object.entries(LOCATIONS).flatMap(([country, cities]) =>
  cities.map((city) => {
    const n = norm(city)
    const stem = n.length > 5 ? n.replace(/[аыеиуь]$/, '') : n
    return { city, country, stem }
  })
)

const RULES = [
  { re: /(девушк|женщин|сестр|невест|ищу жену)/, apply: (f) => (f.gender = 'female'), label: 'Девушки' },
  { re: /(мужчин|парн|(^|\s)брат|жених|ищу мужа)/, apply: (f) => (f.gender = 'male'), label: 'Мужчины' },
  { re: /без (детей|ребенка)|нет детей/, apply: (f) => (f.children = 'no'), label: 'Без детей' },
  { re: /(с (детьми|ребенком)|есть дет|есть ребен)/, apply: (f) => (f.children = 'yes'), label: 'Есть дети' },
  { re: /(развод|разведен)/, apply: (f) => (f.marital = 'divorced'), label: 'В разводе' },
  { re: /(не был[аи]? в браке|не замужем|не женат)/, apply: (f) => (f.marital = 'never'), label: 'Не был(а) в браке' },
  { re: /(вдов)/, apply: (f) => (f.marital = 'widowed'), label: 'Вдовец / вдова' },
  { re: /(переезд|переехать)/, apply: (f) => (f.relocation = 'yes'), label: 'Готовы к переезду' },
  { re: /(покрыт|хиджаб|платок)/, apply: (f) => (f.hijab = true), label: 'Покрытые' },
  { re: /(росси|(^|\s)рф(\s|$))/, apply: (f) => (f.country = 'Россия'), label: 'Россия' },
  { re: /казахстан/, apply: (f) => (f.country = 'Казахстан'), label: 'Казахстан' },
]

// Служебные слова, которые не нужно искать в тексте
const STOP = new Set(['из', 'в', 'до', 'от', 'лет', 'года', 'год', 'и', 'с', 'со', 'на', 'для', 'к', 'по', 'ищу', 'готовы', 'готова', 'готов', 'все'])

export function parseQuery(raw) {
  const q = norm(raw || '')
  const f = {}
  const chips = []
  let rest = q

  for (const r of RULES) {
    const m = rest.match(r.re)
    if (m) {
      r.apply(f)
      chips.push(r.label)
      rest = rest.replace(m[0], ' ')
    }
  }

  const upTo = rest.match(/до\s*(\d{2})/)
  if (upTo) { f.ageMax = +upTo[1]; chips.push(`до ${upTo[1]} лет`); rest = rest.replace(upTo[0], ' ') }
  const from = rest.match(/(от|старше)\s*(\d{2})/)
  if (from) { f.ageMin = +from[2]; chips.push(`от ${from[2]} лет`); rest = rest.replace(from[0], ' ') }
  const range = rest.match(/(\d{2})\s*[-–]\s*(\d{2})/)
  if (range) { f.ageMin = +range[1]; f.ageMax = +range[2]; chips.push(`${range[1]}–${range[2]} лет`); rest = rest.replace(range[0], ' ') }

  for (const c of CITY_STEMS) {
    const re = new RegExp(`(^|[^а-яa-z])${c.stem}[а-я]*`)
    const m = rest.match(re)
    if (m) {
      f.city = c.city; f.country = c.country
      chips.push(c.city)
      rest = rest.replace(m[0], ' ')
      break
    }
  }

  // Оставшиеся слова — по основе (первые 5 букв), чтобы «врач» нашёл «врач-терапевт», а «программиста» — «программист»
  const words = rest.split(/[\s,.;!?]+/).filter((w) => w.length > 2 && !STOP.has(w))
  f.words = words.map((w) => (w.length > 6 ? w.slice(0, 5) : w.length > 4 ? w.slice(0, w.length - 1) : w))
  words.forEach((w) => chips.push(`«${w}»`))

  return { f, chips }
}

export function matchesSmart(p, f) {
  if (f.gender && p.gender !== f.gender) return false
  if (f.country && p.country !== f.country) return false
  if (f.city && p.city !== f.city) return false
  if (f.children && p.children !== f.children) return false
  if (f.marital && p.marital !== f.marital) return false
  if (f.relocation === 'yes' && !p.relocation) return false
  if (f.hijab && !/хиджаб|платок|покрыт/i.test(p.hijab || '')) return false
  if (f.ageMin && p.age < f.ageMin) return false
  if (f.ageMax && p.age > f.ageMax) return false
  if (f.words?.length) {
    const text = norm([p.name, p.city, p.nationality, p.profession, p.about, p.requirements, p.hijab].join(' '))
    if (!f.words.every((w) => text.includes(w))) return false
  }
  return true
}
