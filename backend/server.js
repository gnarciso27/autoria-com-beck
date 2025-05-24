// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const cursosPath = path.join(__dirname, 'data', 'cursos.json');

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

        const cursos = JSON.parse(data || '[]');
        const novoCurso = {
            nome,
            descricao,
            imagem,
            link: `/Cursos/${nome}/index.html`
        };

        cursos.push(novoCurso);

        fs.writeFile(cursosPath, JSON.stringify(cursos, null, 2), err => {
            if (err) return res.status(500).json({ erro: 'Erro ao salvar o curso' });

            // Copia modelo da página de curso
            const templateDir = path.join(__dirname, 'template');
            const templateHtml = path.join(templateDir, 'curso.html');
            const templateCss = path.join(templateDir, 'style.css');
            const templateJs = path.join(templateDir, 'script.js');

            const newDir = path.join(__dirname, '..', 'Cursos', nome);
            const newHtml = path.join(newDir, 'index.html');
            const newCss = path.join(newDir, 'style.css');
            const newJs = path.join(newDir, 'script.js');

            fs.mkdirSync(newDir, { recursive: true });
            fs.copyFileSync(templateHtml, newHtml);
            fs.copyFileSync(templateCss, newCss);
            fs.copyFileSync(templateJs, newJs);


            res.status(201).json({ mensagem: 'Curso criado com sucesso!' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
