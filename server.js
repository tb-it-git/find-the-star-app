const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const QRCode  = require('qrcode');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

// ── DEMO SPIELPLAN (6×6, einfacher Einstieg) ──
let board = {
  gridN: 6,
  startX: 1, startY: 5, startDir: 0,
  goalX: 5, goalY: 0,
  obstacles: [{x:3,y:1},{x:2,y:3}],
  colorCells: [],
  task: 'Fahre vom Start (►) zum Stern (★)!',
  // Modus: 'drive' | 'paint'  – Lehrer schaltet um
  mode: 'drive',
  // Vorlage für Malen-Modus (optional, kann leer bleiben)
  pattern: []
};

let students = {};

function slugify(n){ return n.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

app.get('/',           (_, res) => res.redirect('/lehrer'));
app.get('/lehrer',     (_, res) => res.sendFile(path.join(__dirname,'public','lehrer.html')));
app.get('/schueler/:slug', (req, res) => {
  if (!Object.values(students).find(s=>s.slug===req.params.slug))
    return res.status(404).send('Schüler nicht gefunden.');
  res.sendFile(path.join(__dirname,'public','schueler.html'));
});
app.get('/api/qr', async (req, res) => {
  try {
    const qr = await QRCode.toDataURL(req.query.url, {width:200,margin:1,color:{dark:'#1e293b',light:'#f8fafc'}});
    res.json({qr});
  } catch(e){ res.status(500).json({error:e.message}); }
});

io.on('connection', socket => {

  socket.on('lehrer:join', () => {
    socket.join('lehrer');
    socket.emit('state:board', board);
    socket.emit('state:students', Object.values(students));
  });

  socket.on('lehrer:update_board', nb => {
    board = {...board, ...nb};
    io.emit('state:board', board);
  });

  socket.on('lehrer:add_student', ({name}) => {
    const slug = slugify(name) || 'schueler'+Date.now();
    if (students[slug]){ socket.emit('lehrer:error','Name bereits vergeben.'); return; }
    students[slug] = {name, slug, prog:[], painted:[], carX:board.startX, carY:board.startY, carDir:board.startDir, status:'bereit', running:false};
    io.to('lehrer').emit('state:students', Object.values(students));
  });

  socket.on('lehrer:remove_student', ({slug}) => {
    delete students[slug];
    io.to('lehrer').emit('state:students', Object.values(students));
  });

  socket.on('lehrer:reset_student', ({slug}) => {
    if (!students[slug]) return;
    Object.assign(students[slug], {carX:board.startX, carY:board.startY, carDir:board.startDir, status:'bereit', running:false, painted:[]});
    io.to('schueler:'+slug).emit('student:reset');
    io.to('lehrer').emit('state:students', Object.values(students));
  });

  socket.on('schueler:join', ({slug}) => {
    const s = students[slug];
    if (!s){ socket.emit('schueler:error','Nicht gefunden.'); return; }
    socket.join('schueler:'+slug);
    socket.data.slug = slug;
    socket.emit('state:board', board);
    socket.emit('schueler:init', s);
  });

  socket.on('schueler:update_prog',   ({slug,prog})    => { if(students[slug]){ students[slug].prog=prog;    io.to('lehrer').emit('state:students',Object.values(students)); }});
  socket.on('schueler:update_painted',({slug,painted})  => { if(students[slug]){ students[slug].painted=painted; io.to('lehrer').emit('state:students',Object.values(students)); }});
  socket.on('schueler:update_car',    ({slug,x,y,dir,status,running}) => {
    if (!students[slug]) return;
    Object.assign(students[slug], {carX:x, carY:y, carDir:dir, status, running});
    io.to('lehrer').emit('state:students', Object.values(students));
  });
});

app.use(express.static(path.join(__dirname,'public')));
server.listen(PORT,'0.0.0.0',()=>{
  console.log(`\n🚗  Fahrzeug-Programmierer läuft!`);
  console.log(`👩‍🏫  Lehrer:  http://localhost:${PORT}/lehrer\n`);
});
