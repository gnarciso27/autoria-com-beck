CREATE DATABASE autoriaweb;
USE autoriaweb;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    tipo_usuario ENUM('estudante', 'professor') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER REFERENCES usuarios(id),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conteudos (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER REFERENCES cursos(id),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_conteudo VARCHAR(50), -- ex: 'video', 'pdf', 'link'
    url TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favoritos (
    id SERIAL PRIMARY KEY,
    estudante_id INTEGER REFERENCES usuarios(id),
    curso_id INTEGER REFERENCES cursos(id),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudante_id, curso_id)
);

CREATE TABLE conteudos_salvos (
    id SERIAL PRIMARY KEY,
    estudante_id INTEGER REFERENCES usuarios(id),
    conteudo_id INTEGER REFERENCES conteudos(id),
    salvo_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudante_id, conteudo_id)
);
