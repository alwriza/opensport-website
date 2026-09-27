# Avatar

Круглое изображение пользователя с фолбэком-инициалом.

Источник: `src/components/ui/avatar.tsx` (Radix `Avatar`, в RN не запускается
— переносится визуальный контракт), размеры из использования в
`src/pages/Ranking.tsx`.

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| src | string | нет | — |
| fallback | string (обычно первая буква имени) | да | — |
| size | "sm" \| "default" | нет | "default" |

## Варианты размеров

- default: `h-10 w-10` (2.5rem), встречается как базовый в shadcn-компоненте
- sm: `h-9 w-9` (2.25rem), используется в списках рейтинга

## Состояния

- normal: изображение по `src`
- fallback: если `src` не загрузилось или отсутствует — кружок с
  `bg-muted` (или `bg-primary/20` в варианте на странице рейтинга) и
  инициалом по центру

## NativeWind классы

```
// контейнер, default
className="relative h-10 w-10 overflow-hidden rounded-full shrink-0"

// контейнер, sm (как в списке рейтинга)
className="relative h-9 w-9 overflow-hidden rounded-full border border-border shrink-0"

// изображение
className="h-full w-full aspect-square"

// fallback
className="h-full w-full items-center justify-center rounded-full bg-muted"
// вариант на странице рейтинга: className="... bg-primary/20"
// текст фолбэка: className="text-primary text-xs font-semibold"
```

## Пример

```tsx
<Avatar size="sm">
  <AvatarImage src={player.avatarUrl} />
  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
</Avatar>
```
