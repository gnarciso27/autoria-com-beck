CREATE DATABASE autoriaweb;
USE autoriaweb;

CREATE TABLE cursos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  imagem VARCHAR(255),
  link VARCHAR(255)
);

CREATE TABLE capitulos_exercicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  curso_id INT,
  titulo VARCHAR(255),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

CREATE TABLE exercicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  capitulo_id INT,
  caminho VARCHAR(255),
  FOREIGN KEY (capitulo_id) REFERENCES capitulos_exercicios(id) ON DELETE CASCADE
);

CREATE TABLE capitulos_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  curso_id INT,
  titulo VARCHAR(255),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

CREATE TABLE videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  capitulo_id INT,
  url TEXT,
  FOREIGN KEY (capitulo_id) REFERENCES capitulos_videos(id) ON DELETE CASCADE
);

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


