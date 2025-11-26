import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg";
import 'dotenv/config';

const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// Use DATABASE_URL (Neon) vindo do ambiente em produção
const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ??
        "postgresql://neondb_owner:npg_Cd90rbIFsYLo@ep-cold-heart-acoeyh2v-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

// JWT secret via env (MUDANÇA: Renomeado para SECRET)
const SECRET = process.env.JWT_SECRET || "chave-secreta-dev";

// Porta via env (obrigatório em provedores)
const PORT = process.env.PORT || 5502;

// ----------------------------------------------
// Middleware para validar token JWT
// ----------------------------------------------
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    // USO DA NOVA VARIÁVEL 'SECRET'
    jwt.verify(token, SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido ou expirado" });
        }
        req.user = payload; // contém id, email, role
        next();
    });
}

// ----------------------------------------------
// Criar conta
// ----------------------------------------------
app.post("/register", async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) return res.status(400).json({ message: "Email e senha são obrigatórios" });

    const hashed = await bcrypt.hash(senha, 10);

    try {
        // CORREÇÃO: Coluna 'password_hash' alterada para 'senha'
        await pool.query("INSERT INTO usuario (email, senha, role) VALUES ($1, $2, $3)", [
            email,
            hashed,
            "user" // default role
        ]);
        res.status(201).json({ message: "Conta criada!" });
    } catch (err) {
        console.error(err);
        // Detalhe: constraint de unique no email retorna erro do PG, devolvemos 409
        res.status(409).json({ message: "Email já cadastrado" });
    }
});

// Login
app.post("/login", async (req, res) => {
    console.log("POST /login recebido - body:", req.body);
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ message: "Email e senha são obrigatórios" });

    try {
        // Selecionamos todas as colunas da tabela 'usuario'
        const result = await pool.query("SELECT * FROM usuario WHERE email = $1", [email]);

        if (!result.rows.length) {
            return res.status(401).json({ message: "Usuário não encontrado" });
        }

        const user = result.rows[0];

        // CORREÇÃO: Comparando a senha fornecida com 'user.senha' (que deve ser o hash)
        const match = await bcrypt.compare(senha, user.senha); // <-- Correto: usa 'user.senha'

        if (!match) {
            return res.status(401).json({ message: "Senha incorreta" });
        }

        const token = jwt.sign(
            { id: user.id_usuario, email: user.email, role: user.role ?? 'user' },
            SECRET, // <-- Uso da variável SECRET
            { expiresIn: "2h" }
        );


        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro interno no servidor" });
    }
});

// ----------------------------------------------
// ADD PRODUCT — protegido por token
// ----------------------------------------------
app.post("/produto/add", authenticateToken, async (req, res) => {
    // opcional: checar role
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado: admin required" });
    }

    const { name, price, imageUrl, description } = req.body;

    try {
        await pool.query(
            "INSERT INTO produto (nome, preco, imagem, descricao) VALUES ($1, $2, $3, $4)",
            [name, price, imageUrl, description]
        );

        res.status(201).json({ message: "Produto salvo com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao salvar produto." });
    }
});

// ----------------------------------------------
// LISTAR PRODUTOS
// ----------------------------------------------
app.get("/produto/list", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM produto ORDER BY id_produto DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao carregar produtos." });
    }
});

// ----------------------------------------------
// EXCLUIR PRODUTO
// ----------------------------------------------
app.delete("/produto/delete/:id", authenticateToken, async (req, res) => {
    // opcional: checar role
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado: admin required" });
    }

    const productId = req.params.id;

    try {
        await pool.query("DELETE FROM produto WHERE id_produto = $1", [productId]);
        res.json({ message: "Produto excluído com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao excluir produto." });
    }
});

// Inicia o servidor na porta correta (heroku/Render/Netlify functions etc definem PORT)
app.listen(PORT, '0.0.0.0', () => console.log(`Backend rodando na porta ${PORT}`));