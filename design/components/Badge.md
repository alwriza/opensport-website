# Badge

Маленький ярлык-пилюля для статуса или категории.

Источник: `src/components/ui/badge.tsx`

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| variant | "default" \| "secondary" \| "destructive" \| "outline" | нет | "default" |
| children | ReactNode | да | — |

## Варианты

- default: `bg-primary text-black`
- secondary: `bg-secondary text-white`
- destructive: `bg-destructive text-white`
- outline: `border border-border text-foreground`, без заливки

## Состояния

Badge не интерактивен, состояний нажатия/disabled нет в вебе.

Паддинг: `px-2.5 py-0.5`. Радиус: `rounded-full`. Текст: `text-xs font-semibold`.

## NativeWind классы

```
// default
className="rounded-full px-2.5 py-0.5 bg-primary"
// текст: className="text-black text-xs font-semibold"

// secondary
className="rounded-full px-2.5 py-0.5 bg-secondary"
// текст: className="text-white text-xs font-semibold"

// destructive
className="rounded-full px-2.5 py-0.5 bg-destructive"
// текст: className="text-white text-xs font-semibold"

// outline
className="rounded-full px-2.5 py-0.5 border border-border"
// текст: className="text-foreground text-xs font-semibold"
```

## Пример

```tsx
<Badge variant="outline">U15</Badge>
<Badge variant="default">+50 XP</Badge>
```
