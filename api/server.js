const express = require("express");
const app = express();
const server = require("http").Server(app);
const path = require("path");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Обслуживаем статические файлы
app.use(express.static(path.join(__dirname, "..")));

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Vercel требует экспорт функции:
module.exports = app;
