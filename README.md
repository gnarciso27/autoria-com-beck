CREATE DATABASE autoriaweb;
USE autoriaweb;

-- Tabela de cursos
CREATE TABLE cursos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  descricao TEXT,
  imagem VARCHAR(255),
  link VARCHAR(255)
);

-- Capítulos de exercícios
CREATE TABLE capitulos_exercicios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED,
  titulo VARCHAR(255),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Exercícios
CREATE TABLE exercicios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  capitulo_id INT UNSIGNED,
  caminho VARCHAR(255),
  FOREIGN KEY (capitulo_id) REFERENCES capitulos_exercicios(id) ON DELETE CASCADE
);

-- Capítulos de vídeos
CREATE TABLE capitulos_videos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED,
  titulo VARCHAR(255),
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Vídeos
CREATE TABLE videos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  capitulo_id INT UNSIGNED,
  url TEXT,
  FOREIGN KEY (capitulo_id) REFERENCES capitulos_videos(id) ON DELETE CASCADE
);

-- Usuários
CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  tipo_usuario ENUM('estudante', 'professor') NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conteúdos diversos
CREATE TABLE conteudos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo_conteudo VARCHAR(50), -- ex: 'video', 'pdf', 'link'
  url TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Cursos favoritos
CREATE TABLE favoritos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudante_id INT UNSIGNED,
  curso_id INT UNSIGNED,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(estudante_id, curso_id),
  FOREIGN KEY (estudante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Conteúdos salvos
CREATE TABLE conteudos_salvos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudante_id INT UNSIGNED,
  conteudo_id INT UNSIGNED,
  salvo_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(estudante_id, conteudo_id),
  FOREIGN KEY (estudante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (conteudo_id) REFERENCES conteudos(id) ON DELETE CASCADE
);

-- Comunidades
CREATE TABLE comunidades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Postagens nas comunidades
CREATE TABLE postagens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comunidade_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comunidade_id) REFERENCES comunidades(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Respostas às postagens
CREATE TABLE respostas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  postagem_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  conteudo TEXT NOT NULL,
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postagem_id) REFERENCES postagens(id) ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);



