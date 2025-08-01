// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require("mysql");
const cors = require("cors");
const app = express();
const PORT = 3000;
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'seuSegredoSuperSecreto';


const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "autoriaweb",
});

app.use(express.json());
app.use(cors());
// Serve os arquivos estáticos das páginas HTML
app.use('/Cursos', express.static(path.join(__dirname, '..', 'Cursos')));
app.use(express.static(path.join(__dirname, '..', 'cadastro')));
app.use(express.static(path.join(__dirname, '..', 'login')));
app.use(express.static(path.join(__dirname, '..', 'perfil')));
app.use(express.static(path.join(__dirname, '..', 'home')));

app.post('/api/cadastro', async (req, res) => {
  const { nome, sobrenome, email, telefone, senha } = req.body;
  if (!nome || !sobrenome || !email || !telefone || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const nomeCompleto = `${nome} ${sobrenome}`;
    const tipo_usuario = "estudante";

    const sql = `
        INSERT INTO usuarios (nome, email, telefone, senha_hash, tipo_usuario)
        VALUES (?, ?, ?, ?, ?)
      `;
    db.query(sql, [nomeCompleto, email, telefone, senhaHash, tipo_usuario], (err) => {
      if (err) {
        console.error("Erro ao inserir usuário:", err);
        return res.status(500).json({ error: "Erro ao cadastrar." });
      }
      res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
    });
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  const sql = "SELECT id, nome, email, telefone, senha_hash, tipo_usuario FROM usuarios WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Erro no query de login:", err);
      return res.status(500).json({ error: "Erro no servidor." });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const user = results[0];
    const match = await bcrypt.compare(senha, user.senha_hash);
    if (!match) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  });
});


function autenticarJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Token não fornecido." });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido." });
    req.userId = decoded.id;
    next();
  });
}

app.get('/api/perfil', autenticarJWT, (req, res) => {
  const sql = "SELECT nome, email, telefone, tipo_usuario FROM usuarios WHERE id = ?";
  db.query(sql, [req.userId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar perfil:", err);
      return res.status(500).json({ error: "Erro no servidor." });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.json(results[0]);
  });
});



const cursosPath = path.join(__dirname, 'data', 'cursos.json');

// Configuração de onde os PDFs serão salvos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const slug = req.params.slug;
    const capituloIndex = req.params.capituloIndex;
    const dir = path.join(__dirname, '..', 'Cursos', slug, 'exercicios', capituloIndex);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Rota para obter todos os cursos
app.get('/api/cursos', (req, res) => {
  const sql = 'SELECT * FROM cursos';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar cursos' });
    res.json(results);
  });
});


// Rota para criar novo curso
app.post('/api/cursos', (req, res) => {
  const { nome, descricao, imagem } = req.body;
  const slug = slugify(nome);
  const link = `/Cursos/${slug}/index.html`;

  const sql = `INSERT INTO cursos (nome, slug, descricao, imagem, link) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [nome, slug, descricao, imagem, link], (err, result) => {
    if (err) {
      console.error('Erro ao criar curso:', err);
      return res.status(500).json({ erro: 'Erro ao criar curso' });
    }

    const cursoId = result.insertId;
    const newDir = path.join(__dirname, '..', 'Cursos', slug);
    const templateDir = path.join(__dirname, 'template');

    fs.mkdirSync(newDir, { recursive: true });
    fs.copyFileSync(path.join(templateDir, 'curso.html'), path.join(newDir, 'index.html'));
    fs.copyFileSync(path.join(templateDir, 'style.css'), path.join(newDir, 'style.css'));
    fs.copyFileSync(path.join(templateDir, 'scriptt.js'), path.join(newDir, 'scriptt.js'));

    res.status(201).json({ mensagem: 'Curso criado com sucesso!', id: cursoId });
  });
});


// Rota para obter um curso específico
app.get('/api/cursos/:slug', (req, res) => {
  const { slug } = req.params;

  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err || cursos.length === 0) return res.status(404).json({ erro: 'Curso não encontrado' });

    const cursoId = cursos[0].id;

    const sqlEx = `
      SELECT ce.id AS capitulo_id, ce.titulo, e.caminho
      FROM capitulos_exercicios ce
      LEFT JOIN exercicios e ON e.capitulo_id = ce.id
      WHERE ce.curso_id = ?
    `;

    const sqlVid = `
      SELECT cv.id AS capitulo_id, cv.titulo, v.url
      FROM capitulos_videos cv
      LEFT JOIN videos v ON v.capitulo_id = cv.id
      WHERE cv.curso_id = ?
    `;

    db.query(sqlEx, [cursoId], (err, exResults) => {
      if (err) return res.status(500).json({ erro: 'Erro ao buscar exercícios' });

      const capitulosExercicios = [];
      const mapEx = new Map();

      exResults.forEach(row => {
        if (!mapEx.has(row.capitulo_id)) {
          mapEx.set(row.capitulo_id, { titulo: row.titulo, exercicios: [] });
        }
        if (row.caminho) {
          mapEx.get(row.capitulo_id).exercicios.push(row.caminho);
        }
      });

      for (const item of mapEx.values()) {
        capitulosExercicios.push(item);
      }

      db.query(sqlVid, [cursoId], (err, vidResults) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar vídeos' });

        const capitulosVideos = [];
        const mapVid = new Map();

        vidResults.forEach(row => {
          if (!mapVid.has(row.capitulo_id)) {
            mapVid.set(row.capitulo_id, { titulo: row.titulo, videos: [] });
          }
          if (row.url) {
            mapVid.get(row.capitulo_id).videos.push(row.url);
          }
        });

        for (const item of mapVid.values()) {
          capitulosVideos.push(item);
        }

        res.json({ capitulosExercicios, capitulosVideos });
      });
    });
  });
});



// Rota para adicionar capítulo de exercício
app.post('/api/cursos/:slug/adicionar-capitulo-exercicio', (req, res) => {
  const { slug } = req.params;
  const { titulo } = req.body;

  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err || cursos.length === 0) return res.status(404).json({ erro: 'Curso não encontrado' });

    const cursoId = cursos[0].id;
    const sqlInsert = 'INSERT INTO capitulos_exercicios (curso_id, titulo) VALUES (?, ?)';
    db.query(sqlInsert, [cursoId, titulo], (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao adicionar capítulo' });
      res.json({ mensagem: 'Capítulo de exercício adicionado com sucesso' });
    });
  });
});


// Rota para adicionar capítulo de vídeo
app.post('/api/cursos/:slug/adicionar-capitulo-video', (req, res) => {
  const { slug } = req.params;
  const { titulo } = req.body;

  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err || cursos.length === 0) return res.status(404).json({ erro: 'Curso não encontrado' });

    const cursoId = cursos[0].id;
    const sqlInsert = 'INSERT INTO capitulos_videos (curso_id, titulo) VALUES (?, ?)';
    db.query(sqlInsert, [cursoId, titulo], (err) => {
      if (err) return res.status(500).json({ erro: 'Erro ao adicionar capítulo de vídeo' });
      res.json({ mensagem: 'Capítulo de vídeo adicionado com sucesso' });
    });
  });
});


// Rota para fazer upload de PDF em capítulo de exercício
app.post('/api/cursos/:slug/capitulo-exercicio/:capituloIndex/upload', upload.single('arquivo'), (req, res) => {
  const { slug, capituloIndex } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });

  const relativePath = `/Cursos/${slug}/exercicios/${capituloIndex}/${file.filename}`;

  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err || cursos.length === 0) return res.status(404).json({ erro: 'Curso não encontrado' });

    const cursoId = cursos[0].id;
    const sqlCapitulos = 'SELECT id FROM capitulos_exercicios WHERE curso_id = ? LIMIT 1 OFFSET ?';
    db.query(sqlCapitulos, [cursoId, parseInt(capituloIndex)], (err, caps) => {
      if (err || caps.length === 0) return res.status(404).json({ erro: 'Capítulo não encontrado' });

      const capituloId = caps[0].id;
      const sqlInsert = 'INSERT INTO exercicios (capitulo_id, caminho) VALUES (?, ?)';
      db.query(sqlInsert, [capituloId, relativePath], (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao salvar exercício' });
        res.json({ mensagem: 'Exercício enviado com sucesso', caminho: relativePath });
      });
    });
  });
});


// ✅ Rota corrigida: Adicionar vídeo a capítulo de vídeo
app.post('/api/cursos/:slug/capitulo-video/:index/adicionar-video', (req, res) => {
  const { slug, index } = req.params;
  const { url } = req.body;

  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err || cursos.length === 0) return res.status(404).json({ mensagem: 'Curso não encontrado' });

    const cursoId = cursos[0].id;
    const sqlCapitulos = 'SELECT id FROM capitulos_videos WHERE curso_id = ? LIMIT 1 OFFSET ?';
    db.query(sqlCapitulos, [cursoId, parseInt(index)], (err, caps) => {
      if (err || caps.length === 0) return res.status(404).json({ mensagem: 'Capítulo não encontrado' });

      const capituloId = caps[0].id;
      const sqlInsert = 'INSERT INTO videos (capitulo_id, url) VALUES (?, ?)';
      db.query(sqlInsert, [capituloId, url], (err) => {
        if (err) return res.status(500).json({ mensagem: 'Erro ao salvar vídeo' });
        res.json({ mensagem: 'Vídeo adicionado com sucesso' });
      });
    });
  });
});


function slugify(str) {
  return str.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, '-')            // espaços para hífens
    .replace(/[^\w\-]+/g, '')        // remove caracteres especiais
    .replace(/\-\-+/g, '-');         // remove múltiplos hífens
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
