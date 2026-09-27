# Design system (mobile)

Извлечено из веб-приложения OpenSport для Expo + NativeWind. Ничего не
спроектировано заново — только значения, реально используемые в вебе.

## Токены

Все значения лежат в `design/tokens.ts`: `colors`, `gradients`,
`borderRadius`, `spacing`, `fontSize`, `fontWeight`, `fontFamily`.

Подключение в NativeWind (`tailwind.config.js` приложения):

```js
const tokens = require("./design/tokens");

module.exports = {
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: tokens.borderRadius,
      spacing: tokens.spacing,
      fontSize: tokens.fontSize,
      fontWeight: tokens.fontWeight,
      fontFamily: tokens.fontFamily,
    },
  },
};
```

`spacing`/`fontSize`/`fontWeight` в вебе не переопределены — это
стандартная шкала Tailwind, зафиксированная в токенах, чтобы не зависеть
от версии NativeWind.

## Правило 1: без произвольных значений

В коде экранов не должно быть цветов, отступов, радиусов и размеров
шрифта, которых нет в `tokens.ts`. Никаких `#fff`, `bg-[#93DA97]`,
`p-[13px]` и т.п. Если нужного значения нет в токенах — это либо повод
дополнить `gaps.md`, либо ошибка в дизайне, а не повод писать хардкод.

## Правило 2: нет компонента — остановиться

Если для экрана нужен компонент, которого нет в `design/components/`, —
остановиться и сообщить об этом, а не писать свою инлайновую реализацию
внутри экрана. Проверить `gaps.md`: возможно, отсутствие уже
зафиксировано и требует отдельного решения по дизайну.

## Как найти компонент

Смотреть `design/index.md` — список всех компонентов с ссылками на файлы
спецификаций в `design/components/`. Каждый файл: пропсы, варианты,
состояния, готовые классы NativeWind, один пример использования.

## Чего не хватает

`design/gaps.md` — компоненты и ассеты, которых нет в вебе, но нужны
приложению (иконка, splash, разрешения и т.д.).
