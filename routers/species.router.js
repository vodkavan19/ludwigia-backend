const express = require('express');
const router = express.Router();

const multer = require('multer')
const upload = multer()

const speciesController = require('../controllers/species.controller')
const verifyToken = require('../middlewares/verifyToken');
const ggUploader = require('../middlewares/googleUploader');

// router.route('/')
//     .post(
//         verifyToken.verifyAccessToken,
//          upload.fields([
//             { name: 'avatar', maxCount: 1 },
//             { name: 'microsurgery_images' },
//             { name: 'phytochemical_images' },
//         ]),
//         ggUploader.uploadFile,
//         speciesController.createNew
//     );

router.route('/search')
    .get(speciesController.getResultSearch);

router.route('/admin-search')
    .get(verifyToken.verifyAccessToken, speciesController.getAdminResultSearch);

router.route('/toggle-status/:id')
    .put(verifyToken.verifyAccessToken, speciesController.toggleStatus);

router.route('/by_genus/:genusId')
    .get(speciesController.getResultByGenus)


router.route('/introduction')
    .post(
        verifyToken.verifyAccessToken,
        upload.single('avatar'),
        ggUploader.uploadFile,
        speciesController.uploadIntroduction,
    )
    
router.route('/simple-data')
    .post(
        verifyToken.verifyAccessToken,
        speciesController.uploadSimpleData,
    )

router.route('/microsurgery')
    .post(
        verifyToken.verifyAccessToken,
        upload.array('microsurgery_images'),
        ggUploader.uploadFile,
        speciesController.uploadDataHasArrayImages,
    )

router.route('/phytochemical')
    .post(
        verifyToken.verifyAccessToken,
        upload.array('phytochemical_images'),
        ggUploader.uploadFile,
        speciesController.uploadDataHasArrayImages,
    )  

router.route('/')
    .post(
        verifyToken.verifyAccessToken,
        speciesController.createNew
    )

router.route('/:id')
    .get(speciesController.getOneById)
    // .put(
    //     verifyToken.verifyAccessToken,
    //     upload.fields([
    //         { name: 'avatar', maxCount: 1 },
    //         { name: 'microsurgery_new_images' },
    //         { name: 'phytochemical_new_images' },
    //     ]),
    //     ggUploader.uploadFile,
    //     speciesController.updateOne
    // )
    .put( 
        verifyToken.verifyAccessToken,
        speciesController.updateOne
    )
    .delete(
        verifyToken.verifyAccessToken, 
        speciesController.deleteOne
    );

module.exports = router;
