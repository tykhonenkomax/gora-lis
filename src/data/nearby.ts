import { photo, type Photo } from './site'

export type Category = 'active' | 'nature' | 'taste' | 'culture'

export const categories: { id: Category; label: string }[] = [
  { id: 'active', label: 'Активний відпочинок' },
  { id: 'nature', label: 'Гори й місця сили' },
  { id: 'taste', label: 'Смаки' },
  { id: 'culture', label: 'Культура' },
]

export type Place = {
  id: string
  title: string
  category: Category
  where: string
  text: string
  facts: string[]
  photo?: Photo
  map?: string
  link?: { label: string; url: string }
}

export const nearby = {
  hero: photo('nearby/pip-ivan', 'Обсерваторія «Білий слон» на горі Піп Іван'),
  title: 'Поблизу',
  lead: 'Гори, ріки, місця сили й гуцульські смаки — все, що варто побачити навколо Маєтку.',
}

export const places: Place[] = [
  {
    id: 'sv-club',
    title: 'SV Club',
    category: 'active',
    where: '300 м від маєтку',
    text: 'Спортивний клуб по сусідству: прокат квадроциклів і пейнтбол для компаній та сімей.',
    facts: ['Квадроцикли', 'Пейнтбол'],
    photo: photo('nearby/quad', 'Прогулянка на квадроциклах'),
    map: 'https://maps.app.goo.gl/ezDzT8MCT2gtYeVM6',
  },
  {
    id: 'rafting',
    title: 'Рафтинг на Чорному Черемоші',
    category: 'active',
    where: 'Верховина',
    text: 'Сплав гірською річкою з досвідченими інструкторами — підходить навіть без підготовки. Маршрути від 3,5 до 10 км.',
    facts: ['Сезон: квітень — жовтень', 'Найповноводніше — навесні'],
    photo: photo('nearby/cheremosh', 'Річка Чорний Черемош'),
  },
  {
    id: 'pool',
    title: 'Відкритий басейн',
    category: 'active',
    where: '500 м від маєтку',
    text: 'На території дитячого оздоровчого центру можна відвідати відкритий басейн.',
    facts: ['Влітку'],
  },
  {
    id: 'tower',
    title: 'Оглядова вежа',
    category: 'nature',
    where: 'гора Швейкова, Верховина',
    text: 'Всього 15–20 хвилин підйому — і вся Верховина з долиною Черемошу як на долоні. Під вежею — альтанка, де можна випити карпатського чаю.',
    facts: ['689 м н. р. м.', '15–20 хв підйому'],
    photo: photo('nearby/verkhovyna', 'Ранок у Верховині'),
    map: 'https://maps.app.goo.gl/V1LyXeGSj2sufzQL7',
  },
  {
    id: 'pysanyi-kamin',
    title: 'Писаний Камінь',
    category: 'nature',
    where: 'с. Буковець',
    text: 'Скельний комплекс на вершині з давніми петрогліфами — фігурками людей, ромбами, колами й хрестами. Найстарішим знакам понад тисячу років, а з вершини відкривається панорама Чорногори.',
    facts: ['1221 м н. р. м.', 'Підйом 3–4 год', 'Скелі до 20 м'],
    photo: photo('nearby/pysanyi-kamin', 'Скелі Писаного Каменя'),
    map: 'https://maps.app.goo.gl/hmgchYKwRVg2DaLt9',
  },
  {
    id: 'lada',
    title: 'Терношорська Лада',
    category: 'nature',
    where: 'с. Яворів',
    text: 'Скельний комплекс серед вікових смерек на схилі гори Терношора, який вважають стародавнім святилищем: кам’яне коло, антропоморфна скеля-статуя, чашні камені. Ланцюг скель тягнеться на 300 м.',
    facts: ['Скелі до 40 м', 'РЛП «Гуцульщина»'],
    photo: photo('nearby/lada', 'Скелі Терношорської Лади'),
    map: 'https://maps.app.goo.gl/2qNQ1r9TRtTcwyHq8',
  },
  {
    id: 'dovbush',
    title: 'Довбушеві комори',
    category: 'nature',
    where: 'між Верховиною і Верхнім Ясеновом',
    text: 'Дві величезні скелі на вершині гори з кам’яним коридором, печерами й гротами. Колись — язичницьке святилище, за легендою — зимівка опришків Олекси Довбуша, де він ховав свої скарби.',
    facts: ['Печери й гроти', 'Легенди про опришків'],
    photo: photo('nearby/dovbush', 'Скелі Довбушевих комор'),
    map: 'https://maps.app.goo.gl/8h2qGZrVKNNev6iL9',
  },
  {
    id: 'pip-ivan',
    title: 'Піп Іван Чорногорський',
    category: 'nature',
    where: 'Чорногірський хребет',
    text: 'Одна з найвищих вершин України з руїнами обсерваторії «Білий слон». Від 2017 року тут працює рятувальна станція. Маршрути — з Дземброні або Шибеного, на цілий день.',
    facts: ['2028 м н. р. м.', 'Підйом 5–6 год'],
    photo: photo('nearby/pip-ivan', 'Обсерваторія на Попі Івані'),
    map: 'https://maps.app.goo.gl/V46eGjrCmLSN78mF9',
  },
  {
    id: 'vodograi',
    title: 'Гостинний двір «Карпатський водограй»',
    category: 'taste',
    where: 'вул. Поповича, Верховина',
    text: 'Ресторан-колиба з національною гуцульською кухнею — банош, бринза, гриби й карпатські трави.',
    facts: ['Гуцульська кухня', 'Поруч із маєтком'],
    map: 'https://maps.app.goo.gl/6ZpZtzhFkoYwrK1s5',
  },
  {
    id: 'forelhill',
    title: 'Форельне господарство «Форельхіл»',
    category: 'taste',
    where: 'вул. Федьковича, Верховина',
    text: 'Зловіть форель власноруч — своєю вудкою або взятою на місці, — а в колибі з панорамними вікнами її приготують для вас із видом на Верховину.',
    facts: ['Риболовля', 'Колиба'],
    photo: photo('nearby/trout', 'Гірський потік у лісі'),
    map: 'https://maps.app.goo.gl/xntWnbE9i2Nam9f99',
  },
  {
    id: 'daleki-gory',
    title: 'Сироварня «Далекі Гори»',
    category: 'taste',
    where: 'с. Снідавка, 940 м',
    text: 'Сири з високогірного молока за голландськими та швейцарськими технологіями. На екскурсії покажуть усі етапи сироваріння, а потім — дегустація: чеддер, гауда, маасдам, бринза «Гуцульська».',
    facts: ['Екскурсія', 'Дегустація'],
    photo: photo('nearby/cheese', 'Гуцульська сироварня на полонині'),
    map: 'https://maps.app.goo.gl/HAUteU1vVCdtuqPM7',
    link: { label: 'daleki-gory.com', url: 'https://daleki-gory.com/' },
  },
  {
    id: 'museums',
    title: 'Музеї Верховини',
    category: 'culture',
    where: 'Верховина',
    text: 'Гуцульська столиця має понад десяток музеїв: від музичних інструментів Романа Кумлика до хати-музею «Тіні забутих предків» і Музею гуцульської магії.',
    facts: ['12+ музеїв'],
    photo: photo('nearby/museum', 'Різьблена стеля в музеї Верховини'),
    link: { label: '12 музеїв Верховини', url: 'https://vidviday.ua/blog/muzei-verkhovyny/' },
  },
]

export const museums = [
  'Музей гуцульського побуту та музичних інструментів Романа Кумлика',
  'Хата-музей «Тіні забутих предків»',
  'Музей гуцульської магії',
  'Музей «Гуцульщина»',
  'Музей-сироварня «Хата-стая»',
  'Музей ліжникарства',
  'Музей кінофільму «Олекса Довбуш»',
  'Музей-садиба Галинки Верховинки (вишивка)',
]

export const retreat = {
  title: 'Ретрит',
  text: 'Тиша, природа і глибоке перезавантаження. Медитації та тематичні практики допомагають відчути себе, наповнитись спокоєм і знайти гармонію — всередині й навколо. Прогулянки лісом, вечори біля вогню, ігри з друзями й теплі розмови під зорями. Все, що створює відчуття простоти, легкості й щастя бути тут.',
  photo: photo('territory/sunrise', 'Світанок над горами'),
}

// Фото сторонніх авторів — ліцензії вимагають зазначити авторство.
export const credits = [
  { what: 'Піп Іван', author: 'Khoroshkov', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Стара_обсерваторія_Білий_слон_на_горі_Піп_Іван_Чорногорський.jpg' },
  { what: 'Чорний Черемош', author: 'Neovitaha777', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:«Ріка_Чорний_Черемош_з_прибережною_смугою».jpg' },
  { what: 'Писаний Камінь', author: 'Іван Вєтров', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Писаний_камінь_(11).jpg' },
  { what: 'Довбушеві комори', author: 'Gudyma s', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:Довбушеві_комори-4.JPG' },
  { what: 'Терношорська Лада', author: 'Kyzja86', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Терношорська_Лада_2.jpg' },
  { what: 'Верховина', author: 'Zybikok', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Червень,ранок,Верховина.JPG' },
  { what: 'Музей', author: 'MariyaZ', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/15601975@N02/2869776933' },
  { what: 'Сироварня', author: 'Dave Proffer', license: 'CC BY 2.0', url: 'https://www.flickr.com/photos/23442653@N00/3943324448' },
  { what: 'Квадроцикли', author: 'William Hook', license: 'CC BY-SA 2.0', url: 'https://www.flickr.com/photos/83542829@N00/3505925716' },
  { what: 'Гори й ліс (головна)', author: 'Unsplash', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/Category:Photographs_from_Unsplash' },
]
