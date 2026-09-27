# ProgressBar

Горизонтальный индикатор прогресса.

Источник: `src/components/ui/progress.tsx` (shadcn `Progress` поверх Radix, в
RN — Radix не работает, переносится только визуальный контракт).

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| value | number (0–100) | да | 0 |

## Варианты

Один визуальный вариант в вебе.

## Состояния

- normal: заполнение анимируется через `transition-all` при смене value
- 0%: индикатор полностью сдвинут влево (`translateX(-100%)`)
- 100%: индикатор занимает всю ширину
- loading/error: нет реализации в вебе

Высота: `h-4` (1rem). Радиус: `rounded-full` на обоих слоях (track и indicator).

## NativeWind классы

```
// track
className="relative h-4 w-full overflow-hidden rounded-full bg-secondary"

// indicator (ширина = value%, растёт слева направо; в вебе — через
// translateX на элементе 100%-й ширины, в RN проще задать width: `${value}%`)
className="h-full bg-primary rounded-full"
```

## Пример

```tsx
<View className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
  <View
    className="h-full bg-primary rounded-full"
    style={{ width: `${value}%` }}
  />
</View>
```
