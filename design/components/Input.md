# Input

Однострочное текстовое поле.

Источник: `src/components/ui/input.tsx`, утилита `.input-field` в `src/index.css`.

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| value | string | да | — |
| onChangeText | function | да | — |
| placeholder | string | нет | — |
| editable | boolean | нет | true |
| keyboardType | string (RN-специфичный, не из веба) | нет | "default" |

## Варианты

Один визуальный вариант в вебе (shadcn `Input`), плюс альтернативная
утилита `.input-field`, используемая в некоторых формах — отличается
паддингом и радиусом. Обе задокументированы ниже.

## Состояния

- normal: `border border-input bg-background`
- focus: `ring-2 ring-ring`, граница `border-input` не меняется
- disabled: `opacity-50`, ввод заблокирован
- placeholder: `placeholder:text-muted-foreground`
- ошибка: нет реализации в вебе — см. gaps.md

Высота: `h-10` (2.5rem). Радиус: `rounded-md` (borderRadius.md = 0.75rem).

## NativeWind классы

```
// shadcn Input (базовый)
className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
// placeholder: placeholderTextColor соответствует muted.foreground

// focus (управляется вручную через состояние, RN не имеет :focus-visible)
className="h-10 w-full rounded-md border-2 border-ring bg-background px-3 py-2 text-base text-foreground"

// disabled
className="opacity-50"

// вариант .input-field (используется в формах регистрации/тренировок)
className="rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-base text-foreground"
// rounded-xl = 0.75rem (borderRadius.md), фон и рамка — оттенок secondary
```

## Пример

```tsx
<Input
  value={email}
  onChangeText={setEmail}
  placeholder="Email"
  keyboardType="email-address"
/>
```

## Пропущено (см. gaps.md)

Состояние ошибки (красная рамка, текст под полем) нигде в вебе не
реализовано как часть Input — есть только `destructive` цвет в токенах.
