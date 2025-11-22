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

const fs = require('fs');

// Получить всех пользователей
app.get("/api/users", (req, res) => {
  if (!fs.existsSync("users.json")) return res.json([]);
  const users = JSON.parse(fs.readFileSync("users.json"));
  res.json(users.map(u => ({ id: u.id, name: u.name })));
});

// Vercel требует экспорт функции:
module.exports = app;
