CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user' ou 'admin'
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produto (
    id_produto INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120),
    descricao TEXT,
    preco NUMERIC(12,2) NOT NULL CHECK (preco >= 0),
    estoque INT DEFAULT 0 CHECK (estoque >= 0),
    destaque BOOLEAN DEFAULT FALSE,
    data_cadastro DATE,
    imagem VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS compra (
    id_compra INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    data_compra TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
);
