-- ==========================
-- TABELA USUARIO
-- ==========================
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- ==========================
-- TABELA PRODUTO
-- ==========================
CREATE TABLE Produto (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120),               -- aparece no seu modelo lógico
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT DEFAULT 0,
    destaque BOOLEAN DEFAULT FALSE,
    data_cadastro DATE,
    imagem VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE
);

-- ==========================
-- TABELA COMPRA (REL N:N)
-- ==========================
CREATE TABLE Compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    data_compra DATETIME NOT NULL,

    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto)
);

CREATE TABLE Venda (
    id_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,
    nome VARCHAR(120),
    email VARCHAR(120),
    descricao TEXT,
    preco DECIMAL(10,2),
    imagem VARCHAR(255),
    ativo BOOLEAN,
    data_cadastro DATE,

    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto)
);
