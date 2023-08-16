const express = require('express');
const genusController = require('../controllers/genus.controller')
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken')

router.route('/')
    .post(verifyToken.verifyAccessToken, genusController.createNew)
    .get(genusController.getAll);

router.route('/search')
    .get(genusController.getResultSearch);

router.route('/admin-search')
    .get(verifyToken.verifyAccessToken, genusController.getAdminResultSearch);

router.route('/:id')
    .get(genusController.getOneById)
    .put(verifyToken.verifyAccessToken, genusController.updateOne)
    .delete(verifyToken.verifyAccessToken, genusController.deleteOne);

router.route('/toggle-status/:id')
    .put(verifyToken.verifyAccessToken, genusController.toggleStatus);

module.exports = router;
