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
  fs.readFile(cursosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler os cursos' });
    const cursos = JSON.parse(data || '[]');
    res.json(cursos);
  });
});

// Rota para criar novo curso
app.post('/api/cursos', (req, res) => {
  const { nome, descricao, imagem } = req.body;

  fs.readFile(cursosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler os cursos' });

    let cursos = [];
    try {
      cursos = JSON.parse(data || '[]');
    } catch (parseErr) {
      return res.status(500).json({ erro: 'Erro ao analisar cursos.json' });
    }

    const nomeSlug = slugify(nome);
    const novoCurso = {
      nome,
      slug: nomeSlug,
      descricao,
      imagem,
      link: `/Cursos/${nomeSlug}/index.html`
    };

    cursos.push(novoCurso);

    fs.writeFile(cursosPath, JSON.stringify(cursos, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar o curso' });

      const templateDir = path.join(__dirname, 'template');
      const templateHtml = path.join(templateDir, 'curso.html');
      const templateCss = path.join(templateDir, 'style.css');
      const templateJs = path.join(templateDir, 'scriptt.js');

      const newDir = path.join(__dirname, '..', 'Cursos', nomeSlug);
      const newHtml = path.join(newDir, 'index.html');
      const newCss = path.join(newDir, 'style.css');
      const newJs = path.join(newDir, 'scriptt.js');

      fs.mkdirSync(newDir, { recursive: true });
      fs.copyFileSync(templateHtml, newHtml);
      fs.copyFileSync(templateCss, newCss);
      fs.copyFileSync(templateJs, newJs);

      res.status(201).json({ mensagem: 'Curso criado com sucesso!' });
    });
  });

});

// Rota para obter um curso específico
app.get('/api/cursos/:slug', (req, res) => {
  const { slug } = req.params;

  fs.readFile(cursosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler os cursos' });

    const cursos = JSON.parse(data || '[]');
    const curso = cursos.find(c => c.slug === slug);

    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    res.json(curso);
  });
});

// Rota para adicionar capítulo de exercício
app.post('/api/cursos/:slug/adicionar-capitulo-exercicio', (req, res) => {
  const { slug } = req.params;
  const { titulo } = req.body;

  fs.readFile(cursosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler os cursos' });

    let cursos = JSON.parse(data || '[]');
    const curso = cursos.find(c => c.slug === slug);

    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (!curso.capitulosExercicios) curso.capitulosExercicios = [];

    curso.capitulosExercicios.push({
      titulo,
      exercicios: []
    });

    fs.writeFile(cursosPath, JSON.stringify(cursos, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar capítulo' });
      res.json({ mensagem: 'Capítulo adicionado com sucesso' });
    });
  });
});

// Rota para adicionar capítulo de vídeo
app.post('/api/cursos/:slug/adicionar-capitulo-video', (req, res) => {
  const { slug } = req.params;
  const { titulo } = req.body;

  fs.readFile(cursosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler os cursos' });

    let cursos = JSON.parse(data || '[]');
    const curso = cursos.find(c => c.slug === slug);

    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    if (!curso.capitulosVideos) curso.capitulosVideos = [];

    curso.capitulosVideos.push({
      titulo,
      videos: []
    });

    fs.writeFile(cursosPath, JSON.stringify(cursos, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar capítulo de vídeo' });
      res.json({ mensagem: 'Capítulo de vídeo adicionado com sucesso' });
    });
  });
});

// Rota para fazer upload de PDF em capítulo de exercício
app.post('/api/cursos/:slug/capitulo-exercicio/:capituloIndex/upload', upload.single('arquivo'), (req, res) => {
  const { slug, capituloIndex } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });

  fs.readFile(cursosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ erro: 'Erro ao ler os cursos' });

    let cursos = JSON.parse(data || '[]');
    const curso = cursos.find(c => c.slug === slug);
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });

    const capitulo = curso.capitulosExercicios?.[capituloIndex];
    if (!capitulo) return res.status(404).json({ erro: 'Capítulo não encontrado' });
//qualquer coisa mudar aqui obs:ignorar essa msg
    const relativePath = `/Cursos/${slug}/exercicios/${capituloIndex}/${file.filename}`;
    capitulo.exercicios.push(relativePath);

    fs.writeFile(cursosPath, JSON.stringify(cursos, null, 2), err => {
      if (err) return res.status(500).json({ erro: 'Erro ao salvar capítulo' });
      res.json({ mensagem: 'Exercício enviado com sucesso', caminho: relativePath });
    });
  });
});

// ✅ Rota corrigida: Adicionar vídeo a capítulo de vídeo
app.post('/api/cursos/:slug/capitulo-video/:index/adicionar-video', (req, res) => {
  const { slug, index } = req.params;
  const { url } = req.body;

  const cursos = JSON.parse(fs.readFileSync(cursosPath, 'utf-8'));

  const curso = cursos.find(c => c.slug === slug);
  if (!curso) return res.status(404).json({ mensagem: "Curso não encontrado" });

  const capitulo = curso.capitulosVideos?.[index];
  if (!capitulo) return res.status(404).json({ mensagem: "Capítulo não encontrado" });

  capitulo.videos = capitulo.videos || [];
  capitulo.videos.push(url);

  fs.writeFileSync(cursosPath, JSON.stringify(cursos, null, 2));
  res.json({ mensagem: "Vídeo adicionado com sucesso" });
});


// Fallback para index.html se você quiser SPA-style ou rota padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'home', 'index.html')); // ou outro HTML padrão
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

function slugify(str) {
  return str.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, '-')            // espaços para hífens
    .replace(/[^\w\-]+/g, '')        // remove caracteres especiais
    .replace(/\-\-+/g, '-');         // remove múltiplos hífens
}
