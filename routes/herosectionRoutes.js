const express = require('express');
const router = express.Router();
const Herocontroller = require('../controllers/herosectionController');


router.post('/create-section', Herocontroller.createHerosection);
router.get('/get-section/:page', Herocontroller.getHerosection);

module.exports = router;
