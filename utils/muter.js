const multer = require('multer');

 const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (!(file instanceof File)) {
            req.skip = true;
        }
        cb(null, true);
    },
});
