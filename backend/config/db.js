const mysql = require('mysql2')
const fs = require('fs')
require('dotenv').config()
 
// Provedores em nuvem (TiDB Cloud, Aiven, etc.) geralmente exigem conexão via SSL.
// Ative isso setando DB_SSL=true no .env / nas variáveis do Render.
const usarSSL = process.env.DB_SSL === 'true'
const caminhoCA = process.env.DB_CA_PATH // opcional — não precisa pro TiDB Cloud
 
function montarConfigSSL() {
    if (!usarSSL) return undefined
 
    // Se um caminho de CA foi explicitamente configurado (ex: pra outro provedor
    // que exija isso), usa ele. Caso contrário, deixa o Node usar seu conjunto
    // de certificados confiáveis padrão (suficiente pro TiDB Cloud).
    if (caminhoCA) {
        return {
            ca: fs.readFileSync(caminhoCA),
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        }
    }
 
    return {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
}
 
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pym_jornal_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(usarSSL && { ssl: montarConfigSSL() })
})
 
const db = pool.promise()
 
module.exports = db
