# Card

Контейнер с фоном, рамкой и скруглением; составной компонент из 5 частей.

Источник: `src/components/ui/card.tsx`, утилита `.card-elevated` в `src/index.css`.

## Пропсы (составные части, не пропсы одного компонента)

| Часть | Назначение |
|---|---|
| Card | внешний контейнер |
| CardHeader | верхний блок, вертикальный стек с отступом |
| CardTitle | заголовок |
| CardDescription | подзаголовок, приглушённый цвет |
| CardContent | основное содержимое |
| CardFooter | нижний блок, горизонтальный |

## Варианты

- default (shadcn Card): `bg-card border rounded-xl`
- elevated (`.card-elevated`): `bg-card border border-gray-800/50 rounded-2xl`, при hover граница `border-primary/20`

## Состояния

Card не интерактивен по умолчанию. Hover-эффект (`hover-lift`, смена
границы) есть только в вебе как курсорная подсказка — на мобильном не
переносится, если карточка не тач-таргет.

## NativeWind классы

```
// Card
className="rounded-xl border border-border bg-card"

// CardHeader
className="flex flex-col gap-1.5 p-6"

// CardTitle
className="text-2xl font-semibold text-foreground"

// CardDescription
className="text-sm text-muted-foreground"

// CardContent
className="p-6 pt-0"

// CardFooter
className="flex-row items-center p-6 pt-0"

// вариант elevated
className="rounded-2xl border border-secondary/50 bg-card"
```

## Пример

```tsx
<Card>
  <CardHeader>
    <CardTitle>Тренировка</CardTitle>
    <CardDescription>12 упражнений</CardDescription>
  </CardHeader>
  <CardContent>
    <Text>Содержимое карточки</Text>
  </CardContent>
</Card>
```

## Пропущено (см. gaps.md)

Классы `shadow-card` и `hover-lift`, используемые в базовом `Card`, не
определены ни в `tailwind.config.ts`, ни в `src/index.css` — в текущей
сборке они не дают визуального эффекта. Тень не перенесена.
