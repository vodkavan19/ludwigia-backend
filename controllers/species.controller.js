const SpeciesModel = require('../models/Species')
const ApiError = require('../middlewares/errorHandler');
const ggUploader = require('../middlewares/googleUploader');

exports.createNew = async (req, res, next) => {
    try {
        const isExist = await SpeciesModel.findOne({ sci_name: req.body.sci_name });
        if (isExist) {
            return next(
                new ApiError(409, "Loài này đã tồn tại trên hệ thống")
            );
        }

        const { microsurgerys, phytochemicals, ...rest} = req.body

        const avatar = req.files.find(file => file.field == 'avatar')
        const microsurgeryImages = req.files.filter(file => file.field == 'microsurgery_images')
        const phytochemicalImages = req.files.filter(file => file.field == 'phytochemical_images')

        microsurgeryImages.map((img, idx) => microsurgerys[idx].image = img)
        phytochemicalImages.map((img, idx) => phytochemicals[idx].chemical_structure = img)
        
        var data = { 
            ...rest,
            short_name: rest.sci_name.replace(rest.author, '').trim(),
            avatar: avatar,
            microsurgerys: microsurgerys,
            phytochemicals: phytochemicals
        }

        await SpeciesModel.create({ ...data, status: true });
        res.status(200).json({
            message: "Thêm mới Loài thực vật thành công!"
        });
    } catch (error) {
        req?.files?.forEach(async item => await ggUploader.deleteFile(item.fileId))
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.updateOne = async (req, res, next) => {
    try {
        const isExist = await SpeciesModel.findOne({ sci_name: req.body.sci_name });
        if (isExist && isExist._id != req.params.id) {
            return next(
                new ApiError(409, "Thông tin bạn vừa nhập trùng với Loài đã tồn tại")
            );
        }

        var { 
            avatar, description,
            microsurgerys, microsurgery_file_idx,
            phytochemicals, phytochemical_file_idx,
            ...rest
        } = req.body

        var data = { 
            ...rest,
            description: description.join(''),
            short_name: rest.sci_name.replace(rest.author, '').trim(), 
        }
        
        const existedDB = await SpeciesModel.findById(req.params.id);
        
        const newAvatar = req.files.find(file => file.field == 'avatar')
        if(newAvatar) await ggUploader.deleteFile(existedDB.avatar.fileId);
        data.avatar = newAvatar || avatar;

        const microsurgeryNewImages = req.files.filter(file => file.field == 'microsurgery_new_images')
        const micrKeepImgId = microsurgerys
            .filter(item => item.image != null)
            .map(item => item.image.fileId);
        existedDB.microsurgerys.forEach(async item => {
            if (!micrKeepImgId.includes(item.image.fileId)) {
                await ggUploader.deleteFile(item.image.fileId)
            }
        });
        if(microsurgery_file_idx) {
            for (let idx of microsurgery_file_idx) {
                microsurgerys[idx].image = microsurgeryNewImages.shift();
            };
        }
        data.microsurgerys = microsurgerys
        
        const phytochemicalNewImages = req.files.filter(file => file.field == 'phytochemical_new_images')
        const phytKeepImgId = phytochemicals
            .filter(item => item.chemical_structure != null)
            .map(item => item.chemical_structure.fileId);
        existedDB.phytochemicals.forEach(async item => {
            if (!phytKeepImgId.includes(item.chemical_structure.fileId)) {
                await ggUploader.deleteFile(item.chemical_structure.fileId)
            }
        });
        if(phytochemical_file_idx) {
            for (let idx of phytochemical_file_idx) {
                phytochemicals[idx].chemical_structure = phytochemicalNewImages.shift();
            };
        }
        data.phytochemicals = phytochemicals

        await SpeciesModel.findByIdAndUpdate(req.params.id, data, { new: true })
        res.status(200).json({
            message: "Cập nhật Loài thực vật thành công!"
        });
    } catch (error) {
        req?.files?.forEach(async item => await ggUploader.deleteFile(item.fileId))
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
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
        if(req.query.q == '') {
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