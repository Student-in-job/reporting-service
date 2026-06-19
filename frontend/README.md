# Finsolve Reports — фронт

SPA для backend-сервиса [report-service](../report-service). Унифицированный рендер отчётов на основе метаописания (`columns + data`), 4 типа визуализации.

## Стек

- **Vue 3** + **TypeScript** + **Vite**
- **Naive UI** + **SCSS** (глобальные `_variables` / `_mixins` через `additionalData`)
- **Pinia** — auth, UI
- **Vue Router 4/5** — роутинг + гарды по роли
- **TanStack Query** — кеш и инвалидация серверного состояния
- **vue-echarts** — bar / pie / scatter
- **openapi-typescript** — генерация типов из бэка

## Запуск

```bash
yarn install
yarn dev          # http://localhost:5173 (proxy /api → :8000)
yarn build        # production bundle в dist/
yarn type-check   # vue-tsc без эмита
yarn gen:api      # типы из http://localhost:8000/openapi.json
```

`.env`:

```
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY=http://localhost:8000
```

## Структура (FSD-lite)

```
src/
├── app/             # theme, провайдеры
├── pages/           # маршрутные страницы
│   ├── LoginPage.vue
│   ├── ReportsListPage.vue
│   ├── ReportViewPage.vue
│   └── admin/
├── widgets/         # композиции (AppLayout, ReportRenderer)
├── features/
│   ├── auth/
│   ├── filters-engine/      # FilterBar — форма из config.filters[]
│   ├── report-runner/
│   └── viz/                  # TableViz, ChartViz
├── entities/        # доменные типы (Report, User, Datasource)
├── shared/
│   ├── api/         # http-клиент + endpoints
│   ├── lib/         # форматтеры
│   ├── ui/
│   └── config/
├── stores/          # Pinia
├── router/
└── styles/          # _variables, _mixins, main
```

## Архитектура

**Унифицированный рендер.** Бэк отдаёт `{ type, columns, data }`. Клиент:

1. `<FilterBar>` строит форму из `config.filters[]` — добавление нового фильтра на бэке = ноль строк здесь.
2. `<ReportRenderer>` по `report.type` выбирает виз-компонент: `table` → `<TableViz>`, остальное → `<ChartViz>`.
3. Ячейки форматируются по `columns[].type` (`number` / `date` / `datetime` / `boolean` / `string`).

Добавление нового отчёта на бэке = ноль строк на фронте.

## Auth

JWT в `localStorage`. Перехватчик `client.ts` подставляет `Authorization`. На `401` — редирект на `/login` с `redirect=...`. Гард `router.beforeEach` блокирует приватные роуты и проверяет `meta.role === 'admin'`.

## Темы

Naive `n-config-provider` с `themeOverrides` (`src/app/theme.ts`). Переключатель в `useUiStore`. Цвета компонентов — через CSS-переменные Naive (`var(--text-color)` и т.п.), отступы/брейкпоинты — через SCSS-переменные.

## Что готово в MVP

- [x] Login + JWT + guards
- [x] Layout с sidebar (n-menu, динамическое меню из API)
- [x] Список отчётов с группами
- [x] Страница отчёта: фильтры → запуск → таблица + графики
- [x] Темизация (light/dark)

## TODO

- [ ] Админка: CRUD отчётов с Monaco SQL-редактором
- [ ] Админка: CRUD источников + проверка подключения
- [ ] Экспорт в CSV/XLSX
- [ ] Виртуализация таблиц на больших датасетах
- [ ] Сохранённые наборы фильтров
