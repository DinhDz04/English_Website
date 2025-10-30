const {Pool} = require('pg');
const dotenv = require('dotenv');
const pool = new Pool ({
    connectionString : process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }

});
module.exports =pool;