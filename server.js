
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // чтобы отдавать index.html и socket.io.js

// ============================
// Загрузка базы пользователей
// ============================
function loadUsers() {
  if (!fs.existsSync('users.json')) {
    fs.writeFileSync('users.json', '[]');
  }
  return JSON.parse(fs.readFileSync('users.json'));
}

// ============================
// Сохранение пользователей
// ============================
function saveUsers(users) {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// ============================
// Регистрация пользователя
// ============================
app.post('/register', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Введите имя и пароль' });
  }

  const users = loadUsers();
  const id = users.length + 1;

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id, name, password: hashedPassword };
  users.push(user);
  saveUsers(users);

  res.json({ message: 'Регистрация успешна', user: { id, name } });
});

// ============================
// Авторизация (вход)
// ============================
app.post('/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Введите имя и пароль' });
  }

  const users = loadUsers();
  const user = users.find(u => u.name === name);

  if (!user) {
    return res.status(401).json({ error: 'Неверное имя или пароль' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Неверное имя или пароль' });
  }

  res.json({ message: 'Вход успешен', user: { id: user.id, name: user.name } });
});

// ============================
// Загрузка базы сообщений
// ============================
function loadMessages() {
  if (!fs.existsSync('messages.json')) {
    fs.writeFileSync('messages.json', '[]');
  }
  return JSON.parse(fs.readFileSync('messages.json'));
}

// ============================
// Сохранение сообщений
// ============================
function saveMessages(messages) {
  fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));
}

// ============================
// Отправка сообщения по id
// ============================
app.post('/send', (req, res) => {
  const { fromId, toId, text } = req.body;

  if (!fromId || !toId || !text) {
    return res.status(400).json({ error: 'Введите fromId, toId и текст сообщения' });
  }

  const messages = loadMessages();
  const id = messages.length + 1;
  const message = { id, fromId, toId, text, timestamp: Date.now() };
  messages.push(message);
  saveMessages(messages);

  res.json({ message: 'Сообщение отправлено', data: message });
});

// ============================
// Получение сообщений между пользователями по id
// ============================
app.get('/messages', (req, res) => {
  const { user1Id, user2Id } = req.query;

  if (!user1Id || !user2Id) {
    return res.status(400).json({ error: 'Введите user1Id и user2Id' });
  }

  const messages = loadMessages();
  const chat = messages.filter(
    m =>
      (m.fromId == user1Id && m.toId == user2Id) ||
      (m.fromId == user2Id && m.toId == user1Id)
  );

  res.json(chat);
});

// ============================
// Получение всех пользователей
// ============================
app.get('/users', (req, res) => {
  const users = loadUsers();
  res.json(users);
});

// ============================
// Запуск сервера
// ============================
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

server.listen(8080, '0.0.0.0', () => {
  console.log('API и Socket.IO запущены на http://localhost:8080');
});

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  // Когда клиент отправляет сообщение
  socket.on('send_message', (data) => {
    // Сохраняем сообщение в messages.json
    const messages = loadMessages();
    const id = messages.length + 1;
    const message = {
      id,
      fromId: data.fromId,
      toId: data.toId,
      text: data.text,
      timestamp: Date.now()
    };
    messages.push(message);
    saveMessages(messages);

    // Отправляем сообщение всем клиентам
    io.emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
  });
});
