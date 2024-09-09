const { Pool } = require('pg');

const pool = new Pool({
  user: 'root',
  host: 'localhost',
  database: 'documents_management',
  password: '1234',
  port: 5432
});

module.exports = pool;
