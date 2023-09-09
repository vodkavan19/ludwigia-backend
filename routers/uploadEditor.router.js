const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer()

const ApiError = require('../middlewares/errorHandler');
const ggUploader = require('../middlewares/googleUploader');

router.route('/upload-image')
    .post(
        upload.single('file'),
        ggUploader.uploadFile,
        (req, res, next) => {
            try {
                res.status(200).send(req.file)
            } catch (error) {
                return next(new ApiError(500, "Server couldn't process the request"));
            }
        }
    )

module.exports = router;