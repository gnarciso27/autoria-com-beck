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

/////

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "autoriaweb",
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// Serve os arquivos estáticos das páginas HTML
app.use('/Cursos', express.static(path.join(__dirname, '..', 'Cursos')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'cadastro')));
app.use(express.static(path.join(__dirname, '..', 'login')));
app.use(express.static(path.join(__dirname, '..', 'perfil')));
app.use(express.static(path.join(__dirname, '..', 'home')));
app.use(express.static(path.join(__dirname, 'public')));

/////////// Verificar se é professor

function verificarProfessor(req, res, next) {
  const sql = "SELECT tipo_usuario FROM usuarios WHERE id = ?";
  db.query(sql, [req.userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });
    if (results.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });

    const user = results[0];
    if (user.tipo_usuario !== "professor") {
      return res.status(403).json({ error: "Acesso negado. Apenas professores podem realizar esta ação." });
    }
    next();
  });
}


////////////// JWT auth

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

app.post('/api/cadastro', async (req, res) => {
  const { nome, sobrenome, email, telefone, senha, tipo_usuario } = req.body;
  if (!nome || !sobrenome || !email || !telefone || !senha || !tipo_usuario) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const nomeCompleto = `${nome} ${sobrenome}`;

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

//////////////

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

////////////


const cursosPath = path.join(__dirname, 'data', 'cursos.json');

// Configuração de onde os PDFs serão salvos
const storageExercicios = multer.diskStorage({
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
const uploadExercicios = multer({ storage: storageExercicios });

// storage global para uploads (imagens etc.)
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storageUploads = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // preserva extensão
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage: storageUploads });


// app.use(express.static(path.join(__dirname, 'public')));
// app.use(bodyParser.urlencoded({ extended: true }));


// Rota GET /api/cursos  -> retorna lista com alias para "nome" (compatível frontend)

app.get('/api/cursos', (req, res) => {
  // alias titulo AS nome para frontend que espera course.nome
  const sql = 'SELECT id, professor_id, titulo AS nome, descricao, imagem, slug, link, criado_em FROM cursos ORDER BY criado_em DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar cursos:', err);
      return res.status(500).json({ erro: 'Erro ao buscar cursos' });
    }
    res.json(results);
  });
});

const uploadCurso = multer({ storage: storageUploads }); // usar mesma pasta uploads

app.post('/api/cursos', autenticarJWT, verificarProfessor, uploadCurso.single('imagem'), (req, res) => {
  const { titulo, descricao } = req.body;
  const file = req.file;
   const imagemPath = file ? `/uploads/${file.filename}` : null;

  if (!titulo || !descricao) {
    // se não enviar imagem, ainda permitimos — opcional; se quiser obrigar, verifique file também
    return res.status(400).json({ erro: 'Nome e descrição são obrigatórios.' });
  }

  const slug = slugify(titulo);
  const link = `/Cursos/${slug}/index.html`;
  const professorId = req.userId;

  const sql = `INSERT INTO cursos (professor_id, titulo, descricao, imagem, slug, link) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [professorId, titulo, descricao, imagemPath, slug, link], (err, result) => {
    if (err) {
      console.error('Erro ao criar curso (db):', err.sqlMessage || err);
      return res.status(500).json({ erro: 'Erro ao criar curso' });
    }

    const cursoId = result.insertId;

    // opcional: cria pasta do curso copiando template (se existir)
    try {
      const newDir = path.join(__dirname, '..', 'Cursos', slug);
      const templateDir = path.join(__dirname, 'template');
      fs.mkdirSync(newDir, { recursive: true });

      if (fs.existsSync(path.join(templateDir, 'curso.html'))) {
        fs.copyFileSync(path.join(templateDir, 'curso.html'), path.join(newDir, 'index.html'));
      }
      if (fs.existsSync(path.join(templateDir, 'style.css'))) {
        fs.copyFileSync(path.join(templateDir, 'style.css'), path.join(newDir, 'style.css'));
      }
      if (fs.existsSync(path.join(templateDir, 'scriptt.js'))) {
        fs.copyFileSync(path.join(templateDir, 'scriptt.js'), path.join(newDir, 'scriptt.js'));
      }
    } catch (err) {
      console.error('Erro ao copiar template do curso:', err);
      // não falha a requisição por conta disso
    }

    res.status(201).json({
      mensagem: 'Curso criado com sucesso!',
      id: cursoId,
      slug,
      link,
      imagem: imagemPath
    });
  });
});

// ============================================================================
// Rota DELETE /api/cursos/:slug  -> exclui curso do DB e pasta (protegida)
// ============================================================================
app.delete('/api/cursos/:slug', autenticarJWT, verificarProfessor, (req, res) => {
  const { slug } = req.params;
  const sqlDelete = 'DELETE FROM cursos WHERE slug = ?';
  db.query(sqlDelete, [slug], (err, result) => {
    if (err) {
      console.error('Erro ao deletar curso:', err);
      return res.status(500).json({ erro: 'Erro ao deletar curso' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Curso não encontrado' });
    }

    // remove pasta do curso (se existir)
    const cursoDir = path.join(__dirname, '..', 'Cursos', slug);
    if (fs.existsSync(cursoDir)) {
      try {
        fs.rmSync(cursoDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Erro ao remover pasta do curso:', err);
      }
    }

    res.json({ mensagem: 'Curso deletado com sucesso!' });
  });
});

// ============================================================================
// Rotas auxiliares: obter curso por slug (mantive sua lógica, só limpando erros)
// ============================================================================
app.get('/api/cursos/:slug/details', (req, res) => {
  const { slug } = req.params;
  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err) {
      console.error('Erro ao buscar curso por slug:', err);
      return res.status(500).json({ erro: 'Erro no servidor' });
    }
    if (cursos.length === 0) return res.status(404).json({ erro: 'Curso não encontrado' });

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
      if (err) {
        console.error('Erro ao buscar exercícios:', err);
        return res.status(500).json({ erro: 'Erro ao buscar exercícios' });
      }

      const capitulosExercicios = [];
      const mapEx = new Map();
      exResults.forEach(row => {
        if (!mapEx.has(row.capitulo_id)) {
          mapEx.set(row.capitulo_id, { titulo: row.titulo, exercicios: [] });
        }
        if (row.caminho) mapEx.get(row.capitulo_id).exercicios.push(row.caminho);
      });
      for (const item of mapEx.values()) capitulosExercicios.push(item);

      db.query(sqlVid, [cursoId], (err, vidResults) => {
        if (err) {
          console.error('Erro ao buscar vídeos:', err);
          return res.status(500).json({ erro: 'Erro ao buscar vídeos' });
        }

        const capitulosVideos = [];
        const mapVid = new Map();
        vidResults.forEach(row => {
          if (!mapVid.has(row.capitulo_id)) {
            mapVid.set(row.capitulo_id, { titulo: row.titulo, videos: [] });
          }
          if (row.url) mapVid.get(row.capitulo_id).videos.push(row.url);
        });
        for (const item of mapVid.values()) capitulosVideos.push(item);

        res.json({ capitulosExercicios, capitulosVideos });
      });
    });
  });
});

// ============================================================================
// Rotas para adicionar capítulos (mantive sua lógica original)
// ============================================================================
app.post('/api/cursos/:slug/adicionar-capitulo-exercicio', (req, res) => {
  const { slug } = req.params;
  const { titulo } = req.body;
  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err || cursos.length === 0) return res.status(404).json({ erro: 'Curso não encontrado' });
    const cursoId = cursos[0].id;
    const sqlInsert = 'INSERT INTO capitulos_exercicios (curso_id, titulo) VALUES (?, ?)';
    db.query(sqlInsert, [cursoId, titulo], (err) => {
      if (err) {
        console.error('Erro ao adicionar capítulo-ex:', err);
        return res.status(500).json({ erro: 'Erro ao adicionar capítulo' });
      }
      res.json({ mensagem: 'Capítulo de exercício adicionado com sucesso' });
    });
  });
});

app.post('/api/cursos/:slug/adicionar-capitulo-video', (req, res) => {
  const { slug } = req.params;
  const { titulo } = req.body;
  const sqlCurso = 'SELECT id FROM cursos WHERE slug = ?';
  db.query(sqlCurso, [slug], (err, cursos) => {
    if (err || cursos.length === 0) return res.status(404).json({ erro: 'Curso não encontrado' });
    const cursoId = cursos[0].id;
    const sqlInsert = 'INSERT INTO capitulos_videos (curso_id, titulo) VALUES (?, ?)';
    db.query(sqlInsert, [cursoId, titulo], (err) => {
      if (err) {
        console.error('Erro ao adicionar capítulo-vid:', err);
        return res.status(500).json({ erro: 'Erro ao adicionar capítulo de vídeo' });
      }
      res.json({ mensagem: 'Capítulo de vídeo adicionado com sucesso' });
    });
  });
});

// Rota para upload de PDF (mantive sua rota original para arquivos de exercícios)
app.post('/api/cursos/:slug/capitulo-exercicio/:capituloIndex/upload', uploadExercicios.single('arquivo'), (req, res) => {
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
        if (err) {
          console.error('Erro ao salvar exercício:', err);
          return res.status(500).json({ erro: 'Erro ao salvar exercício' });
        }
        res.json({ mensagem: 'Exercício enviado com sucesso', caminho: relativePath });
      });
    });
  });
});

// ============================================================================
// Utilities
// ============================================================================
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});