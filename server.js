// server.js
// Simple local server to save images and JSON data to disk.
// Usage: node server.js
// Serves static files from project folder and exposes APIs to upload images and save/read breakfast data.

const express = require('express');
const multer  = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// PROJECT_FOLDER: if you run node server.js from project folder, __dirname will be that folder.
// You can also set an explicit path if you want.
const PROJECT_FOLDER = path.resolve(__dirname);
const IMAGES_DIR = path.join(PROJECT_FOLDER, 'images');
const DATA_FILE = path.join(PROJECT_FOLDER, 'breakfasts.json');
const DELETED_FILE = path.join(PROJECT_FOLDER, 'deleted.json');

// ensure images dir exists
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// serve static files (index.html, style.css, script.js, images/, etc.)
app.use(express.static(PROJECT_FOLDER));

// multer config: save files to images dir
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMAGES_DIR);
  },
  filename: function (req, file, cb) {
    // safe filename: use name (if provided) + timestamp + original ext
    const safeBase = (req.body && req.body.name) ? req.body.name.replace(/\s+/g,'_').toLowerCase() : 'img';
    const ext = path.extname(file.originalname) || '.png';
    const filename = `${safeBase}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

// upload endpoint: accepts multipart/form-data with "image" file
app.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // return relative path for client to use as src
  const relPath = `images/${req.file.filename}`;
  res.json({ ok: true, path: relPath });
});

// read breakfasts.json
app.get('/data', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    // return empty array if not exists
    return res.json([]);
  }
  res.sendFile(DATA_FILE);
});

// write breakfasts.json (replace)
app.post('/save-data', (req, res) => {
  try {
    const data = req.body || [];
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// read deleted.json
app.get('/deleted', (req, res) => {
  if (!fs.existsSync(DELETED_FILE)) return res.json([]);
  res.sendFile(DELETED_FILE);
});

// write deleted.json
app.post('/save-deleted', (req, res) => {
  try {
    const data = req.body || [];
    fs.writeFileSync(DELETED_FILE, JSON.stringify(data, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// optional endpoint to append a breakfast to script.js (best-effort; modify at your own risk)
app.post('/append-to-scriptjs', (req, res) => {
  try {
    const breakfastObj = req.body;
    const scriptPath = path.join(PROJECT_FOLDER, 'script.js');
    if (!fs.existsSync(scriptPath)) return res.status(404).json({ ok: false, error: 'script.js not found' });
    let text = fs.readFileSync(scriptPath, 'utf8');

    // naive approach: find "DEFAULT_BREAKFASTS" array and append JSON before its closing bracket
    const match = text.match(/DEFAULT_BREAKFASTS\s*=\s*\[/);
    if (!match) return res.json({ ok: false, error: 'DEFAULT_BREAKFASTS array not found in script.js' });

    const startIdx = text.indexOf('[', match.index);
    // naive bracket match
    let depth = 0, endIdx = -1;
    for (let i = startIdx; i < text.length; i++) {
      if (text[i] === '[') depth++;
      else if (text[i] === ']') {
        depth--;
        if (depth === 0) { endIdx = i; break; }
      }
    }
    if (endIdx === -1) return res.json({ ok: false, error: 'Could not find end of DEFAULT_BREAKFASTS array' });

    // prepare object string (JSON)
    const objStr = JSON.stringify(breakfastObj, null, 2);
    // insert with comma if array non-empty
    const before = text.slice(0, endIdx).trimEnd();
    const addComma = before[before.length - 1] !== '[';
    const insert = (addComma ? ',\n' : '\n') + objStr + '\n';
    const newText = text.slice(0, endIdx) + insert + text.slice(endIdx);

    fs.writeFileSync(scriptPath, newText, 'utf8');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Local server running at http://localhost:${PORT} — serving ${PROJECT_FOLDER}`));
