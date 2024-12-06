const express = require('express');
const messageController = require('../controllers/messageController');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, messageController.getMessages);
router.delete('/:id', protect, isAdmin, messageController.deleteMessage);

module.exports = router;