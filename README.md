# Cosmo Sim / Космо Сим

Cosmo Sim — lightweight browser-based space launch & management simulator.  
Космо Сим — лёгкий браузерный симулятор управления космодромом и запусков ракет.

---

## Table of Contents / Содержание

- [About / О проекте](#about--о-проекте)  
- [Features / Возможности](#features--возможности)  
- [Play / Как играть](#play--как-играть)  
- [Run locally / Запуск локально](#run-locally--запуск-локально)  
- [Development / Разработка](#development--разработка)  
- [File structure / Структура проекта](#file-structure--структура-проекта)  
- [Contributing / Вклад](#contributing--вклад)  
- [License / Лицензия](#license--лицензия)  
- [Contact / Контакты](#contact--контакты)

---

## About / О проекте

Cosmo Sim is a small, single-page web game where you manage a space program: build and upgrade rockets, research technologies, buy resources and run missions. The UI is responsive and animations (background stars and rocket) add a simple polished look.

Cosmo Sim — это небольшая одностраничная веб-игра: управляйте космической программой, стройте и улучшайте ракеты, исследуйте технологии, покупайте ресурсы и выполняйте миссии. Интерфейс адаптивный, фоновая анимация со звёздами и ракета добавляют визуального шарма.

---

## Features / Возможности

- Manage funds, fuel, parts, science and rocket parts  
- Build, upgrade, repair, edit and disassemble rockets  
- Research technologies that unlock missions and bonuses  
- Missions with prep/launch logic, success/failure, rewards and history log  
- Random events (grants, leaks, supplier deliveries, shop lockouts)  
- Notifications and achievement system  
- Responsive UI and simple canvas animations (stars and flying rocket)

- Управление деньгами, топливом, деталями, наукой и частями ракет  
- Строительство, улучшение, ремонт, редактирование и разбор ракет  
- Дерево технологий с бонусами и открытием миссий  
- Миссии с подготовкой, шансом успеха, наградами и историей событий  
- Случайные события (гранты, утечки топлива, поставки, закрытие магазина)  
- Уведомления и система достижений  
- Адаптивный интерфейс и простая анимация (звёзды и пролёт ракеты)

---

## Play / Как играть

- Open index.html in your browser (see Run locally).  
- Use the tabs to switch between the cosmodrome, missions, research tree, shop and stats.  
- Build rockets using the form in the "Cosmodrome" tab. Assign modules, repair or disassemble rockets.  
- Select missions to launch rockets. Missions cost fuel and parts but award money, science and reputation.  
- Research technologies to unlock new content and improve your program.  
- Save, load and reset progress using the footer buttons.

- Откройте index.html в браузере (см. ниже).  
- Переключайтесь между вкладками — Космодром, Миссии, Технологии, Магазин, Статистика.  
- Постройте ракету в форме на вкладке "Космодром". Назначайте модули, ремонтируйте или разбирайте ракеты.  
- Выбирайте миссии — они тратят топливо и детали, но при успешном выполнении дают деньги, науку и репутацию.  
- Исследуйте технологии, чтобы открывать новые миссии и бонусы.  
- Сохраняйте, загружайте и сбрасывайте прогресс через кнопки внизу страницы.

---

## Run locally / Запуск локально

This is a static site — the simplest way to run it:

1. Clone the repository:
   git clone https://github.com/SanMein/Cosmo.git

2. Open the folder and launch a simple HTTP server (recommended). Examples:

   - Python 3:
     python -m http.server 8000

   - Node (http-server):
     npx http-server -p 8000

3. Open http://localhost:8000 in your browser.

Notes:
- Directly opening `index.html` in some browsers can work, but using a local server avoids issues with some features (CORS, file paths) and is best practice for development.

Это статический сайт — запустить очень просто:

1. Клонируйте репозиторий:
   git clone https://github.com/SanMein/Cosmo.git

2. Перейдите в папку и запустите локальный HTTP-сервер:

   - Python 3:
     python -m http.server 8000

   - Node (http-server):
     npx http-server -p 8000

3. Откройте в браузере http://localhost:8000

Примечание:
- В некоторых случаях можно открыть `index.html` напрямую, но запуск через сервер решает возможные проблемы с путями и браузерными ограничениями.

---

## Development / Разработка

Tech stack:
- HTML, CSS, plain JavaScript (ES6+)  
- No build tools or dependencies required — everything is client-side.

Key scripts:
- js/state.js — game data, state and save/load logic  
- js/render.js — DOM rendering functions for each panel  
- js/rockets.js — rocket-related UI and interactions  
- js/missions.js — mission execution, automation and random events  
- js/shop.js — resource purchases, upgrades and tech activation  
- js/canvas.js — background & rocket animations  
- js/utils.js — helper functions and notifications

If you plan to extend:
- Keep UI rendering stateless: update `state` then call `renderAll()`  
- Save format versioning: STORAGE_KEY and `defaultState.version` exist for migration  
- Add small unit tests around pure utilities (formatTime, getRandomWeighted) if needed

Технологии:
- HTML, CSS, чистый JavaScript (ES6+)  
- Без сборщиков и зависимостей — весь код клиентский.

Основные файлы:
- js/state.js — данные игры, состояние и логика сохранения  
- js/render.js — функции отрисовки интерфейса  
- js/rockets.js — действия и диалоги, связанные с ракетами  
- js/missions.js — выполнение миссий, автозапуск, случайные события  
- js/shop.js — покупки и активация модулей  
- js/canvas.js — фоновая анимация и анимация ракеты  
- js/utils.js — утилиты и уведомления

Если будете дорабатывать:
- Сохраняйте модель рендера: меняете state — вызываете renderAll()  
- В версии сохранения учитывайте STORAGE_KEY и версию внутри defaultState для миграций  
- Добавьте тесты для чистых утилит (formatTime, getRandomWeighted) по необходимости

---

## File structure / Структура проекта

- index.html — single page app layout  
- style.css — styles and responsive layout  
- js/ — game scripts
  - state.js
  - utils.js
  - dom.js
  - render.js
  - canvas.js
  - rockets.js
  - missions.js
  - shop.js
  - main.js

- index.html — основной файл приложения  
- style.css — стили  
- js/ — скрипты игры (см. выше)

---

## Contributing / Вклад

Contributions are welcome! Suggestions:
- Open an issue describing the feature/bug with steps to reproduce.  
- Fork the repo, create a branch, implement changes and open a pull request.  
- If you change save format or add migrations, bump the save version and provide upgrade logic.

Буду рад вкладaм! Рекомендации:
- Откройте issue с описанием ошибки или фичи и шагами для воспроизведения.  
- Форкните репозиторий, создайте ветку, внесите изменения и откройте pull request.  
- При изменении формата сохранений увеличьте версию и добавьте логику миграции.

---

## License / Лицензия

This project is provided without an explicit license. If you want permissive reuse, consider applying the MIT license.  
(If you are the repository owner and want a specific license added, I can prepare a LICENSE file.)

Проект пока без явной лицензии. Для свободного использования удобно применить MIT.  
(Если вы — владелец репозитория и хотите конкретную лицензию, могу добавить файл LICENSE.)

---

## Contact / Контакты

Repository: https://github.com/SanMein/Cosmo
Reddit: https://www.reddit.com/r/CosmoSM/

Репозиторий: https://github.com/SanMein/Cosmo
Реддит: https://www.reddit.com/r/CosmoSM/
