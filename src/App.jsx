import React, { useEffect, useMemo, useState } from 'react'
import { LOCATIONS, MARITAL, SEED_PROFILES, EXAMPLE_QUERIES } from './data.js'
import { parseQuery, matchesSmart } from './smartSearch.js'
import { ADMIN_PASSWORD, ADMIN_WHATSAPP } from './config.js'

/* ---------- хранение в браузере (прототип без сервера) ---------- */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* приватный режим и т.п. */ }
  },
}

const AGE_MIN = 18
const AGE_MAX = 80
const EMPTY_FILTERS = { gender: 'all', country: 'all', city: 'all', ageFrom: AGE_MIN, ageTo: AGE_MAX, marital: 'all', children: 'all', relocation: 'all' }

const maritalLabel = (m, gender) => ({
  never: gender === 'female' ? 'Не была в браке' : 'Не был в браке',
  divorced: gender === 'female' ? 'Разведена' : 'Разведён',
  widowed: gender === 'female' ? 'Вдова' : 'Вдовец',
}[m])

const ageWord = (n) => {
  const d = n % 10, dd = n % 100
  if (d === 1 && dd !== 11) return 'год'
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'года'
  return 'лет'
}
const anketWord = (n) => {
  const d = n % 10, dd = n % 100
  if (d === 1 && dd !== 11) return 'анкета'
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'анкеты'
  return 'анкет'
}

/* ---------- иконки ---------- */
const Icon = {
  search: (c = 'w-5 h-5') => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  ),
  pin: (c = 'w-4 h-4') => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
  ),
  lock: (c = 'w-4 h-4') => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
  ),
  filter: (c = 'w-5 h-5') => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
  ),
  close: (c = 'w-5 h-5') => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M18 6 6 18" /></svg>
  ),
  check: (c = 'w-4 h-4') => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m5 12 5 5 9-10" /></svg>
  ),
  moon: (c = 'w-6 h-6') => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 3.2a8.8 8.8 0 1 0 6.3 13.6A7.3 7.3 0 0 1 14.5 3.2Z" /></svg>
  ),
}

/* ---------- мелкие UI-компоненты ---------- */
function Select({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-emerald-900/70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
      >
        {children}
      </select>
    </label>
  )
}

function AgeRange({ from, to, onChange }) {
  const pct = (v) => ((v - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-emerald-900/70">Возраст</span>
        <span className="text-sm font-semibold text-emerald-900">{from} — {to}</span>
      </div>
      <div className="dual-range relative mt-3 h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-sand-200" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-700" style={{ left: `${pct(from)}%`, right: `${100 - pct(to)}%` }} />
        <input type="range" aria-label="Возраст от" min={AGE_MIN} max={AGE_MAX} value={from} onChange={(e) => onChange(Math.min(+e.target.value, to - 1), to)} />
        <input type="range" aria-label="Возраст до" min={AGE_MIN} max={AGE_MAX} value={to} onChange={(e) => onChange(from, Math.max(+e.target.value, from + 1))} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-sand-600"><span>{AGE_MIN}</span><span>{AGE_MAX}</span></div>
    </div>
  )
}

function Modal({ open, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-emerald-900/50 hover:bg-sand-100" aria-label="Закрыть">{Icon.close()}</button>
        {children}
      </div>
    </div>
  )
}

/* ---------- Шапка ---------- */
function Header({ user, admin, view, setView, onLogin, onLogout, onCreate, onAdminLogout, newRequests }) {
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/70 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button onClick={() => setView('feed')} className="flex items-center gap-2 text-emerald-800">
          {Icon.moon('w-6 h-6 text-emerald-700')}
          <span className="text-xl font-semibold">Никах</span>
                  </button>
        <nav className="flex items-center gap-2">
          <button onClick={() => setView('feed')} className={`hidden rounded-full px-4 py-2 text-sm sm:block ${view === 'feed' ? 'bg-emerald-800/10 text-emerald-900' : 'text-emerald-900/70 hover:bg-sand-100'}`}>Анкеты</button>
          {admin && (
            <>
              <button onClick={onCreate} className="whitespace-nowrap rounded-full bg-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-900">
                <span className="sm:hidden">+ Анкета</span><span className="hidden sm:inline">Добавить анкету</span>
              </button>
              <button onClick={() => setView('requests')} className={`relative whitespace-nowrap rounded-full border px-3 py-2 text-sm ${view === 'requests' ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-sand-300 text-emerald-900 hover:bg-sand-100'}`}>
                Заявки
                {newRequests > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[11px] text-white">{newRequests}</span>}
              </button>
              <button onClick={onAdminLogout} className="whitespace-nowrap rounded-full bg-sand-200 px-3 py-2 text-xs font-medium text-sand-800 hover:bg-sand-300"><span className="hidden sm:inline">Админ · </span>выйти</button>
            </>
          )}
          {admin ? null : user ? (
            <button onClick={onLogout} title="Выйти" className="whitespace-nowrap rounded-full border border-sand-300 px-3 py-2 text-xs text-emerald-900/80 hover:bg-sand-100">
              <span className="hidden sm:inline">{user.login.length > 14 ? user.login.slice(0, 12) + '…' : user.login} · </span>Выйти
            </button>
          ) : (
            <button onClick={onLogin} className="rounded-full border border-sand-300 px-4 py-2 text-sm text-emerald-900 hover:bg-sand-100">Войти</button>
          )}
        </nav>
      </div>
    </header>
  )
}

/* ---------- Блок поиска ---------- */
function SearchHero({ query, setQuery, chips }) {
  return (
    <section className="border-b border-sand-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:pt-8">
        <h1 className="text-2xl font-semibold text-emerald-950 sm:text-3xl">Анкеты для никаха</h1>
        <p className="mt-1 text-sm text-emerald-900/70">Казахстан и Россия. Выберите город и возраст или просто напишите, кого ищете.</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-2 py-1 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15">
          <span className="pl-1 text-emerald-700">{Icon.search()}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: Алматы, без детей"
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-emerald-950 placeholder:text-emerald-900/40 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="rounded-lg p-2 text-emerald-900/40 hover:bg-sand-100" aria-label="Очистить">{Icon.close('w-4 h-4')}</button>
          )}
        </div>

        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-emerald-900/60">Ищем:</span>
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{c}</span>
            ))}
          </div>
        )}

        <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <span className="shrink-0 text-xs text-emerald-900/50">Примеры:</span>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${query === q ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-sand-200 bg-sand-50 text-emerald-900/80 hover:bg-sand-100'}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Фильтры ---------- */
function Filters({ filters, setFilters }) {
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v, ...(k === 'country' ? { city: 'all' } : {}) }))
  const cities = filters.country === 'all' ? Object.values(LOCATIONS).flat() : LOCATIONS[filters.country]
  return (
    <div className="space-y-4">
      <Select label="Кого ищу" value={filters.gender} onChange={set('gender')}>
        <option value="all">Все анкеты</option>
        <option value="female">Ищу жену</option>
        <option value="male">Ищу мужа</option>
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Страна" value={filters.country} onChange={set('country')}>
          <option value="all">Все</option>
          {Object.keys(LOCATIONS).map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select label="Город" value={filters.city} onChange={set('city')}>
          <option value="all">Все города</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>
      <AgeRange from={filters.ageFrom} to={filters.ageTo} onChange={(a, b) => setFilters((f) => ({ ...f, ageFrom: a, ageTo: b }))} />
      <Select label="Семейное положение" value={filters.marital} onChange={set('marital')}>
        <option value="all">Любое</option>
        {Object.entries(MARITAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Дети" value={filters.children} onChange={set('children')}>
          <option value="all">Не важно</option>
          <option value="no">Нет</option>
          <option value="yes">Есть</option>
        </Select>
        <Select label="Переезд" value={filters.relocation} onChange={set('relocation')}>
          <option value="all">Не важно</option>
          <option value="yes">Готов(а)</option>
          <option value="no">Не готов(а)</option>
        </Select>
      </div>
    </div>
  )
}

/* ---------- Карточка анкеты ---------- */
function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-sand-200 py-1.5 last:border-0">
      <dt className="text-emerald-900/60">{label}</dt>
      <dd className="text-right font-medium text-emerald-950">{children}</dd>
    </div>
  )
}

function ProfileCard({ p, state, onContact, admin, onEdit, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const female = p.gender === 'female'
  const displayName = p.showName && p.name ? p.name : 'Имя при знакомстве'
  return (
    <article className="animate-pop flex flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${female ? 'bg-sand-100 text-sand-800' : 'bg-emerald-50 text-emerald-800'}`}>
            {p.showName && p.name ? p.name[0] : female ? 'Д' : 'М'}
          </div>
          <div>
            <h3 className={`text-lg font-semibold leading-tight ${p.showName && p.name ? 'text-emerald-950' : 'text-emerald-900/60'}`}>{displayName}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-emerald-900/70">
              {p.age} {ageWord(p.age)} · {Icon.pin('w-3.5 h-3.5')} {p.city}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${female ? 'bg-sand-100 text-sand-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {female ? 'Девушка' : 'Мужчина'}
        </span>
      </div>

      {p.isNew && <span className="mt-3 w-fit rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-medium text-white">Новая анкета</span>}

      <dl className="mt-4 text-sm">
        <Row label="Национальность">{p.nationality || '—'}</Row>
        <Row label="Рост / вес">{p.height ? `${p.height} см` : '—'} / {p.weight ? `${p.weight} кг` : '—'}</Row>
        <Row label="Семейное положение">{maritalLabel(p.marital, p.gender)}</Row>
        <Row label="Дети">{p.children === 'yes' ? 'Есть' : 'Нет'}</Row>
        <Row label="Переезд">{p.relocation ? (female ? 'Готова' : 'Готов') : (female ? 'Не готова' : 'Не готов')}</Row>
        {p.profession && <Row label="Занятие">{p.profession}</Row>}
        {p.hijab && <Row label="Одежда">{p.hijab}</Row>}
      </dl>

      <div className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">О себе</p>
          <p className="mt-1 text-emerald-950/85">{p.about}</p>
        </div>
        <div className="rounded-2xl bg-sand-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">{female ? 'Требования к мужу' : 'Требования к жене'}</p>
          <p className="mt-1 text-emerald-950/85">{p.requirements}</p>
        </div>
      </div>

      <div className="mt-auto pt-5">
        {admin ? (
          <div className="space-y-2">
            <p className="rounded-xl bg-sand-50 px-3 py-2 text-center text-xs text-emerald-900/70">
              Контакт (видит только админ): {p.contact.type} {p.contact.value}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onEdit(p)} className="rounded-xl border border-emerald-700 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50">Изменить</button>
              {confirmDel ? (
                <button onClick={() => onDelete(p)} onBlur={() => setConfirmDel(false)} className="rounded-xl bg-red-700 py-2.5 text-sm font-medium text-white">Точно удалить?</button>
              ) : (
                <button onClick={() => setConfirmDel(true)} className="rounded-xl border border-red-200 py-2.5 text-sm text-red-700 hover:bg-red-50">Удалить</button>
              )}
            </div>
          </div>
        ) : state?.type === 'requested' ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sand-100 py-3 text-sm text-sand-800">
            {Icon.check()} Заявка у администратора
          </div>
        ) : (
          <button onClick={() => onContact(p)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 py-3 text-sm font-medium text-white hover:bg-emerald-900">
            {Icon.lock()} Познакомиться через админа
          </button>
        )}
        {!admin && <p className="mt-2 text-center text-[11px] text-emerald-900/50">Контакты не показываются — знакомство только через администратора</p>}
      </div>
    </article>
  )
}

/* ---------- Вход / регистрация ---------- */
function AuthModal({ open, onClose, onAuth, reason }) {
  const [mode, setMode] = useState('register')
  const [method, setMethod] = useState('phone')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(true)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const v = login.trim()
    if (method === 'phone' && v.replace(/\D/g, '').length < 10) return setError('Введите номер телефона полностью')
    if (method === 'email' && !/^\S+@\S+\.\S+$/.test(v)) return setError('Проверьте адрес почты')
    if (password.length < 4) return setError('Пароль — минимум 4 символа')
    if (mode === 'register' && !agree) return setError('Нужно согласиться с правилами')
    setError('')
    onAuth({ login: v, method })
    setLogin(''); setPassword('')
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="pr-8">
        <h2 className="text-2xl font-semibold text-emerald-950">{mode === 'register' ? 'Регистрация' : 'Вход'}</h2>
        <p className="mt-1 text-sm text-emerald-900/70">{reason || 'Нужен, чтобы отправлять заявки на знакомство.'}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 rounded-2xl bg-sand-100 p-1 text-sm">
        {[['register', 'Регистрация'], ['login', 'Вход']].map(([k, t]) => (
          <button key={k} onClick={() => setMode(k)} className={`rounded-xl py-2 ${mode === k ? 'bg-white font-medium text-emerald-900 shadow-sm' : 'text-emerald-900/60'}`}>{t}</button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="flex gap-2 text-xs">
          {[['phone', 'По телефону'], ['email', 'По Email']].map(([k, t]) => (
            <button type="button" key={k} onClick={() => { setMethod(k); setLogin('') }} className={`rounded-full border px-3 py-1.5 ${method === k ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-sand-200 text-emerald-900/60'}`}>{t}</button>
          ))}
        </div>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          type={method === 'phone' ? 'tel' : 'email'}
          inputMode={method === 'phone' ? 'tel' : 'email'}
          placeholder={method === 'phone' ? '+7 7__ ___ __ __' : 'name@mail.kz'}
          className="w-full rounded-xl border border-sand-200 px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Пароль"
          className="w-full rounded-xl border border-sand-200 px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
        />
        {mode === 'register' && (
          <label className="flex items-start gap-2 text-xs text-emerald-900/70">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-emerald-700" />
            Согласен(на) с правилами: не передаю чужие контакты третьим лицам.
          </label>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="w-full rounded-2xl bg-emerald-800 py-3 text-sm font-medium text-white hover:bg-emerald-900">
          {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
        </button>
        <p className="text-center text-[11px] text-emerald-900/50">Тестовая версия: SMS и письма не отправляются.</p>
      </form>
    </Modal>
  )
}

/* ---------- Заявка на знакомство (уходит админу) ---------- */
const profileLabel = (p) => `${p.showName && p.name ? p.name : 'Без имени'}, ${p.age} ${ageWord(p.age)}, ${p.city}`

function RequestModal({ profile, user, onClose, onSend }) {
  const [form, setForm] = useState({ name: '', phone: '', wali: '', message: '' })
  const [sent, setSent] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (profile) {
      setForm({ name: '', phone: user?.method === 'phone' ? user.login : '', wali: '', message: '' })
      setSent(null); setError('')
    }
  }, [profile, user])
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return setError('Как к вам обращаться?')
    if (form.phone.replace(/\D/g, '').length < 10) return setError('Укажите номер, по которому админ с вами свяжется')
    setError('')
    const req = {
      id: 'r' + Date.now(), profileId: profile.id, profileLabel: profileLabel(profile),
      fromName: form.name.trim(), fromPhone: form.phone.trim(), wali: form.wali.trim(), message: form.message.trim(),
      account: user?.login || '', status: 'new', createdAt: Date.now(),
    }
    onSend(req)
    setSent(req)
  }

  const waText = sent && encodeURIComponent(
    `Ассаляму алейкум! Заявка на знакомство с анкетой: ${sent.profileLabel} (№ ${sent.profileId}).\n` +
    `Меня зовут ${sent.fromName}, тел. ${sent.fromPhone}.` + (sent.wali ? `\nКонтакт вали/родителей: ${sent.wali}.` : '') +
    (sent.message ? `\n${sent.message}` : '')
  )

  return (
    <Modal open={!!profile} onClose={onClose}>
      {sent ? (
        <div className="pr-6">
          <h2 className="text-xl font-semibold text-emerald-950">Заявка отправлена администратору</h2>
          <p className="mt-2 text-sm text-emerald-900/75">Админ свяжется с вами по номеру {sent.fromPhone}, а затем с семьёй второй стороны. Напрямую контакты не передаются.</p>
          {ADMIN_WHATSAPP && (
            <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=${waText}`} target="_blank" rel="noreferrer" className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-800 py-3 text-sm font-medium text-white">
              Продублировать админу в WhatsApp
            </a>
          )}
          <button onClick={onClose} className="mt-3 w-full rounded-2xl border border-sand-300 py-3 text-sm text-emerald-900">Готово</button>
        </div>
      ) : profile && (
        <>
          <h2 className="pr-8 text-xl font-semibold text-emerald-950">Знакомство через администратора</h2>
          <p className="mt-1 text-sm text-emerald-900/70">Анкета: {profileLabel(profile)}. Администратор свяжется с вами и с семьёй второй стороны — без личной переписки.</p>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Ваше имя *" />
            <input className={inputCls} value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" placeholder="Ваш телефон для связи с админом *" />
            <input className={inputCls} value={form.wali} onChange={set('wali')} placeholder="Телефон вали / родителей (необязательно)" />
            <textarea className={inputCls + ' min-h-[80px]'} value={form.message} onChange={set('message')} placeholder="Коротко о себе для админа (необязательно)" />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button className="w-full rounded-2xl bg-emerald-800 py-3 text-sm font-medium text-white hover:bg-emerald-900">Отправить админу</button>
          </form>
        </>
      )}
    </Modal>
  )
}

/* ---------- Заявки (для админа) ---------- */
const STATUS = { new: 'Новая', work: 'В работе', done: 'Закрыта' }

function RequestsView({ requests, profiles, onStatus, onDelete, onBack }) {
  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]))
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={onBack} className="text-sm text-emerald-800 hover:underline">← К анкетам</button>
      <h1 className="mt-3 text-2xl font-semibold text-emerald-950">Заявки на знакомство</h1>
      <p className="mt-1 text-sm text-emerald-900/70">Свяжитесь с отправителем, затем с семьёй второй стороны. Стороны контактов друг друга не видят.</p>
      {requests.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-emerald-900/60">Заявок пока нет</div>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((r) => {
            const p = byId[r.profileId]
            return (
              <div key={r.id} className="rounded-2xl border border-sand-200 bg-white p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-emerald-900/50">{new Date(r.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <select value={r.status} onChange={(e) => onStatus(r.id, e.target.value)} className={`rounded-full border px-3 py-1 text-xs ${r.status === 'new' ? 'border-red-200 bg-red-50 text-red-700' : r.status === 'work' ? 'border-sand-300 bg-sand-100 text-sand-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-sand-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">Кто пишет</p>
                    <p className="mt-1 font-medium">{r.fromName}</p>
                    <p>{r.fromPhone}</p>
                    {r.wali && <p className="text-emerald-900/70">Вали / родители: {r.wali}</p>}
                    {r.message && <p className="mt-1 text-emerald-900/80">{r.message}</p>}
                  </div>
                  <div className="rounded-xl bg-emerald-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800/70">Анкета</p>
                    <p className="mt-1 font-medium">{r.profileLabel}</p>
                    {p ? <p>{p.contact.type}: {p.contact.value}</p> : <p className="text-red-700">Анкета удалена</p>}
                  </div>
                </div>
                <button onClick={() => onDelete(r.id)} className="mt-3 text-xs text-red-700 hover:underline">Удалить заявку</button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ---------- Вход администратора ---------- */
function AdminModal({ open, onClose, onOk }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (pass === ADMIN_PASSWORD) { setPass(''); setError(''); onOk() } else setError('Неверный пароль')
  }
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="pr-8 text-xl font-semibold text-emerald-950">Вход для администратора</h2>
      <p className="mt-1 text-sm text-emerald-900/70">Админ может добавлять, менять и удалять анкеты.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input type="password" autoFocus value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Пароль"
          className="w-full rounded-xl border border-sand-200 px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15" />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="w-full rounded-2xl bg-emerald-800 py-3 text-sm font-medium text-white hover:bg-emerald-900">Войти</button>
      </form>
    </Modal>
  )
}

/* ---------- Форма анкеты (только админ) ---------- */
const EMPTY_FORM = {
  gender: 'male', name: '', showName: true, age: '', country: 'Казахстан', city: 'Алматы', nationality: '',
  height: '', weight: '', marital: 'never', children: 'no', relocation: false, profession: '', hijab: '',
  about: '', requirements: '', contactType: 'WhatsApp', contactValue: '',
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-emerald-900/70">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-emerald-900/50">{hint}</span>}
    </label>
  )
}
const inputCls = 'w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-base sm:text-sm text-emerald-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15'

const toForm = (p) => ({
  gender: p.gender, name: p.name || '', showName: !!p.showName, age: String(p.age), country: p.country, city: p.city,
  nationality: p.nationality || '', height: p.height ? String(p.height) : '', weight: p.weight ? String(p.weight) : '',
  marital: p.marital, children: p.children, relocation: !!p.relocation, profession: p.profession || '', hijab: p.hijab || '',
  about: p.about, requirements: p.requirements, contactType: p.contact.type, contactValue: p.contact.value,
})

function ProfileForm({ initial, onSubmit, onCancel }) {
  const [f, setF] = useState(() => (initial ? toForm(initial) : EMPTY_FORM))
  const [error, setError] = useState('')
  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setF((s) => ({ ...s, [k]: v, ...(k === 'country' ? { city: LOCATIONS[v][0] } : {}) }))
  }

  const submit = (e) => {
    e.preventDefault()
    const age = +f.age
    if (!age || age < 18 || age > 80) return setError('Укажите возраст (от 18 лет)')
    if (f.about.trim().length < 20) return setError('Напишите о себе хотя бы пару предложений')
    if (f.requirements.trim().length < 10) return setError('Опишите требования к супругу(е)')
    if (f.contactValue.trim().length < 4) return setError('Укажите контакт в WhatsApp или Telegram')
    setError('')
    onSubmit({
      id: initial?.id || 'u' + Date.now(), gender: f.gender, name: f.name.trim(), showName: f.showName && !!f.name.trim(), age,
      country: f.country, city: f.city, nationality: f.nationality.trim(),
      height: +f.height || null, weight: +f.weight || null, marital: f.marital, children: f.children,
      relocation: f.relocation, profession: f.profession.trim(), hijab: f.gender === 'female' ? f.hijab : '',
      about: f.about.trim(), requirements: f.requirements.trim(),
      contact: { type: f.contactType, value: f.contactValue.trim() },
      createdAt: initial?.createdAt || Date.now(), isNew: initial ? initial.isNew : true,
    })
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={onCancel} className="text-sm text-emerald-800 hover:underline">← К анкетам</button>
      <h1 className="mt-3 text-2xl font-semibold text-emerald-950">{initial ? 'Изменить анкету' : 'Новая анкета'}</h1>
      <p className="mt-1 text-sm text-emerald-900/70">{initial ? 'Изменения сразу появятся в ленте.' : 'После сохранения анкета сразу появится в ленте.'}</p>

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border border-sand-200 bg-white p-5 sm:p-7">
        <div className="grid grid-cols-2 rounded-2xl bg-sand-100 p-1 text-sm">
          {[['male', 'Мужчина'], ['female', 'Девушка']].map(([k, t]) => (
            <button type="button" key={k} onClick={() => set('gender')(k)} className={`rounded-xl py-2.5 ${f.gender === k ? 'bg-white font-medium text-emerald-900 shadow-sm' : 'text-emerald-900/60'}`}>{t}</button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя (необязательно)">
            <input className={inputCls} value={f.name} onChange={set('name')} placeholder="Например, Аружан" />
          </Field>
          <Field label="Возраст *">
            <input className={inputCls} type="number" inputMode="numeric" min="18" max="80" value={f.age} onChange={set('age')} placeholder="25" />
          </Field>
        </div>
        <label className="-mt-3 flex items-center gap-2 text-sm text-emerald-900/80">
          <input type="checkbox" checked={f.showName} onChange={set('showName')} className="accent-emerald-700" />
          Показывать имя в анкете (иначе — «Имя при знакомстве»)
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Страна">
            <select className={inputCls} value={f.country} onChange={set('country')}>{Object.keys(LOCATIONS).map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Город *">
            <select className={inputCls} value={f.city} onChange={set('city')}>{LOCATIONS[f.country].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Национальность">
            <input className={inputCls} value={f.nationality} onChange={set('nationality')} placeholder="Казах(шка)" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Рост, см"><input className={inputCls} type="number" inputMode="numeric" value={f.height} onChange={set('height')} placeholder="170" /></Field>
          <Field label="Вес, кг"><input className={inputCls} type="number" inputMode="numeric" value={f.weight} onChange={set('weight')} placeholder="65" /></Field>
          <Field label="Семейное положение">
            <select className={inputCls} value={f.marital} onChange={set('marital')}>{Object.entries(MARITAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          <Field label="Дети">
            <select className={inputCls} value={f.children} onChange={set('children')}><option value="no">Нет</option><option value="yes">Есть</option></select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Работа / учёба"><input className={inputCls} value={f.profession} onChange={set('profession')} placeholder="Например, медсестра" /></Field>
          {f.gender === 'female' ? (
            <Field label="Одежда">
              <select className={inputCls} value={f.hijab} onChange={set('hijab')}>
                <option value="">Не указывать</option>
                <option>Носит хиджаб (покрытая)</option>
                <option>Носит платок</option>
                <option>Планирую покрыться</option>
              </select>
            </Field>
          ) : <div className="hidden sm:block" />}
        </div>

        <label className="flex items-center gap-2 text-sm text-emerald-900/80">
          <input type="checkbox" checked={f.relocation} onChange={set('relocation')} className="accent-emerald-700" />
          Готов(а) к переезду в другой город
        </label>

        <Field label="О себе *" hint="Пара предложений: работа, намаз, характер.">
          <textarea className={inputCls + ' min-h-[96px]'} value={f.about} onChange={set('about')} />
        </Field>
        <Field label={f.gender === 'male' ? 'Требования к жене *' : 'Требования к мужу *'}>
          <textarea className={inputCls + ' min-h-[80px]'} value={f.requirements} onChange={set('requirements')} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <Field label="Контакт (для админа)">
            <select className={inputCls} value={f.contactType} onChange={set('contactType')}><option>WhatsApp</option><option>Telegram</option></select>
          </Field>
          <Field label={f.contactType === 'WhatsApp' ? 'Номер WhatsApp *' : 'Ник в Telegram *'}>
            <input className={inputCls} value={f.contactValue} onChange={set('contactValue')} placeholder={f.contactType === 'WhatsApp' ? '+7 7__ ___ __ __' : '@username'} />
          </Field>
        </div>

        <p className="-mt-3 text-xs text-emerald-900/60">Контакт видит только администратор. Посетители сайта его не увидят.</p>

        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-2xl border border-sand-300 px-6 py-3 text-sm text-emerald-900">Отмена</button>
          <button className="rounded-2xl bg-emerald-800 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-900">{initial ? 'Сохранить' : 'Опубликовать'}</button>
        </div>
      </form>
    </section>
  )
}

/* ---------- Приложение ---------- */
export default function App() {
  const [profiles, setProfiles] = useState(() => store.get('nikah.all', SEED_PROFILES))
  const [admin, setAdmin] = useState(() => store.get('nikah.admin', false))
  const [adminModal, setAdminModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [user, setUser] = useState(() => store.get('nikah.user', null))
  const [contactState, setContactState] = useState(() => store.get('nikah.sentRequests', {}))
  const [requests, setRequests] = useState(() => store.get('nikah.requests', []))
  const [requestFor, setRequestFor] = useState(null)
  const [view, setView] = useState('feed')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [auth, setAuth] = useState({ open: false, reason: '', next: null })
  const [mobileFilters, setMobileFilters] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => store.set('nikah.all', profiles), [profiles])
  useEffect(() => store.set('nikah.admin', admin), [admin])
  useEffect(() => store.set('nikah.user', user), [user])
  useEffect(() => store.set('nikah.sentRequests', contactState), [contactState])
  useEffect(() => store.set('nikah.requests', requests), [requests])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3200); return () => clearTimeout(t) }, [toast])

  const all = useMemo(() => [...profiles].sort((a, b) => b.createdAt - a.createdAt), [profiles])
  const { f: smart, chips } = useMemo(() => parseQuery(query), [query])

  const results = useMemo(() => all.filter((p) => {
    if (filters.gender !== 'all' && p.gender !== filters.gender) return false
    if (filters.country !== 'all' && p.country !== filters.country) return false
    if (filters.city !== 'all' && p.city !== filters.city) return false
    if (p.age < filters.ageFrom || p.age > filters.ageTo) return false
    if (filters.marital !== 'all' && p.marital !== filters.marital) return false
    if (filters.children !== 'all' && p.children !== filters.children) return false
    if (filters.relocation !== 'all' && p.relocation !== (filters.relocation === 'yes')) return false
    return matchesSmart(p, smart)
  }), [all, filters, smart])

  const activeCount = Object.keys(EMPTY_FILTERS).filter((k) => filters[k] !== EMPTY_FILTERS[k]).length + (query ? 1 : 0)
  const reset = () => { setFilters(EMPTY_FILTERS); setQuery('') }

  const requireAuth = (reason, next) => (user ? next() : setAuth({ open: true, reason, next }))

  const handleContact = (p) => requireAuth('Войдите, чтобы отправить заявку на знакомство.', () => setRequestFor(p))

  const sendRequest = (r) => {
    setRequests((s) => [r, ...s])
    setContactState((s) => ({ ...s, [r.profileId]: 'requested' }))
  }

  const openForm = (p) => { if (!admin) return; setEditing(p); setView('create'); window.scrollTo(0, 0) }

  const onAuth = (u) => {
    setUser(u)
    const next = auth.next
    setAuth({ open: false, reason: '', next: null })
    setToast('Вы вошли')
    if (next) setTimeout(next, 0)
  }

  const saveProfile = (p) => {
    if (!admin) return
    const exists = profiles.some((x) => x.id === p.id)
    setProfiles((s) => (exists ? s.map((x) => (x.id === p.id ? p : x)) : [p, ...s]))
    if (!exists) { setFilters(EMPTY_FILTERS); setQuery('') }
    setEditing(null); setView('feed'); window.scrollTo(0, 0)
    setToast(exists ? 'Анкета сохранена' : 'Анкета добавлена')
  }

  const deleteProfile = (p) => {
    if (!admin) return
    setProfiles((s) => s.filter((x) => x.id !== p.id))
    setToast('Анкета удалена')
  }

  const stateFor = (p) => {
    const s = contactState[p.id]
    return s ? { type: s } : null
  }

  const filtersBlock = (
    <>
      <Filters filters={filters} setFilters={setFilters} />
      <button onClick={reset} disabled={!activeCount} className="mt-5 w-full rounded-xl border border-sand-300 py-2.5 text-sm text-emerald-900 hover:bg-sand-100 disabled:opacity-40">
        Сбросить фильтры
      </button>
    </>
  )

  return (
    <div className="min-h-screen font-sans text-emerald-950">
      <Header
        user={user} admin={admin} view={view} setView={setView}
        onAdminLogout={() => { setAdmin(false); setView('feed'); setToast('Вы вышли из режима админа') }}
        onLogin={() => setAuth({ open: true, reason: '', next: null })}
        onLogout={() => { setUser(null); setToast('Вы вышли из аккаунта') }}
        onCreate={() => openForm(null)}
        newRequests={requests.filter((r) => r.status === 'new').length}
      />

      {view === 'requests' && admin ? (
        <RequestsView
          requests={requests} profiles={profiles} onBack={() => setView('feed')}
          onStatus={(id, status) => setRequests((s) => s.map((r) => (r.id === id ? { ...r, status } : r)))}
          onDelete={(id) => setRequests((s) => s.filter((r) => r.id !== id))}
        />
      ) : view === 'create' && admin ? (
        <ProfileForm key={editing?.id || 'new'} initial={editing} onSubmit={saveProfile} onCancel={() => { setEditing(null); setView('feed') }} />
      ) : (
        <>
          <SearchHero query={query} setQuery={setQuery} chips={chips} />

          <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-20 rounded-2xl border border-sand-200 bg-white p-5">
                <h2 className="mb-4 text-xl font-semibold">Фильтры</h2>
                {filtersBlock}
              </div>
            </aside>

            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-emerald-900/80">
                  Найдено: <span className="text-lg font-semibold text-emerald-900">{results.length}</span> {anketWord(results.length)}
                </p>
                <div className="flex gap-2">
                  {activeCount > 0 && (
                    <button onClick={reset} className="hidden rounded-full px-3 py-2 text-sm text-emerald-800 hover:bg-sand-100 sm:block lg:hidden">Сбросить</button>
                  )}
                  <button onClick={() => setMobileFilters(true)} className="flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm lg:hidden">
                    {Icon.filter('w-4 h-4')} Фильтры
                    {activeCount > 0 && <span className="rounded-full bg-emerald-800 px-1.5 text-[11px] text-white">{activeCount}</span>}
                  </button>
                </div>
              </div>

              {results.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {results.map((p) => <ProfileCard key={p.id} p={p} state={stateFor(p)} onContact={handleContact} admin={admin} onEdit={openForm} onDelete={deleteProfile} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-10 text-center">
                  <p className="text-lg font-medium text-emerald-900">Ничего не нашлось</p>
                  <p className="mt-2 text-sm text-emerald-900/60">Попробуйте другой город или возраст.</p>
                  <button onClick={reset} className="mt-5 rounded-full bg-emerald-800 px-5 py-2.5 text-sm text-white">Сбросить фильтры</button>
                </div>
              )}

              <div className="mt-8 rounded-2xl bg-sand-100 p-4 text-sm text-sand-800">
                <p>Все знакомства проходят только через администратора: контакты анкет не показываются, личной переписки между мужчинами и женщинами на сайте нет. Админ связывается с обеими сторонами и их семьями.</p>
              </div>
            </div>
          </main>
        </>
      )}

      {/* Фильтры на телефоне — нижняя шторка */}
      <Modal open={mobileFilters} onClose={() => setMobileFilters(false)}>
        <h2 className="mb-4 text-2xl font-semibold">Фильтры</h2>
        {filtersBlock}
        <button onClick={() => setMobileFilters(false)} className="mt-3 w-full rounded-2xl bg-emerald-800 py-3 text-sm font-medium text-white">
          Показать {results.length} {anketWord(results.length)}
        </button>
      </Modal>

      <AuthModal open={auth.open} reason={auth.reason} onClose={() => setAuth({ open: false, reason: '', next: null })} onAuth={onAuth} />

      {toast && (
        <div className="animate-pop fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-emerald-950 px-4 py-3 text-center text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <RequestModal profile={requestFor} user={user} onClose={() => setRequestFor(null)} onSend={sendRequest} />

      <AdminModal open={adminModal} onClose={() => setAdminModal(false)} onOk={() => { setAdmin(true); setAdminModal(false); setToast('Вы вошли как администратор') }} />

      <footer className="border-t border-sand-200 py-6 text-center text-xs text-emerald-900/50">
        Тестовая версия · анкеты примерные
        {!admin && <> · <button onClick={() => setAdminModal(true)} className="underline hover:text-emerald-800">Вход для администратора</button></>}
      </footer>
    </div>
  )
}
