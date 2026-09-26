// Увесь контент сайту в одному місці: тексти, ціни, фото, контакти.
// Щоб додати фото: покласти `<name>-lg.webp` (≈1600px) і `<name>-sm.webp` (≈720px)
// у public/photos/<папка>/ і додати рядок `photo('<папка>/<name>', 'Опис')` у потрібний список.

const BASE = import.meta.env.BASE_URL

export type Photo = { sm: string; lg: string; alt: string }

export const photo = (name: string, alt: string): Photo => ({
  sm: `${BASE}photos/${name}-sm.webp`,
  lg: `${BASE}photos/${name}-lg.webp`,
  alt,
})

export const asset = (path: string) => `${BASE}${path}`

export const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus, posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla.'

export const contacts = {
  // TODO: справжній номер
  phone: '+380000000000',
  phoneLabel: '+380 XX XXX XX XX',
  address: 'смт Верховина, Івано-Франківська обл.',
  mapQuery: 'Верховина, Івано-Франківська область',
  instagram: '',
}

export const brand = {
  name: 'Маєток Пушкар',
  tagline: 'Котеджі у Верховині з чаном та всіма зручностями',
}

export type Slide = { id: string; kicker: string; title: string; text: string; photo: Photo; align?: 'bottom' | 'center' }

export const home = {
  heroVideo: asset('video/yard.mp4'),
  heroPoster: photo('territory/firepit', 'Чаша для вогню та чан біля А-фрейму'),
  heroWide: photo('stock/mountains-1', 'Карпатські гори'),
  slides: [
    {
      id: 'about',
      kicker: 'Карпати · Верховина',
      title: 'Тиша гір і запах смереки',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus.',
      photo: photo('territory/sunrise', 'Схід сонця над Карпатами'),
    },
    {
      id: 'chan',
      kicker: 'Релакс',
      title: 'Чан з джакузі',
      text: 'Гаряча вода 38–39 °C, гідромасаж і підсвітка. Дощ, сніг і мороз лише посилюють ефект.',
      photo: photo('territory/yard-2', 'Дерев’яний чан на території'),
    },
    {
      id: 'fire',
      kicker: 'Вечори',
      title: 'Вогонь під зорями',
      text: 'Чаша для вогню, мангали та велика альтанка, закрита мʼякими вікнами.',
      photo: photo('territory/gazebo-1', 'Альтанка серед смерек'),
    },
    {
      id: 'terrace',
      kicker: 'Затишок',
      title: 'Тераса з видом на гори',
      text: 'Деревʼяні лежаки, крісло-кокон і гамак — ранкова кава з видом на Карпати.',
      photo: photo('zrub/terrace-2', 'Тераса з лежаками'),
    },
    {
      id: 'inside',
      kicker: 'Всередині',
      title: 'Тепло каміна',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ullamcorper nulla non metus auctor fringilla.',
      photo: photo('zrub/living-1', 'Вітальня з каміном'),
    },
  ] as Slide[],
  territory: [
    photo('territory/yard-1', 'Територія з чаном і А-фреймом'),
    photo('territory/gazebo-1', 'Альтанка з мʼякими вікнами'),
    photo('territory/gazebo-2', 'Альтанка всередині'),
    photo('territory/yard-2', 'Двір і чан'),
    photo('territory/firepit', 'Чаша для вогню'),
    photo('territory/sunrise', 'Схід сонця'),
  ],
}

export const chan = {
  title: 'Чан',
  lead: 'Для повного релаксу насолодіться відпочинком у чані!',
  price: 2000,
  photo: photo('territory/yard-2', 'Дерев’яний чан на території'),
  paragraphs: [
    'Після Вашого замовлення в чан набирається вода, після чого за допомогою дров вона нагрівається до температури приблизно 38–39 °C. Чан обладнаний системою «джакузі», яка додасть приємних відчуттів, та підсвіткою.',
    'Підготовкою та обслуговуванням чану займається наш відповідний співробітник.',
    'До речі, дощ, сніг, мороз тільки посилюють приємний ефект, тому насолоджуйтеся відпочинком у чані в будь-яку пору року та погоду — точно будете задоволені.',
  ],
  note: 'Час на підготовку чану — залежно від пори року — 3,5–4,5 години, тому повідомте нас завчасно.',
}

export type Floor = { title: string; text: string; items: string[]; photos: Photo[] }

export type House = {
  slug: 'zrub' | 'panorama'
  name: string
  subtitle: string
  guests: number
  price: number
  cover: Photo
  facts: { icon: string; label: string }[]
  intro: string
  floors: Floor[]
  amenities: string[]
}

export const houses: House[] = [
  {
    slug: 'zrub',
    name: 'Зруб',
    subtitle: 'Затишний будинок з каміном',
    guests: 6,
    price: 4000,
    cover: photo('zrub/living-2', 'Вітальня з каміном у Зрубі'),
    facts: [
      { icon: 'users', label: 'до 6 осіб' },
      { icon: 'flame', label: 'Камін' },
      { icon: 'bed', label: '2 спальні' },
      { icon: 'zap', label: 'Інвертор 7 кВт' },
    ],
    intro: 'Опалення: камін + керамічні біоконвектори. Будинок обладнаний резервним джерелом живлення (інвертор 7 кВт).',
    floors: [
      {
        title: 'Перший поверх',
        text: 'Вітальня з кухнею, санвузол та тераса з деревʼяними лежаками, підвісним кріслом-коконом і гамаком.',
        items: ['Кутовий диван', 'Обідній стіл', 'Камін', 'Санвузол з душем', 'Тераса з лежаками', 'Крісло-кокон і гамак'],
        photos: [
          photo('zrub/living-1', 'Вітальня з каміном'),
          photo('zrub/living-2', 'Обідній стіл біля каміна'),
          photo('zrub/kitchen-1', 'Кухня і сходи на другий поверх'),
          photo('zrub/kitchen-2', 'Обладнана кухня'),
          photo('zrub/living-3', 'Простора вітальня'),
          photo('zrub/living-4', 'Вітальня з диваном'),
          photo('zrub/kitchen-3', 'Кухня'),
          photo('zrub/bath-1', 'Санвузол першого поверху'),
          photo('zrub/terrace-1', 'Крісло-кокон на терасі'),
          photo('zrub/terrace-2', 'Тераса з лежаками'),
        ],
      },
      {
        title: 'Другий поверх',
        text: 'Дві спальні з виходом на балкон і санвузол.',
        items: ['Спальня 1: двоспальне ліжко + розкладний диван', 'Спальня 2: двоспальне ліжко', 'Вихід на балкон', 'Санвузол з душем'],
        photos: [
          photo('zrub/bedroom-3', 'Спальня з виходом на балкон'),
          photo('zrub/bedroom-2', 'Спальня з диваном'),
          photo('zrub/bedroom-5', 'Розкладний диван у спальні'),
          photo('zrub/bedroom-1', 'Спальня'),
          photo('zrub/bedroom-4', 'Друга спальня'),
          photo('zrub/bedroom-6', 'Друга спальня, вид на вікна'),
          photo('zrub/bedroom-7', 'Спальня'),
          photo('zrub/hall-2', 'Хол другого поверху'),
          photo('zrub/stairs', 'Сходи'),
          photo('zrub/bath-2', 'Санвузол другого поверху'),
        ],
      },
    ],
    amenities: [
      'Електроплита',
      'Холодильник',
      'Посудомийна машина',
      'Мікрохвильова піч',
      'Посуд',
      'Постіль і рушники',
      'Пральна машина',
      'Фен',
      'WiFi',
    ],
  },
  {
    slug: 'panorama',
    name: 'Панорама',
    subtitle: 'А-фрейм з видом на гори',
    guests: 4,
    price: 3000,
    cover: photo('territory/yard-1', 'А-фрейм Панорама'),
    facts: [
      { icon: 'users', label: 'до 4 осіб' },
      { icon: 'bed', label: '2 спальні' },
      { icon: 'thermometer', label: 'Біоконвектори' },
      { icon: 'wifi', label: 'WiFi' },
    ],
    intro: 'Опалення: керамічні біоконвектори.',
    floors: [
      {
        title: 'Перший поверх',
        text: 'Вітальня з обладнаною кухнею та санвузол.',
        items: ['Кутовий диван', 'Обідній стіл', 'Санвузол'],
        photos: [
          photo('territory/yard-1', 'А-фрейм Панорама'),
          photo('territory/yard-2', 'А-фрейм і чан'),
        ],
      },
      {
        title: 'Другий поверх',
        text: 'Дві спальні з двоспальними ліжками.',
        items: ['Спальня 1: двоспальне ліжко', 'Спальня 2: двоспальне ліжко', 'Постіль і рушники'],
        photos: [photo('stock/mountains-2', 'Карпати')],
      },
    ],
    amenities: ['Індукційна плита', 'Холодильник', 'Мікрохвильова піч', 'Посуд', 'Постіль і рушники'],
  },
]

export const faq = [
  { q: 'Як забронювати?', a: `Зателефонуйте нам за номером ${contacts.phoneLabel} або залиште заявку на сторінці будинку — ми передзвонимо.` },
  { q: 'О котрій заїзд і виїзд?', a: LOREM },
  { q: 'Скільки коштує чан і як його замовити?', a: `Вартість — ${chan.price} грн. ${chan.note}` },
  { q: 'Чи буде світло під час відключень?', a: 'Так, будинок Зруб обладнаний інвертором 7 кВт. ' + LOREM },
  { q: 'Як до вас доїхати?', a: LOREM },
  { q: 'Чи можна з дітьми або тваринами?', a: LOREM },
  { q: 'Чи працюєте ви взимку?', a: LOREM },
]
