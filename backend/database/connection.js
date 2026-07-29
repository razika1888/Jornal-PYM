const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testarConexao() {
    try {
        const connection = await pool.getConnection();

        console.log('✅ Banco de dados conectado com sucesso!');

        connection.release();
    } catch (erro) {
        console.error('❌ Erro ao conectar ao banco de dados.');
        console.error(erro);
    }
}

testarConexao();

module.exports = pool;