import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// -------------------------
// Middleware de autenticação
// -------------------------
const authMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// -------------------------
// Rota de login
// -------------------------
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'E-mail ou senha inválidos' });

        const usuario = result.rows[0];
        const match = await bcrypt.compare(password, usuario.password);
        if (!match) return res.status(401).json({ message: 'E-mail ou senha inválidos' });

        const token = jwt.sign({ id: usuario.id, role: usuario.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: usuario.role });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// -------------------------
// Rota de cadastro
// -------------------------
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO usuarios(email, password, role) VALUES($1, $2, $3) RETURNING id,email,role',
            [email, hash, role || 'usuario']
        );

        res.status(201).json({ message: 'Usuário criado com sucesso', usuario: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao criar usuário' });
    }
});

// -------------------------
// Rota de perfil
// -------------------------
app.get('/profile', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id,email,role FROM usuarios WHERE id=$1', [req.usuario.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

        res.json({ usuario: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// -------------------------
// Rota de produtos (CRUD simplificado)
// -------------------------
app.get('/produto/list', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produto ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar produtos' });
    }
});

app.delete('/produto/delete/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM produto WHERE id=$1', [id]);
        res.json({ message: 'Produto excluído' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao excluir produto' });
    }
});

// -------------------------
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

