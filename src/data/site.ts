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
  address: 'вул. Поповича, 47а, Верховина, Івано-Франківська обл.',
  mapUrl: 'https://maps.app.goo.gl/oed5A6aHhjnjWsEH7',
  mapEmbedUrl: 'https://www.google.com/maps?cid=16964944946448473099&output=embed',
  instagram: '',
}

export const brand = {
  name: 'Gora&Lis',
  tagline: 'Котеджі у Верховині з чаном та всіма зручностями',
}

export type Slide = { id: string; kicker: string; title: string; text: string; photo: Photo; align?: 'bottom' | 'center' }

export const home = {
  heroWide: photo('general/overview-1', 'Два будинки Gora&Lis — Atmosfera та Panorama серед Карпат'),
  slides: [
    {
      id: 'about',
      kicker: 'Карпати · Верховина',
      title: 'Тиша гір і запах смереки',
      text: 'Два будинки серед гір і смерек: Atmosfera з каміном та А-фрейм Panorama.',
      photo: photo('panorama/exterior-6', 'Схід сонця над Карпатами'),
    },
    {
      id: 'chan',
      kicker: 'Релакс',
      title: 'Чан з джакузі',
      text: 'Гаряча вода 38–39 °C, гідромасаж і підсвітка. Дощ, сніг і мороз лише посилюють ефект.',
      photo: photo('panorama/exterior-2', 'Чан на території біля Panorama'),
    },
    {
      id: 'fire',
      kicker: 'Вечори',
      title: 'Вогонь під зорями',
      text: 'Чаша для вогню, мангали та велика альтанка, закрита мʼякими вікнами.',
      photo: photo('panorama/exterior-5', 'Вогонь у чаші біля Panorama'),
    },
    {
      id: 'terrace',
      kicker: 'Затишок',
      title: 'Тераса з видом на гори',
      text: 'Деревʼяні лежаки, крісло-кокон і гамак — ранкова кава з видом на Карпати.',
      photo: photo('atmosfera/terrace-2', 'Тераса Atmosfera з лежаками'),
    },
    {
      id: 'inside',
      kicker: 'Всередині',
      title: 'Тепло каміна',
      text: 'Вітальня Atmosfera з каміном, диваном і великим столом для затишних вечорів разом.',
      photo: photo('atmosfera/ground-floor-1', 'Вітальня Atmosfera з каміном'),
    },
  ] as Slide[],
  territory: [
    photo('general/overview-1', 'Загальний вигляд Gora&Lis'),
    photo('panorama/exterior-1', 'Територія біля Panorama'),
    photo('panorama/exterior-3', 'Альтанка з мʼякими вікнами'),
    photo('panorama/exterior-4', 'Обідній стіл в альтанці'),
    photo('panorama/exterior-2', 'Двір і чан'),
    photo('panorama/exterior-5', 'Чаша для вогню'),
    photo('panorama/exterior-6', 'Схід сонця'),
    photo('panorama/exterior-7', 'Вечірній відпочинок у чані'),
  ],
}

export const chan = {
  title: 'Чан',
  lead: 'Для повного релаксу насолодіться відпочинком у чані!',
  price: 2000,
  photo: photo('panorama/exterior-2', 'Чан на території біля Panorama'),
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
    name: 'Atmosfera',
    subtitle: 'Затишний будинок з каміном',
    guests: 6,
    price: 4000,
    cover: photo('atmosfera/ground-floor-1', 'Вітальня з каміном у Atmosfera'),
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
          photo('atmosfera/ground-floor-1', 'Atmosfera: вітальня з каміном'),
          photo('atmosfera/ground-floor-2', 'Atmosfera: кухня та сходи'),
          photo('atmosfera/ground-floor-3', 'Atmosfera: вітальня з кухнею'),
          photo('atmosfera/ground-floor-4', 'Atmosfera: санвузол першого поверху'),
          photo('atmosfera/terrace-1', 'Atmosfera: крісло-кокон на терасі'),
          photo('atmosfera/terrace-2', 'Atmosfera: тераса з лежаками'),
        ],
      },
      {
        title: 'Другий поверх',
        text: 'Дві спальні з виходом на балкон і санвузол.',
        items: ['Спальня 1: двоспальне ліжко + розкладний диван', 'Спальня 2: двоспальне ліжко', 'Вихід на балкон', 'Санвузол з душем'],
        photos: [
          photo('atmosfera/bedroom-main-2', 'Atmosfera: перша спальня з двоспальним ліжком'),
          photo('atmosfera/bedroom-main-3', 'Atmosfera: розкладний диван у першій спальні'),
          photo('atmosfera/bedroom-main-1', 'Atmosfera: сходи на другий поверх'),
          photo('atmosfera/bedroom-second-1', 'Atmosfera: друга спальня'),
          photo('atmosfera/bedroom-second-2', 'Atmosfera: двоспальне ліжко в другій спальні'),
          photo('atmosfera/bath-upstairs-1', 'Atmosfera: санвузол другого поверху'),
          photo('atmosfera/balcony-1', 'Atmosfera: балкон'),
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
    name: 'Panorama',
    subtitle: 'А-фрейм з видом на гори',
    guests: 4,
    price: 3000,
    cover: photo('panorama/exterior-10', 'А-фрейм Panorama — вигляд зовні'),
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
          photo('panorama/ground-floor-1', 'Panorama: кухня першого поверху'),
          photo('panorama/ground-floor-2', 'Panorama: обідня зона біля панорамних вікон'),
          photo('panorama/ground-floor-3', 'Panorama: обідній стіл'),
          photo('panorama/ground-floor-4', 'Panorama: кухня та диван'),
          photo('panorama/bath-1', 'Panorama: санвузол з душем'),
          photo('panorama/bath-2', 'Panorama: умивальник у санвузлі'),
          photo('panorama/bath-3', 'Panorama: санвузол'),
        ],
      },
      {
        title: 'Другий поверх',
        text: 'Дві спальні з двоспальними ліжками.',
        items: ['Спальня 1: двоспальне ліжко', 'Спальня 2: двоспальне ліжко', 'Постіль і рушники'],
        photos: [
          photo('panorama/upstairs-1', 'Panorama: двоспальне ліжко на другому поверсі'),
          photo('panorama/upstairs-2', 'Panorama: панорамне вікно та балкон'),
          photo('panorama/upstairs-3', 'Panorama: спальня другого поверху'),
          photo('panorama/upstairs-4', 'Panorama: вид зі спальні на гори'),
          photo('panorama/upstairs-5', 'Panorama: інтер’єр спальні'),
        ],
      },
      {
        title: 'Будинок зовні та тераса',
        text: 'А-фрейм серед смерек із панорамними вікнами та терасою.',
        items: ['Тераса', 'Панорамні вікна'],
        photos: [
          photo('panorama/exterior-10', 'Panorama: фасад будинку'),
          photo('panorama/exterior-8', 'Panorama: А-фрейм серед дерев'),
          photo('panorama/exterior-9', 'Panorama: вечірня підсвітка'),
          photo('panorama/exterior-11', 'Panorama: панорамні вікна й тераса'),
          photo('panorama/exterior-12', 'Panorama: місце для відпочинку на терасі'),
        ],
      },
    ],
    amenities: ['Індукційна плита', 'Холодильник', 'Мікрохвильова піч', 'Посуд', 'Постіль і рушники'],
  },
]

export const faq = [
  { q: 'Як забронювати?', a: `Зателефонуйте нам за номером ${contacts.phoneLabel} або залиште заявку на сторінці будинку — ми передзвонимо.` },
  { q: 'О котрій заїзд і виїзд?', a: LOREM },
  { q: 'Скільки коштує чан і як його замовити?', a: `Вартість — ${chan.price} грн. ${chan.note}` },
  { q: 'Чи буде світло під час відключень?', a: 'Так, будинок Atmosfera обладнаний інвертором 7 кВт.' },
  { q: 'Як до вас доїхати?', a: `Наша адреса: ${contacts.address}. Точна позначка Gora&Lis і посилання на Google Maps — у розділі контактів.` },
  { q: 'Чи можна з дітьми або тваринами?', a: LOREM },
  { q: 'Чи працюєте ви взимку?', a: LOREM },
]
