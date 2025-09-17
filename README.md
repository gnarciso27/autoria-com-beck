CREATE DATABASE autoriaweb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autoriaweb;

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    tipo_usuario ENUM('estudante', 'professor') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de cursos
CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    imagem VARCHAR(255), -- campo para armazenar o nome/URL da imagem
    slug VARCHAR(255) UNIQUE, -- link amigável
    link VARCHAR(255), -- link para página gerada
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabela de conteúdos
CREATE TABLE conteudos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_conteudo ENUM('video','pdf','link','outro') DEFAULT 'outro',
    url TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabela de favoritos
CREATE TABLE favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudante_id INT NOT NULL,
    curso_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudante_id, curso_id),
    FOREIGN KEY (estudante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabela de conteúdos salvos
CREATE TABLE conteudos_salvos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudante_id INT NOT NULL,
    conteudo_id INT NOT NULL,
    salvo_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(estudante_id, conteudo_id),
    FOREIGN KEY (estudante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (conteudo_id) REFERENCES conteudos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
