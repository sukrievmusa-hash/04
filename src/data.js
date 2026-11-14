// Справочники и тестовые анкеты. Контакты — демонстрационные, не настоящие.

export const LOCATIONS = {
  'Казахстан': ['Алматы', 'Астана', 'Шымкент', 'Тараз', 'Актобе', 'Караганда', 'Туркестан'],
  'Россия': ['Москва', 'Махачкала', 'Дербент', 'Казань', 'Грозный', 'Санкт-Петербург'],
}

export const MARITAL = {
  never: 'Не был(а) в браке',
  divorced: 'В разводе',
  widowed: 'Вдовец / вдова',
}

export const SEED_PROFILES = [
  {
    id: 'p1', gender: 'female', name: '', showName: false, age: 23,
    country: 'Казахстан', city: 'Алматы', nationality: 'Казашка',
    height: 165, weight: 54, marital: 'never', children: 'no', relocation: true,
    profession: 'Учитель начальных классов', hijab: 'Носит хиджаб (покрытая)',
    about: 'Совершаю намаз, учу таджвид. Люблю порядок в доме, готовить и читать. Родители знают о моём намерении, знакомство через махрама.',
    requirements: 'Практикующий брат 25–32 лет, совершающий намаз, с работой и стремлением к знаниям. Без вредных привычек.',
    contact: { type: 'WhatsApp', value: '+7 700 000 00 01' }, hideContact: true, createdAt: 1,
  },
  {
    id: 'p2', gender: 'male', name: 'Алихан', showName: true, age: 29,
    country: 'Казахстан', city: 'Астана', nationality: 'Казах',
    height: 180, weight: 78, marital: 'never', children: 'no', relocation: false,
    profession: 'Врач-терапевт', hijab: '',
    about: 'Работаю в городской поликлинике, есть своё жильё. Совершаю пятикратный намаз, хожу на уроки по акыде. Спокойный, люблю природу и походы.',
    requirements: 'Покрытая сестра до 27 лет, не была в браке, готова переехать в Астану. Важны скромность и благой нрав.',
    contact: { type: 'Telegram', value: '@demo_alihan' }, hideContact: false, createdAt: 2,
  },
  {
    id: 'p3', gender: 'female', name: 'Мадина', showName: true, age: 27,
    country: 'Казахстан', city: 'Шымкент', nationality: 'Узбечка',
    height: 160, weight: 57, marital: 'divorced', children: 'yes', relocation: true,
    profession: 'Бухгалтер', hijab: 'Носит хиджаб (покрытая)',
    about: 'Есть сын 4 года. Работаю удалённо, совершаю намаз. Ценю честность и спокойствие в семье.',
    requirements: 'Ответственный мужчина 28–38 лет, который примет ребёнка как своего. Совершает намаз, без вредных привычек.',
    contact: { type: 'WhatsApp', value: '+7 700 000 00 03' }, hideContact: true, createdAt: 3,
  },
  {
    id: 'p4', gender: 'male', name: '', showName: false, age: 34,
    country: 'Казахстан', city: 'Тараз', nationality: 'Казах',
    height: 176, weight: 82, marital: 'divorced', children: 'no', relocation: false,
    profession: 'Инженер-строитель', hijab: '',
    about: 'Свой небольшой бизнес по ремонту. Был в браке, детей нет. Совершаю намаз, в мечеть хожу на джума. Хочу крепкую семью.',
    requirements: 'Сестра 24–32 лет, совершающая намаз. Можно в разводе. Желательно из Жамбылской области.',
    contact: { type: 'WhatsApp', value: '+7 700 000 00 04' }, hideContact: false, createdAt: 4,
  },
  {
    id: 'p5', gender: 'female', name: 'Айгерим', showName: true, age: 21,
    country: 'Казахстан', city: 'Актобе', nationality: 'Казашка',
    height: 168, weight: 55, marital: 'never', children: 'no', relocation: true,
    profession: 'Студентка (медколледж)', hijab: 'Носит платок',
    about: 'Учусь на медсестру, заканчиваю в этом году. Начала покрываться, учу арабский. Люблю детей и рукоделие.',
    requirements: 'Брат до 28 лет, совершающий намаз, с добрым характером. Готова к переезду.',
    contact: { type: 'Telegram', value: '@demo_aigerim' }, hideContact: true, createdAt: 5,
  },
  {
    id: 'p6', gender: 'male', name: 'Тимур', showName: true, age: 26,
    country: 'Казахстан', city: 'Актобе', nationality: 'Казах',
    height: 183, weight: 75, marital: 'never', children: 'no', relocation: true,
    profession: 'Программист', hijab: '',
    about: 'Backend-разработчик, работаю удалённо. Хафиз 5 джузов, продолжаю учить. Спорт, книги, путешествия.',
    requirements: 'Сестра 19–25 лет, покрытая, совершающая намаз. Город не важен — могу переехать.',
    contact: { type: 'Telegram', value: '@demo_timur' }, hideContact: false, createdAt: 6,
  },
  {
    id: 'p7', gender: 'female', name: '', showName: false, age: 30,
    country: 'Россия', city: 'Москва', nationality: 'Татарка',
    height: 163, weight: 58, marital: 'never', children: 'no', relocation: false,
    profession: 'Маркетолог', hijab: 'Носит хиджаб (покрытая)',
    about: 'Живу и работаю в Москве, совершаю намаз. Посещаю курсы по фикху. Спокойная, домашняя, люблю выпечку.',
    requirements: 'Практикующий брат 30–38 лет из Москвы или области. Образованный, с работой.',
    contact: { type: 'WhatsApp', value: '+7 900 000 00 07' }, hideContact: true, createdAt: 7,
  },
  {
    id: 'p8', gender: 'male', name: 'Магомед', showName: true, age: 31,
    country: 'Россия', city: 'Махачкала', nationality: 'Аварец',
    height: 178, weight: 80, marital: 'never', children: 'no', relocation: false,
    profession: 'Преподаватель арабского', hijab: '',
    about: 'Окончил исламский университет, преподаю арабский язык. Есть дом. Семья поддерживает.',
    requirements: 'Покрытая сестра 20–28 лет, не была в браке, желательно с базовыми знаниями религии.',
    contact: { type: 'WhatsApp', value: '+7 900 000 00 08' }, hideContact: true, createdAt: 8,
  },
  {
    id: 'p9', gender: 'female', name: 'Патимат', showName: true, age: 25,
    country: 'Россия', city: 'Дербент', nationality: 'Лезгинка',
    height: 158, weight: 50, marital: 'never', children: 'no', relocation: true,
    profession: 'Фармацевт', hijab: 'Носит хиджаб (покрытая)',
    about: 'Работаю в аптеке. Совершаю намаз, читаю Коран. Люблю тишину, садоводство и готовить для семьи.',
    requirements: 'Брат 26–33 лет, совершающий намаз, ответственный. Рассмотрю переезд.',
    contact: { type: 'Telegram', value: '@demo_patimat' }, hideContact: false, createdAt: 9,
  },
  {
    id: 'p10', gender: 'male', name: '', showName: false, age: 38,
    country: 'Казахстан', city: 'Алматы', nationality: 'Уйгур',
    height: 174, weight: 85, marital: 'widowed', children: 'yes', relocation: false,
    profession: 'Предприниматель', hijab: '',
    about: 'Вдовец, есть дочь 7 лет. Своё кафе. Совершаю намаз, держу пост. Ищу спутницу для дочери и для себя.',
    requirements: 'Сестра 28–38 лет, с добрым сердцем, которая полюбит ребёнка. Можно с детьми.',
    contact: { type: 'WhatsApp', value: '+7 700 000 00 10' }, hideContact: true, createdAt: 10,
  },
]

export const EXAMPLE_QUERIES = [
  'Девушки из Алматы до 25 лет',
  'Мужчины из Актобе',
  'Алматы, без детей, покрытая',
  'Врач из Астаны',
  'Сёстры в разводе с детьми',
  'Готовы к переезду, Россия',
]
