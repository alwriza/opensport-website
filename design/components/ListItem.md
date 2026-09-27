# ListItem

Строка списка: аватар + имя/подзаголовок + правый контент. Не отдельный
компонент в вебе — паттерн, повторяющийся в строках таблицы рейтинга.

Источник: `src/pages/Ranking.tsx` (строки таблицы, `~L484-511`).

## Пропсы

| Имя | Тип | Обязателен | Дефолт |
|---|---|---|---|
| avatarUrl | string | нет | — |
| title | string | да | — |
| subtitle | string | нет | — |
| trailing | ReactNode | нет | — |
| onPress | function | нет | — |

## Варианты

Один вариант в вебе: аватар слева, заголовок + подзаголовок по центру
(усечение текста), произвольный контент справа (бейдж, значение, стрелка).

## Состояния

- normal: `border-b border-border`
- pressed/hover: `bg-white/5` (в вебе — hover, на мобильном — pressed)
- active/selected: `bg-primary/5` (используется для выделения выбранной строки)

## NativeWind классы

```
// контейнер строки
className="flex-row items-center gap-3 p-3 border-b border-border"
// pressed: className="bg-white/5"
// selected: className="bg-primary/5"

// текстовый блок
className="flex-1 min-w-0"
// заголовок
className="font-semibold text-foreground" // numberOfLines={1} вместо truncate
// подзаголовок
className="text-xs text-muted-foreground"
```

## Пример

```tsx
<Pressable className="flex-row items-center gap-3 p-3 border-b border-border">
  <Avatar size="sm">
    <AvatarImage src={player.avatarUrl} />
    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
  </Avatar>
  <View className="flex-1 min-w-0">
    <Text className="font-semibold text-foreground" numberOfLines={1}>{player.name}</Text>
    <Text className="text-xs text-muted-foreground">{player.position}</Text>
  </View>
  <Badge variant="outline">U{player.age}</Badge>
</Pressable>
```
