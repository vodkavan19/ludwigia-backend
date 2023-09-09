const SpeciesModel = require('../models/Species')
const ApiError = require('../middlewares/errorHandler');
const ggUploader = require('../middlewares/googleUploader');
const redisClient = require('../configs/redis');
const FORM_KEYS = [
    "introduction",
    "description",
    "microsurgerys",
    "distribution",
    "phytochemicals",
    "benefits",
    "references"
]

exports.getResultSearch = async (req, res, next) => {
    try {
        const results = await SpeciesModel.find({
            status: true,
            deletedAt: null,
            sci_name: { $regex: `(?i)${req.query.q}(?-i)` },
        });
        res.status(200).send(results);
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
};

exports.getAdminResultSearch = async (req, res, next) => {
    try {
        var results = [];
        if (req.query.q == '') {
            results = await SpeciesModel.find({ deletedAt: null })
                .populate({ path: 'genus_ref', select: 'sci_name' })
        } else {
            results = await SpeciesModel.find({
                deletedAt: null,
                sci_name: { $regex: `(?i)${req.query.q}(?-i)` },
            }).populate({
                path: 'genus_ref', select: 'sci_name'
            })
        }
        res.status(200).send(results);
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.getResultByGenus = async (req, res, next) => {
    try {
        const results = await SpeciesModel.find({
            status: true,
            deletedAt: null,
            genus_ref: req.params.genusId
        }).select('short_name avatar')
        res.status(200).send(results)
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.getOneById = async (req, res, next) => {
    try {
        const result = await SpeciesModel.findById(req.params.id)
            .populate({ path: 'genus_ref' })
        res.status(200).send(result)
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.uploadIntroduction = async (req, res, next) => {
    try {
        const isExist = await SpeciesModel.findOne({ sci_name: req.body.sci_name });
        const notUpdate = (req.body.editId) ? (isExist._id === req.body.editId) : true
        if (isExist && notUpdate) {
            return next(new ApiError(409, "Loài này đã tồn tại trên hệ thống"));
        }

        const avatar = req.file;
        const { admin, editId, ...rest } = req.body;
        await redisClient.set(
            `species_introduction_${admin}`,
            JSON.stringify({ ...rest, avatar: avatar })
        )
        res.status(200).json({
            message: 'Tải lên thông tin giới thiệu Loài thành công!'
        })
    } catch (error) {
        ggUploader.deleteFile(req.file.fileId)
        return next(new ApiError(500, "Server couldn't process the request"));
    }
}

exports.uploadSimpleData = async (req, res, next) => {
    try {
        const { admin, field, uploaded, ...rest } = req.body;
        await redisClient.set(
            `species_${field}_${admin}`,
            JSON.stringify({ ...rest })
        )
        uploaded.forEach(item => {
            if (!(rest[field].includes(item))) ggUploader.deleteFile(item)
        })
        res.status(200).json({
            message: 'Tải lên dữ liệu Loài thành công!'
        })
    } catch (error) {
        return next(new ApiError(500, "Server couldn't process the request"));
    }
}

exports.uploadDataHasArrayImages = async (req, res, next) => {
    try {
        const images = req.files;
        const { admin, field, ...rest } = req.body;
        await redisClient.set(
            `species_${field}_${admin}`,
            JSON.stringify({ ...rest, images: images })
        )
        res.status(200).json({
            message: 'Tải lên dữ liệu Loài thành công!'
        })
    } catch (error) {
        return next(new ApiError(500, "Server couldn't process the request"));
    }
}

exports.createNew = async (req, res, next) => {
    try {
        const { admin, references } = req.body;
        var data = { references: references }

        await Promise.all(FORM_KEYS.slice(0, -1).map(
            item => redisClient.get(`species_${item}_${admin}`)
        )).then(results => {
            for (let result of results) {
                var item = JSON.parse(result)
                if (item['microsurgerys']) {
                    const microsurgerys = item['microsurgerys'].map((mirc, idx) => {
                        return { ...mirc, image: item['images'][idx] }
                    })
                    data = { ...data, microsurgerys: microsurgerys }
                } else if (item['phytochemicals']) {
                    const phytochemicals = item['phytochemicals'].map((phyt, idx) => {
                        return { ...phyt, chemical_structure: item['images'][idx] }
                    })
                    data = { ...data, phytochemicals: phytochemicals }
                } else {
                    data = { ...data, ...item }
                }
            }
        })

        await SpeciesModel.create({
            ...data,
            status: true,
            short_name: data.sci_name.replace(data.author, '').trim(),
        })

        await Promise.all(FORM_KEYS.slice(0, -1).map(
            item => redisClient.del(`species_${item}_${admin}`)
        ))
            
        res.status(200).json({
            message: "Thêm mới Loài thực vật thành công!"
        });
    } catch (error) {
        return next(new ApiError(500, "Server couldn't process the request"));
    }
}

exports.updateOne = async (req, res, next) => {
    try {
        const { admin, references } = req.body;
        var data = { references: references }
        const existedDB = await SpeciesModel.findById(req.params.id);
        var canDelete = []

        await Promise.all(FORM_KEYS.slice(0, -1).map(
            item => redisClient.get(`species_${item}_${admin}`)
        )).then(async results => {
            for (let result of results) {
                var item = JSON.parse(result)
                if (item['microsurgerys']) {
                    const micrKeepImgId = item['microsurgerys']
                        .filter(e => e.image != null).map(e => e.image.fileId);
                    for (let e of existedDB.microsurgerys) {
                        if (!micrKeepImgId.includes(e.image.fileId)) canDelete.push(e.image.fileId);
                    }
                    if (item['microsurgery_file_idx']) {
                        for (let idx of item['microsurgery_file_idx']) {
                            item['microsurgerys'][parseInt(idx)].image = item['images'].shift();
                        };
                    }
                    data = { ...data, microsurgerys: item['microsurgerys'] }
                } else if (item['phytochemicals']) {
                    const phytKeepImgId = item['phytochemicals']
                        .filter(e => e.chemical_structure != null).map(e => e.chemical_structure.fileId);
                    for (let e of existedDB.phytochemicals) {
                        if (!phytKeepImgId.includes(e.chemical_structure.fileId)) canDelete.push(e.chemical_structure.fileId);
                    }
                    if (item['phytochemical_file_idx']) {
                        for (let idx of item['phytochemical_file_idx']) {
                            item['phytochemicals'][parseInt(idx)].chemical_structure = item['images'].shift();
                        };
                    }
                    data = { ...data, phytochemicals: item['phytochemicals'] }
                } else {
                    data = { ...data, ...item }
                }
            }
        })

        await SpeciesModel.findByIdAndUpdate(req.params.id, {
            ...data,
            short_name: data.sci_name.replace(data.author, '').trim(),
        }, { new: true });

        canDelete.forEach(item => ggUploader.deleteFile(item))
        await Promise.all(FORM_KEYS.slice(0, -1).map(
            item => redisClient.del(`species_${item}_${admin}`)
        ))

        res.status(200).json({
            message: "Thêm mới Loài thực vật thành công!"
        });
    } catch (error) {
        return next(new ApiError(500, "Server couldn't process the request"));
    }
}

exports.deleteOne = async (req, res, next) => {
    try {
        await SpeciesModel.findByIdAndUpdate(
            req.params.id,
            { deletedAt: new Date() },
            { new: true }
        );
        res.status(200).json({
            message: "Xóa Loài thực vật thành công!"
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.toggleStatus = async (req, res, next) => {
    try {
        const current = await SpeciesModel.findById(req.params.id);
        const result = await SpeciesModel.findByIdAndUpdate(
            current._id,
            { status: !current.status },
            { new: true }
        );
        res.status(200).json({
            message: `Thành công! Loài thực vật ${(result.status === true) ? "được hiển thị" : "đã bị ẩn"}`
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}