INSERT INTO Usuario (nome, email, senha)
VALUES
('João Silva', 'joao@gmail.com', '123'),
('Maria Souza', 'maria@hotmail.com', 'abc'),
('Carlos Lima', 'carlos@yahoo.com', 'senha123');

INSERT INTO Produto (nome, email, descricao, preco, estoque, destaque, data_cadastro, imagem, ativo)
VALUES
('Teclado Mecânico', 'contato@techstore.com', 'Teclado RGB gamer', 250.00, 15, TRUE, '2025-01-01', 'teclado.jpg', TRUE),
('Mouse Gamer', 'vendas@techstore.com', 'Mouse 7200 DPI', 120.00, 30, FALSE, '2025-01-03', 'mouse.jpg', TRUE),
('Headset USB', 'atendimento@techstore.com', 'Headset com microfone', 180.00, 20, TRUE, '2025-01-05', 'headset.png', TRUE);

INSERT INTO Compra (id_usuario, id_produto, quantidade, data_compra)
VALUES
(1, 2, 1, NOW()),
(2, 1, 2, NOW()),
(3, 3, 1, NOW());
