const pool = require('../db');

// Kategori oluşturma
const createCategory = async (req, res) => {
  const { adi } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO kategoriler (adi) VALUES ($1) RETURNING id`,
      [adi]
    );
    res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Kategori alma
const getCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM kategoriler WHERE id = $1 AND is_deleted = false`, [id]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Kategori güncelleme
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { adi, is_deleted } = req.body;

  try {
    const result = await pool.query(
      `UPDATE kategoriler SET adi = $1, is_deleted = $2 WHERE id = $3 RETURNING *`,
      [adi, is_deleted, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createCategory,
  getCategory,
  updateCategory,
};
