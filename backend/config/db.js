const mysql = require('mysql2')
require('dotenv').config()

// Pool de conexões (melhor prática do que uma conexão única)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pym_jornal_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

// Usamos a versão baseada em Promises pra poder usar async/await nos models
const db = pool.promise()

module.exports = db