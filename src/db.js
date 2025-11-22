require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect()
    .then(() => console.log("Conectado ao banco Neon PostgreSQL!"))
    .catch(err => console.error("Erro de conexão:", err));

module.exports = client;
