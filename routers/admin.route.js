const express = require('express');
const adminController = require('../controllers/admin.controller')
const router = express.Router();

const verifyToken = require('../middlewares/verifyToken')

router.route('/')
    .get(
        verifyToken.verifyAccessToken,
        adminController.getResultSearch
    );

router.route('/register')
    .post(
        verifyToken.verifyAccessToken,
        adminController.register
    );

router.route('/login')
    .post(adminController.login)
    .get(adminController.logout);
    
router.route('/refresh')
    .post(adminController.requestRefreshToken)

router.route('/:id')
    .delete(verifyToken.verifyAccessToken, adminController.deleteOne);

router.route('/toggle-status/:id')
    .put(verifyToken.verifyAccessToken, adminController.toggleStatus);
  
router.route('/forgot-pass/verify')
    .post(adminController.sendVerifyResetPassword)
    .get(adminController.verifyTokenResetPassword)

router.route('/forgot-pass/reset/:id')
    .put(adminController.resetPassword)

module.exports = router;
