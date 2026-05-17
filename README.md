# НАЗВАНИЕ КОМПАНИИ LLC

Простой демонстрационный сайт компании на HTML + CSS с небольшой SSR/pre-render сборкой на Node.js.


## Структура

- `src/content/` - данные сайта отдельными файлами: компания, контакты, меню, hero, услуги, новости, текст about.
- `src/styles/site.css` - стили сайта.
- `scripts/build.mjs` - собирает HTML-страницы в `dist/`.
- `scripts/serve.mjs` - запускает локальный сервер для папки `dist/`.
- `scripts/start.mjs` - собирает сайт и сразу запускает сервер.
- `public/assets/images/` - изображения сайта.
- `reference/triada-llc/` - исходный скан сайта-референса.

## Запуск одной командой

```bash
npm start
```

После запуска сайт будет доступен по адресу:

```text
http://127.0.0.1:8080/
```

## Отдельные команды

Только собрать сайт:

```bash
npm run build
```

Только запустить сервер для уже собранного `dist/`:

```bash
npm run serve
```

Запуск на другом порту:

```bash
PORT=3000 npm start
```

## Как менять контент

Основные файлы:

- `src/content/company.json` - название сайта, описание, цвета, favicon.
- `src/content/contacts.json` - адрес, телефон, email, карта, поля формы.
- `src/content/navigation.json` - пункты меню.
- `src/content/hero-slides.json` - слайды главного экрана.
- `src/content/services.json` - карточки услуг.
- `src/content/news.json` - новости.
- `src/content/about.md` - текст страницы о компании.

После изменений запусти:

```bash
npm start
```

## Публикация на GitHub Pages

В проект уже добавлен workflow:

```text
.github/workflows/deploy-pages.yml
```

Он собирает сайт командой `npm run build` и публикует папку `dist/` в GitHub Pages.

Шаги:

1. Создай новый репозиторий на GitHub.
2. Инициализируй git и отправь проект:

```bash
git init
git add .
git commit -m "Initial demo site"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

3. На GitHub открой `Settings` → `Pages`.
4. В `Build and deployment` выбери `Source: GitHub Actions`.
5. Открой вкладку `Actions` и дождись успешного workflow `Deploy GitHub Pages`.

После деплоя сайт будет доступен по адресу:

```text
https://<username>.github.io/<repo>/
```

Для обновления демо достаточно изменить файлы, сделать commit и push в `main`. GitHub Actions сам пересоберет и переопубликует сайт.

### Если workflow падает на `Configure Pages`

Если видишь ошибку вида:

```text
Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions
```

Проверь два пункта:

1. В `Settings` → `Pages` выбери `Source: GitHub Actions`.
2. В `Settings` → `Actions` → `General` → `Workflow permissions` включи `Read and write permissions`.

В workflow уже указано:

```yaml
with:
  enablement: true
```

Это позволяет `actions/configure-pages` создать или включить GitHub Pages site при первом деплое.
