const GenusModel = require('../models/Genus')
const ApiError = require('../middlewares/errorHandler');

exports.createNew = async (req, res, next) => {
    try {
        const isExist = await GenusModel.findOne({ sci_name: req.body.sci_name });
        if (isExist) {
            return next(
                new ApiError(409, "Chi này đã tồn tại trên hệ thống")
            );
        }
        await GenusModel.create({
            ...req.body,
            status: true,
        });
        res.status(200).json({
            message: "Thêm mới Chi thực vật thành công!"
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.getAll = async (req, res, next) => {
    try {
        const result = await GenusModel.find({ deletedAt: null })
        res.status(200).send(result)
    } catch (error) {
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.updateOne = async (req, res, next) => {
    try {
        const isExist = await GenusModel.findOne({ sci_name: req.body.sci_name });
        if (isExist && isExist._id != req.params.id) {
            return next(
                new ApiError(409, "Thông tin bạn vừa nhập trùng với Chi đã tồn tại")
            );
        }
        await GenusModel.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        );
        res.status(200).json({
            message: "Chỉnh sửa Chi thực vật thành công!"
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.deleteOne = async (req, res, next) => {
    try {
        await GenusModel.findByIdAndUpdate(
            req.params.id,
            { deletedAt: new Date() },
            { new: true }
        );
        res.status(200).json({
            message: "Xóa Chi thực vật thành công!"
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.toggleStatus = async (req, res, next) => {
    try {
        const current = await GenusModel.findById(req.params.id);
        const result = await GenusModel.findByIdAndUpdate(
            current._id,
            { status: !current.status },
            { new: true }
        );
        res.status(200).json({
            message: `Thành công! Chi thực vật ${(result.status === true) ? "được hiển thị" : "đã bị ẩn"}`
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.getResultSearch = async (req, res, next) => {
    try {
        const results = await GenusModel.find({
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
        if(req.query.q === '') {
            results = await GenusModel.find({ deletedAt: null }).populate({ 
                path: 'species', 
                match: { deletedAt: null } 
            })
        } else {
            results = await GenusModel.find({
                deletedAt: null,
                sci_name: { $regex: `(?i)${req.query.q}(?-i)` },
            }).populate({ 
                path: 'species', 
                match: { deletedAt: null } 
            });
        }
        res.status(200).send(results);
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.getOneById = async (req, res, next) => {
    try {
        const result = await GenusModel.findById(req.params.id).select('sci_name vie_name')
        res.status(200).send(result)
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}