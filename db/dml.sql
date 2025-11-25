INSERT INTO Usuario (nome, email, senha, role)
VALUES
('João Silva', 'joao@gmail.com', crypt('senha123', gen_salt('bf')), 'user'),
('Maria Souza', 'maria@hotmail.com', crypt('minhaSenha', gen_salt('bf')), 'user'),
('Carlos Lima', 'carlos@yahoo.com', crypt('abc123', gen_salt('bf')), 'user');
('Cristhian', 'cristhianrfernandes@gmail.com', crypt('Cristhi@n23', gen_salt('bf')), 'admin');

INSERT INTO produto (nome, email, descricao, preco, estoque, destaque, data_cadastro, imagem, ativo)
VALUES
('Teclado Mecânico', 'contato@techstore.com', 'Teclado RGB gamer', 250.00, 15, TRUE, '2025-01-01', 'teclado.jpg', TRUE),
('Mouse Gamer', 'vendas@techstore.com', 'Mouse 7200 DPI', 120.00, 30, FALSE, '2025-01-03', 'mouse.jpg', TRUE),
('Headset USB', 'atendimento@techstore.com', 'Headset com microfone', 180.00, 20, TRUE, '2025-01-05', 'headset.png', TRUE);

INSERT INTO compra (id_usuario, id_produto, quantidade)
VALUES
(1, 2, 1),
(2, 1, 2),
(3, 3, 1);