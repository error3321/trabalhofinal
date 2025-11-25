import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgresql://user:senha@seu-endpoint.neon.tech/db?sslmode=require"
});

// ----------------------------------------------
// Middleware para validar token JWT
// ----------------------------------------------
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, "chave-secreta", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ----------------------------------------------
// Criar conta
// ----------------------------------------------
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    try {
        await pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
            [email, hashed]
        );
        res.json({ message: "Conta criada!" });
    } catch (err) {
        res.status(400).json({ error: "Email já cadastrado" });
    }
});

// ----------------------------------------------
// Login
// ----------------------------------------------
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    if (!result.rows.length) {
        return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
        return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        "chave-secreta",
        { expiresIn: "2h" }
    );

    res.json({ token });
});

// ----------------------------------------------
// ADD PRODUCT — protegido por token
// ----------------------------------------------
app.post("/products/add", authenticateToken, async (req, res) => {
    const { name, price, imageUrl, description } = req.body;

    try {
        await pool.query(
            "INSERT INTO products (name, price, image_url, description) VALUES ($1, $2, $3, $4)",
            [name, price, imageUrl, description]
        );

        res.json({ message: "Produto salvo com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao salvar produto." });
    }
});

app.listen(5501, () => console.log("Backend rodando na porta 5501"));

// ----------------------------------------------
// LISTAR PRODUTOS
// ----------------------------------------------
app.get("/products/list", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao carregar produtos." });
    }
});

// ----------------------------------------------
// EXCLUIR PRODUTO
// ----------------------------------------------
app.delete("/products/delete/:id", authenticateToken, async (req, res) => {
    const productId = req.params.id;

    try {
        await pool.query("DELETE FROM products WHERE id = $1", [productId]);
        res.json({ message: "Produto excluído com sucesso!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao excluir produto." });
    }
});

