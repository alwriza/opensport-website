# Button

Тач-элемент действия с 8 вариантами и 4 размерами.

Источник: `src/components/ui/button.tsx`

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| variant | "default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link" \| "premium" \| "glass" | нет | "default" |
| size | "default" \| "sm" \| "lg" \| "icon" | нет | "default" |
| disabled | boolean | нет | false |
| onPress | function | да | — |
| children | ReactNode | да | — |

## Варианты (рабочие, есть в tokens.ts)

- default: `bg-primary text-black` (primary.DEFAULT / primary.foreground)
- destructive: `bg-destructive text-white`
- outline: `border-2 border-primary bg-transparent text-primary`
- secondary: `bg-secondary text-white`
- ghost: `bg-transparent`, фон появляется только в состоянии pressed
- link: `text-primary underline`, без фона и паддингов

## Размеры

- default: `h-11 px-6` (h-11 = 2.75rem, px-6 = 1.5rem)
- sm: `h-9 px-4` (h-9 = 2.25rem, px-4 = 1rem), текст text-xs
- lg: `h-13 px-10` (h-13 = 3.25rem — нестандартное значение Tailwind, оставлено как есть), text-base
- icon: `h-11 w-11` квадратная кнопка под иконку

## Состояния

- normal: как в варианте выше
- pressed: `scale-95` (только default и premium варианты используют scale в вебе через hover/active)
- disabled: `opacity-50`, `pointer-events-none`
- loading: нет реализации в вебе — см. gaps.md

Радиус: `rounded-lg` (borderRadius.md = 0.75rem).

## NativeWind классы

```
// variant=default, size=default
className="flex-row items-center justify-center gap-2 rounded-lg h-11 px-6 bg-primary"
// текст: className="text-black font-semibold text-sm"

// variant=destructive
className="flex-row items-center justify-center gap-2 rounded-lg h-11 px-6 bg-destructive"
// текст: className="text-white font-semibold text-sm"

// variant=outline
className="flex-row items-center justify-center gap-2 rounded-lg h-11 px-6 border-2 border-primary bg-transparent"
// текст: className="text-primary font-semibold text-sm"

// variant=secondary
className="flex-row items-center justify-center gap-2 rounded-lg h-11 px-6 bg-secondary"
// текст: className="text-white font-semibold text-sm"

// variant=ghost
className="flex-row items-center justify-center gap-2 rounded-lg h-11 px-6"
// pressed: className="bg-muted"

// disabled (любой вариант)
className="opacity-50"
```

## Пример

```tsx
<Button variant="default" size="default" onPress={handleSubmit}>
  Сохранить
</Button>

<Button variant="outline" size="sm" disabled={isSaving}>
  Отмена
</Button>
```

## Пропущено (см. gaps.md)

`premium` и `glass` варианты используют классы `bg-gradient-premium`,
`shadow-premium`, `shadow-hero`, `glass-card`, которых нет ни в
`tailwind.config.ts`, ни в `src/index.css` — в текущей сборке эти классы не
резолвятся ни в какое значение. Не переносить без уточнения дизайна.
