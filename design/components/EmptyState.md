# EmptyState

Заглушка для пустого раздела: иконка в круге, заголовок, описание, кнопка
действия. Не отдельный компонент в вебе — повторяющийся паттерн.

Источник: `src/pages/PlayerDashboard.tsx` (`~L953-970`, пустое состояние
последнего анализа).

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| icon | ReactNode | да | — |
| title | string | да | — |
| description | string | нет | — |
| actionLabel | string | нет | — |
| onAction | function | нет | — |

## Варианты

Один вариант в вебе.

## Состояния

Статичный, без интерактивных состояний кроме кнопки действия (см. Button.md).

## NativeWind классы

```
// внешний контейнер (пунктирная рамка + акцентный фон)
className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 items-center justify-center p-6"

// круг под иконку
className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6"
// иконка внутри: размер 48x48 (h-12 w-12), цвет primary

// заголовок
className="text-2xl font-bold mb-3 text-center text-foreground"

// описание
className="text-muted-foreground mb-10 text-center text-lg"

// кнопка действия — rounded-full, h-14, px-12, bg-primary text-black
// (см. Button.md, размер не входит в стандартную шкалу size)
className="rounded-full px-12 h-14 bg-primary items-center justify-center flex-row"
```

## Пример

```tsx
<View className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 items-center justify-center p-6">
  <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
    <UploadIcon size={48} color={colors.primary.DEFAULT} />
  </View>
  <Text className="text-2xl font-bold mb-3 text-center text-foreground">Нет анализов</Text>
  <Text className="text-muted-foreground mb-10 text-center text-lg">
    Загрузите видео, чтобы получить первый анализ
  </Text>
  <Pressable className="rounded-full px-12 h-14 bg-primary items-center justify-center flex-row" onPress={onUpload}>
    <Text className="text-black font-bold text-lg">Загрузить</Text>
  </Pressable>
</View>
```
