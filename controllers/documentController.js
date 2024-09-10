const pool = require('../db');
const multer = require('multer');
const path = require('path');
const { readDocxFile } = require('../docxHelper'); 


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Doküman oluşturma
const createDocument = async (req, res) => {
  const {
    adi, aciklama, konusu, departman_id = 1, gecerlilik_tarihi,
    is_active, revizyon, kategori_id, sebep, alt_birim_id
  } = req.body;
  const { mimetype, size, filename } = req.file;
  const fileUrl = `/uploads/${filename}`;

  try {
    await pool.query("BEGIN");

    const result = await pool.query(
      `INSERT INTO dokuman (adi, aciklama, konusu, departman_id, gecerlilik_tarihi, is_active, revizyon, kategori_id, file_type, file_size, url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [adi, aciklama, konusu, alt_birim_id || departman_id, gecerlilik_tarihi, is_active, revizyon, kategori_id, mimetype, size, fileUrl]
    );
    const newDocId = result.rows[0].id;

    await pool.query(
      `INSERT INTO dokuman_kategori (dokuman_id, kategori_id) VALUES ($1, $2)`,
      [newDocId, kategori_id]
    );

    await pool.query(
      `INSERT INTO dokuman_birim (dokuman_id, departman_id) VALUES ($1, $2)`,
      [newDocId, alt_birim_id || departman_id]
    );

    if (sebep) {
      await pool.query(
        `INSERT INTO revizyon (sebep, dokuman_id) VALUES ($1, $2)`,
        [sebep, newDocId]
      );
    }

    await pool.query("COMMIT");
    res.status(200).json({ id: newDocId });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Doküman güncelleme
const updateDocument = async (req, res) => {
  const { id } = req.params;
  const {
    adi, aciklama, konusu, departman_id, gecerlilik_tarihi, is_active,
    revizyon, kategori_id, is_deleted, alt_birim_id
  } = req.body;
  const { mimetype, size, filename } = req.file || {};
  const fileUrl = filename ? `/uploads/${filename}` : null;

  try {
    await pool.query("BEGIN");

    // Dokümanın mevcut verilerini al
    const result = await pool.query(
      `SELECT * FROM dokuman WHERE id = $1 AND is_deleted = false`, [id]
    );

    if (result.rows.length > 0) {
      const doc = result.rows[0];
      const previousDoc = { ...doc };

      // Eski dosyanın içeriğini okuma
      let previousFileContent = null;
      if (doc.url) {
        const previousFilePath = path.join(__dirname, '../uploads', path.basename(doc.url));
        previousFileContent = await readDocxFile(previousFilePath);
      }

      await pool.query(
        `INSERT INTO revizyon (sebep, onceki_dokuman, dokuman_id) 
         VALUES ($1, $2, $3)`,
        ['Doküman güncellendi', previousFileContent, id]
      );

      // Yeni dosya içeriğini oku
      let newFileContent = null;
      if (filename) {
        const newFilePath = path.join(__dirname, '../uploads', filename);
        newFileContent = await readDocxFile(newFilePath);
      }


      // DOCX dosyasının içeriğini okuma
      let fileContent = null;
      if (filename) {
        const filePath = path.join(__dirname, '../uploads', filename);
        fileContent = await readDocxFile(filePath);
      }

      // Dokümanı güncelle
      const updatedDoc = await pool.query(
        `UPDATE dokuman SET adi = $1, aciklama = $2, konusu = $3, 
         departman_id = $4, gecerlilik_tarihi = $5, is_active = $6, revizyon = $7, 
         kategori_id = $8, is_deleted = $9, file_type = $10, file_size = $11, url = $12 
         WHERE id = $13 RETURNING *`,
        [adi, aciklama, konusu, alt_birim_id || departman_id, gecerlilik_tarihi, is_active, revizyon, kategori_id, is_deleted, mimetype || doc.file_type, size || doc.file_size, fileUrl || doc.url, id]
      );
      
      await pool.query("COMMIT");
      res.status(200).json({ ...updatedDoc.rows[0], newFileContent });
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Doküman alma
const getDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM dokuman WHERE id = $1 AND is_deleted = false`, [id]
    );
    if (result.rows.length > 0) {
      const doc = result.rows[0];

      // Revizyon bilgilerini al
      const revisionResult = await pool.query(
        `SELECT * FROM revizyon WHERE dokuman_id = $1 ORDER BY created_at DESC`, [id]
      );

      doc.revizyon = revisionResult.rows;
      res.status(200).json(doc);
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Revizyon bilgilerini alma
const getDocumentRevisions = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT * FROM revizyon WHERE dokuman_id = $1 ORDER BY created_at DESC`, [id]
      );
      if (result.rows.length > 0) {
        res.status(200).json(result.rows);
      } else {
        res.status(404).json({ error: "No revisions found" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

module.exports = {
  upload,
  createDocument,
  getDocument,
  updateDocument,
  getDocumentRevisions
};
