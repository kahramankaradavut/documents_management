const express = require('express');
const router = express.Router();
const { upload, createDocument, getDocument, updateDocument, getDocumentRevisions } = require('../controllers/documentController');
const { createCategory, getCategory, updateCategory } = require('../controllers/categoryController');

// Doküman rotaları
router.post('/upload', upload.single('file'), createDocument);
router.get('/dokuman/:id', getDocument);
router.put('/dokuman/:id', upload.single('file'), updateDocument);
router.get('/dokuman/:id/revizyon', getDocumentRevisions);

// Kategori rotaları
router.post('/kategori', createCategory);
router.get('/kategori/:id', getCategory);
router.put('/kategori/:id', updateCategory);

module.exports = router;
