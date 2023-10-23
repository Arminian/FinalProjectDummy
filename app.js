const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/folder_for_pic', express.static('folder_for_pic'));

// Подключение к SQLite
const db = new sqlite3.Database('./imageKeywords.db');

// Создание таблицы, если её нет
db.run(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    keywords TEXT
  )
`);

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: './folder_for_pic',
  filename: (req, file, cb) => {
    const fileName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// Маршрут для загрузки файла и ключевых слов
app.post('/folder_for_pic', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('The file has not been loaded properly');
    }

    const keywords = req.body.keywords || '';

    // Вставка данных в таблицу SQLite
    db.run('INSERT INTO images (filename, keywords) VALUES (?, ?)', [req.file.filename, keywords]);

    console.log('File information:', req.file);
    res.send('File has been loaded successfully!');
  } catch (error) {
    console.error('File loading error:', error.message);
    res.status(500).send('There has been an error while loading your file.');
  }
});

app.get('/search', async (req, res) => {
    try {
      const searchKeywords = req.query.keywords || '';
      const keywordsArray = searchKeywords.split(',');
  
      const query = `
        SELECT * FROM images
        WHERE keywords LIKE ${keywordsArray.map(keyword => `'%${keyword}%'`).join(' OR ')}
      `;
  
      db.all(query, (err, rows) => {
        if (err) {
          throw err;
        }
  
        res.send(rows);
      });
    } catch (error) {
      console.error('Search error:', error.message);
      res.status(500).send('There has been an error while searching for a file.');
    }
  });

app.listen(port, () => {
  console.log(`Server is live on http://localhost:${port}`);
});
