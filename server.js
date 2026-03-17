const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ── STATE (in-memory) ──
let board = {
  gridN: 8, startX: 1, startY: 1, startDir: 1,
  goalX: 6, goalY: 6,
  obstacles: [{ x: 3, y: 2 }, { x: 4, y: 5 }, { x: 2, y: 5 }],
  colorCells: [],
  task: 'Fahre zum Stern!'
};

// students: { name, slug, prog[], carX, carY, carDir, status, goalReached, running }
let students = {};

function slugify(name) {
  return name.toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getHost(req) {
  return req.headers.host || `localhost:${PORT}`;
}

// ── ROUTES ──
app.get('/', (req, res) => res.redirect('/lehrer'));

app.get('/lehrer', (req, res) => res.sendFile(path.join(__dirname, 'public', 'lehrer.html')));

app.get('/schueler/:slug', (req, res) => {
  const s = Object.values(students).find(s => s.slug === req.params.slug);
  if (!s) return res.status(404).send('Schüler nicht gefunden.');
  res.sendFile(path.join(__dirname, 'public', 'schueler.html'));
});

// API: get QR as data URL
app.get('/api/qr', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'missing url' });
  try {
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#1e293b', light: '#f8fafc' } });
    res.json({ qr: dataUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SOCKET.IO ──
io.on('connection', (socket) => {

  // ── LEHRER ──
  socket.on('lehrer:join', () => {
    socket.join('lehrer');
    socket.emit('state:board', board);
    socket.emit('state:students', Object.values(students));
  });

  socket.on('lehrer:update_board', (newBoard) => {
    board = { ...board, ...newBoard };
    io.emit('state:board', board); // push to all students
    io.to('lehrer').emit('state:board', board);
  });

  socket.on('lehrer:add_student', ({ name }) => {
    const slug = slugify(name) || 'schueler' + Date.now();
    if (students[slug]) { socket.emit('lehrer:error', 'Name bereits vergeben.'); return; }
    students[slug] = {
      name, slug,
      prog: [],
      carX: board.startX, carY: board.startY, carDir: board.startDir,
      status: 'bereit', goalReached: false, running: false
    };
    io.to('lehrer').emit('state:students', Object.values(students));
  });

  socket.on('lehrer:remove_student', ({ slug }) => {
    delete students[slug];
    io.to('lehrer').emit('state:students', Object.values(students));
  });

  socket.on('lehrer:reset_student', ({ slug }) => {
    if (!students[slug]) return;
    students[slug].carX = board.startX;
    students[slug].carY = board.startY;
    students[slug].carDir = board.startDir;
    students[slug].status = 'bereit';
    students[slug].goalReached = false;
    students[slug].running = false;
    io.to('schueler:' + slug).emit('student:reset');
    io.to('lehrer').emit('state:students', Object.values(students));
  });

  // ── SCHÜLER ──
  socket.on('schueler:join', ({ slug }) => {
    const s = students[slug];
    if (!s) { socket.emit('schueler:error', 'Nicht gefunden.'); return; }
    socket.join('schueler:' + slug);
    socket.data.slug = slug;
    socket.emit('state:board', board);
    socket.emit('schueler:init', s);
  });

  socket.on('schueler:update_prog', ({ slug, prog }) => {
    if (!students[slug]) return;
    students[slug].prog = prog;
    io.to('lehrer').emit('state:students', Object.values(students));
  });

  socket.on('schueler:update_car', ({ slug, x, y, dir, status, goalReached, running }) => {
    if (!students[slug]) return;
    Object.assign(students[slug], { carX: x, carY: y, carDir: dir, status, goalReached, running });
    io.to('lehrer').emit('state:students', Object.values(students));
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚗  Fahrzeug-Programmierer läuft!`);
  console.log(`👩‍🏫  Lehrer:  http://localhost:${PORT}/lehrer`);
  console.log(`📱  Im Netzwerk: http://[DEINE-IP]:${PORT}/lehrer\n`);
});
