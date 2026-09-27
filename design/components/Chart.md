# Chart

Радар-диаграмма навыков игрока. Единственный график в вебе.

Источник: `src/components/radar-chart.tsx` (обёртка над `recharts`).

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| data | { skill: string; score: number; fullMark: number }[] | да | — |

## Варианты

Один вариант: radar chart, ось 0–100.

## Состояния

Статичный, без loading/error состояний в вебе.

## Визуальный контракт (не NativeWind — это не разметка, а стилизация SVG-графика)

- сетка (`PolarGrid`): цвет `border` (hsl(217, 33%, 17%))
- подписи по кругу (`PolarAngleAxis`): цвет `foreground` (белый), fontSize 12
- подписи радиуса (`PolarRadiusAxis`): цвет `muted.foreground`, fontSize 10, домен 0–100
- заливка фигуры (`Radar`): цвет `primary` (hsl(123, 48%, 72%)), fillOpacity 0.2
- линия фигуры: цвет `primary`, strokeWidth 2
- точки на линии: заливка `primary`, strokeWidth 2, радиус 4
- высота контейнера: 300px, ширина 100%

## Пример (данные, не разметка)

```ts
const data = [
  { skill: "Скорость", score: 78, fullMark: 100 },
  { skill: "Дриблинг", score: 65, fullMark: 100 },
];
```

## Пропущено (см. gaps.md)

`recharts` не работает в React Native (использует SVG DOM API браузера).
Нужна замена на RN-совместимую библиотеку (например `victory-native` или
`react-native-svg`-based решение) с воспроизведением того же визуального
контракта.
