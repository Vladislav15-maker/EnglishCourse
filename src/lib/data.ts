import type { User, Unit } from './types';

export const users: User[] = [
  { id: 'teacher-vladislav', username: 'Vladislav', password: 'Vladislav15', role: 'teacher', name: 'Ермилов Владислав' },
  { id: 'student-oksana', username: 'Oksana', password: 'Oksana25', role: 'student', name: 'Юрченко Оксана' },
  { id: 'student-alexander', username: 'Alexander', password: 'Alexander23', role: 'student', name: 'Ермилов Александр' },
];

export const units: Unit[] = [
  {
    id: 'unit1',
    name: 'Unit 1: Greetings',
    rounds: [
      {
        id: 'round1-1',
        name: 'Round 1',
        words: [
          { id: 'u1r1w1', english: 'hi', russian: 'привет', transcription: '(хай)' },
          { id: 'u1r1w2', english: 'hello', russian: 'здравствуйте', transcription: '(хэллоу)' },
          { id: 'u1r1w3', english: 'goodbye', russian: 'до свидания', transcription: '(гудбай)' },
          { id: 'u1r1w4', english: 'good morning', russian: 'доброе утро', transcription: '(гуд морнинг)' },
          { id: 'u1r1w5', english: 'good night', russian: 'спокойной ночи', transcription: '(гуд найт)' },
        ],
      },
      {
        id: 'round1-2',
        name: 'Round 2',
        words: [
          { id: 'u1r2w1', english: 'how are you', russian: 'как дела?', transcription: '(хау ар ю)' },
          { id: 'u1r2w2', english: 'I’m fine', russian: 'у меня все хорошо', transcription: '(айм файн)' },
          { id: 'u1r2w3', english: 'nice to meet you', russian: 'приятно познакомиться', transcription: '(найс ту мит ю)' },
          { id: 'u1r2w4', english: 'see you', russian: 'увидимся', transcription: '(си ю)' },
          { id: 'u1r2w5', english: 'take care', russian: 'береги себя', transcription: '(тэйк кэр)' },
        ],
      },
    ],
  },
  {
    id: 'unit2',
    name: 'Unit 2: Family',
    rounds: [
      {
        id: 'round2-1',
        name: 'Round 1',
        words: [
          { id: 'u2r1w1', english: 'mother', russian: 'мама', transcription: '(мазэр)' },
          { id: 'u2r1w2', english: 'father', russian: 'папа', transcription: '(фазэр)' },
          { id: 'u2r1w3', english: 'sister', russian: 'сестра', transcription: '(систэр)' },
          { id: 'u2r1w4', english: 'brother', russian: 'брат', transcription: '(бразэр)' },
          { id: 'u2r1w5', english: 'parents', russian: 'родители', transcription: '(пэрэнтс)' },
        ],
      },
      {
        id: 'round2-2',
        name: 'Round 2',
        words: [
          { id: 'u2r2w1', english: 'grandmother', russian: 'бабушка', transcription: '(грэндмазэр)' },
          { id: 'u2r2w2', english: 'grandfather', russian: 'дедушка', transcription: '(грэндфазэр)' },
          { id: 'u2r2w3', english: 'uncle', russian: 'дядя', transcription: '(анкл)' },
          { id: 'u2r2w4', english: 'aunt', russian: 'тетя', transcription: '(ант)' },
          { id: 'u2r2w5', english: 'cousin', russian: 'двоюродный брат/сестра', transcription: '(казн)' },
        ],
      },
    ],
  },
  {
    id: 'unit3',
    name: 'Unit 3: Food',
    rounds: [
      {
        id: 'round3-1',
        name: 'Round 1',
        words: [
          { id: 'u3r1w1', english: 'bread', russian: 'хлеб', transcription: '(брэд)' },
          { id: 'u3r1w2', english: 'milk', russian: 'молоко', transcription: '(милк)' },
          { id: 'u3r1w3', english: 'water', russian: 'вода', transcription: '(уотэр)' },
          { id: 'u3r1w4', english: 'juice', russian: 'сок', transcription: '(джус)' },
          { id: 'u3r1w5', english: 'apple', russian: 'яблоко', transcription: '(эпл)' },
        ],
      },
      {
        id: 'round3-2',
        name: 'Round 2',
        words: [
          { id: 'u3r2w1', english: 'tea', russian: 'чай', transcription: '(ти)' },
          { id: 'u3r2w2', english: 'coffee', russian: 'кофе', transcription: '(кофи)' },
          { id: 'u3r2w3', english: 'orange', russian: 'апельсин', transcription: '(ориндж)' },
          { id: 'u3r2w4', english: 'banana', russian: 'банан', transcription: '(бэнэна)' },
          { id: 'u3r2w5', english: 'salad', russian: 'салат', transcription: '(сэлэд)' },
        ],
      },
    ],
  },
   {
    id: 'unit4',
    name: 'Unit 4: Numbers',
    rounds: [
      {
        id: 'round4-1',
        name: 'Round 1',
        words: [
          { id: 'u4r1w1', english: 'one', russian: 'один', transcription: '(уан)' },
          { id: 'u4r1w2', english: 'two', russian: 'два', transcription: '(ту)' },
          { id: 'u4r1w3', english: 'three', russian: 'три', transcription: '(фри)' },
          { id: 'u4r1w4', english: 'four', russian: 'четыре', transcription: '(фор)' },
          { id: 'u4r1w5', english: 'five', russian: 'пять', transcription: '(файв)' },
        ],
      },
      {
        id: 'round4-2',
        name: 'Round 2',
        words: [
          { id: 'u4r2w1', english: 'six', russian: 'шесть', transcription: '(сикс)' },
          { id: 'u4r2w2', english: 'seven', russian: 'семь', transcription: '(сэвэн)' },
          { id: 'u4r2w3', english: 'eight', russian: 'восемь', transcription: '(эйт)' },
          { id: 'u4r2w4', english: 'nine', russian: 'девять', transcription: '(найн)' },
          { id: 'u4r2w5', english: 'ten', russian: 'десять', transcription: '(тэн)' },
        ],
      },
    ],
  },
  {
    id: 'unit5',
    name: 'Unit 5: Colors',
    rounds: [
      {
        id: 'round5-1',
        name: 'Round 1',
        words: [
          { id: 'u5r1w1', english: 'red', russian: 'красный', transcription: '(рэд)' },
          { id: 'u5r1w2', english: 'blue', russian: 'синий', transcription: '(блу)' },
          { id: 'u5r1w3', english: 'green', russian: 'зеленый', transcription: '(грин)' },
          { id: 'u5r1w4', english: 'yellow', russian: 'желтый', transcription: '(йелоу)' },
          { id: 'u5r1w5', english: 'black', russian: 'черный', transcription: '(блэк)' },
        ],
      },
      {
        id: 'round5-2',
        name: 'Round 2',
        words: [
          { id: 'u5r2w1', english: 'white', russian: 'белый', transcription: '(уайт)' },
          { id: 'u5r2w2', english: 'brown', russian: 'коричневый', transcription: '(браун)' },
          { id: 'u5r2w3', english: 'orange', russian: 'оранжевый', transcription: '(ориндж)' },
          { id: 'u5r2w4', english: 'pink', russian: 'розовый', transcription: '(пинк)' },
          { id: 'u5r2w5', english: 'purple', russian: 'фиолетовый', transcription: '(пёрпл)' },
        ],
      },
    ],
  },
  {
    id: 'unit6',
    name: 'Unit 6: School',
    rounds: [
      {
        id: 'round6-1',
        name: 'Round 1',
        words: [
          { id: 'u6r1w1', english: 'school', russian: 'школа', transcription: '(скул)' },
          { id: 'u6r1w2', english: 'classroom', russian: 'класс', transcription: '(класрум)' },
          { id: 'u6r1w3', english: 'teacher', russian: 'учитель', transcription: '(тичэр)' },
          { id: 'u6r1w4', english: 'student', russian: 'ученик', transcription: '(стьюдэнт)' },
          { id: 'u6r1w5', english: 'lesson', russian: 'урок', transcription: '(лэсэн)' },
        ],
      },
      {
        id: 'round6-2',
        name: 'Round 2',
        words: [
          { id: 'u6r2w1', english: 'book', russian: 'книга', transcription: '(бук)' },
          { id: 'u6r2w2', english: 'pen', russian: 'ручка', transcription: '(пэн)' },
          { id: 'u6r2w3', english: 'pencil', russian: 'карандаш', transcription: '(пэнсил)' },
          { id: 'u6r2w4', english: 'desk', russian: 'парта', transcription: '(дэск)' },
          { id: 'u6r2w5', english: 'chair', russian: 'стул', transcription: '(чэар)' },
        ],
      },
    ],
  },
  {
    id: 'unit7',
    name: 'Unit 7: House',
    rounds: [
      {
        id: 'round7-1',
        name: 'Round 1',
        words: [
          { id: 'u7r1w1', english: 'house', russian: 'дом', transcription: '(хаус)' },
          { id: 'u7r1w2', english: 'room', russian: 'комната', transcription: '(рум)' },
          { id: 'u7r1w3', english: 'kitchen', russian: 'кухня', transcription: '(китчэн)' },
          { id: 'u7r1w4', english: 'bedroom', russian: 'спальня', transcription: '(бэдрум)' },
          { id: 'u7r1w5', english: 'bathroom', russian: 'ванная', transcription: '(басрум)' },
        ],
      },
      {
        id: 'round7-2',
        name: 'Round 2',
        words: [
          { id: 'u7r2w1', english: 'window', russian: 'окно', transcription: '(уиндоу)' },
          { id: 'u7r2w2', english: 'door', russian: 'дверь', transcription: '(дор)' },
          { id: 'u7r2w3', english: 'table', russian: 'стол', transcription: '(тэйбл)' },
          { id: 'u7r2w4', english: 'bed', russian: 'кровать', transcription: '(бэд)' },
          { id: 'u7r2w5', english: 'chair', russian: 'стул', transcription: '(чэар)' }, // Duplicate chair from school, acceptable
        ],
      },
    ],
  },
  {
    id: 'unit8',
    name: 'Unit 8: Weather',
    rounds: [
      {
        id: 'round8-1',
        name: 'Round 1',
        words: [
          { id: 'u8r1w1', english: 'sunny', russian: 'солнечно', transcription: '(сани)' },
          { id: 'u8r1w2', english: 'rainy', russian: 'дождливо', transcription: '(рэйни)' },
          { id: 'u8r1w3', english: 'windy', russian: 'ветрено', transcription: '(уинди)' },
          { id: 'u8r1w4', english: 'cloudy', russian: 'облачно', transcription: '(клауди)' },
          { id: 'u8r1w5', english: 'snowy', russian: 'снежно', transcription: '(сноуи)' },
        ],
      },
      {
        id: 'round8-2',
        name: 'Round 2',
        words: [
          { id: 'u8r2w1', english: 'hot', russian: 'жарко', transcription: '(хот)' },
          { id: 'u8r2w2', english: 'cold', russian: 'холодно', transcription: '(колд)' },
          { id: 'u8r2w3', english: 'warm', russian: 'тепло', transcription: '(уорм)' },
          { id: 'u8r2w4', english: 'cool', russian: 'прохладно', transcription: '(кул)' },
          { id: 'u8r2w5', english: 'stormy', russian: 'штормовой', transcription: '(сторми)' },
        ],
      },
    ],
  },
  {
    id: 'unit9',
    name: 'Unit 9: Days of the Week',
    rounds: [
      {
        id: 'round9-1',
        name: 'Round 1',
        words: [
          { id: 'u9r1w1', english: 'Monday', russian: 'понедельник', transcription: '(мандэй)' },
          { id: 'u9r1w2', english: 'Tuesday', russian: 'вторник', transcription: '(тьюздэй)' },
          { id: 'u9r1w3', english: 'Wednesday', russian: 'среда', transcription: '(уэнздэй)' },
          { id: 'u9r1w4', english: 'Thursday', russian: 'четверг', transcription: '(сёздэй)' },
          { id: 'u9r1w5', english: 'Friday', russian: 'пятница', transcription: '(фрайдэй)' },
        ],
      },
      {
        id: 'round9-2',
        name: 'Round 2',
        words: [
          { id: 'u9r2w1', english: 'Saturday', russian: 'суббота', transcription: '(сэтэдэй)' },
          { id: 'u9r2w2', english: 'Sunday', russian: 'воскресенье', transcription: '(сандэй)' },
          { id: 'u9r2w3', english: 'today', russian: 'сегодня', transcription: '(тудэй)' },
          { id: 'u9r2w4', english: 'tomorrow', russian: 'завтра', transcription: '(тумороу)' },
          { id: 'u9r2w5', english: 'yesterday', russian: 'вчера', transcription: '(йестэдэй)' },
        ],
      },
    ],
  },
  {
    id: 'unit10',
    name: 'Unit 10: Hobbies',
    rounds: [
      {
        id: 'round10-1',
        name: 'Round 1',
        words: [
          { id: 'u10r1w1', english: 'reading', russian: 'чтение', transcription: '(ридинг)' },
          { id: 'u10r1w2', english: 'playing', russian: 'игра', transcription: '(плэинг)' },
          { id: 'u10r1w3', english: 'drawing', russian: 'рисование', transcription: '(дроинг)' },
          { id: 'u10r1w4', english: 'swimming', russian: 'плавание', transcription: '(суиминг)' },
          { id: 'u10r1w5', english: 'singing', russian: 'пение', transcription: '(сингинг)' },
        ],
      },
      {
        id: 'round10-2',
        name: 'Round 2',
        words: [
          { id: 'u10r2w1', english: 'dancing', russian: 'танцы', transcription: '(дэнсинг)' },
          { id: 'u10r2w2', english: 'cooking', russian: 'готовка', transcription: '(кукинг)' },
          { id: 'u10r2w3', english: 'running', russian: 'бег', transcription: '(ранинг)' },
          { id: 'u10r2w4', english: 'traveling', russian: 'путешествия', transcription: '(трэвэлинг)' },
          { id: 'u10r2w5', english: 'watching TV', russian: 'просмотр телевизора', transcription: '(уотчинг тиви)' },
        ],
      },
    ],
  },
];
