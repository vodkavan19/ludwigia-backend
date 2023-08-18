const AdminModel = require('../models/Admin')
const ApiError = require('../middlewares/errorHandler');
const jwtUtils = require('../utils/token')

const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const { mailResetPassword, transporter } = require('../utils/mailTransport');


exports.register = async (req, res, next) => {
    try {
        const isExist = await AdminModel.findOne({ email: req.body.email });
        if (isExist) {
            return next(
                new ApiError(409, "Email đã tồn tại trên hệ thống")
            );
        }
        await AdminModel.create({
            ...req.body, 
            status: true,
            root_role: false
        });
        res.status(200).json({
            message: "Thêm quản trị viên thành công!"
        })
    } catch (error) {
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.login = async (req, res, next) => {
    try {
        const admin = await AdminModel.findOne({ email: req.body.email });
        if (!admin) {
            return next( new ApiError(404, "Email chưa đăng ký tài khoản!"));
        }
        if (admin.status == false) {
            return next( new ApiError(403, "Tài khoản của bạn đã bị khóa!"));
        }
        const validPass = await bcrypt.compareSync(req.body.password, admin.password);
        if (!validPass) {
            return next( new ApiError(404, "Mật khẩu không chính xác!"));
        }
        if(admin && validPass) {
            const accessToken = jwtUtils.generateAccessToken(admin);
            const refreshToken = jwtUtils.generateRefreshToken(admin);
            res.cookie('refreshToken', refreshToken, {
                maxAge: 7 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: true,
                path: '/',
                sameSite: 'none',
            });
            const { password, ...others } = admin._doc;

            res.status(200).json({ ...others, accessToken });
        }
    } catch (error) {
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.logout = async (req, res, next) => {
    try {
        await res.clearCookie('refreshToken', {path: '/'});
        res.status(200).json({
            message: "Đăng xuất thành công!" 
        });
    } catch (err) {
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.requestRefreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return next(
            new ApiError(403, "Phiên đăng nhập hết hạn!")
        ); 
        jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET_KEY, 
            (err, decode) => {
                if(err) return next(
                    new ApiError(403, "Phiên đăng nhập hết hạn!")
                );
                const newAccessToken = jwtUtils.generateAccessToken(req.body);
                res.status(200).send(newAccessToken);
            }
        );
    } catch (error) {
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.getResultSearch = async (req, res, next) => {
    try {
        var results = [];
        if(req.query.q === '') {
            results = await AdminModel.find({ deletedAt: null })
        } else {
            results = await AdminModel.find({
                $or: [
                    { name: { $regex: `(?i)${req.query.q}(?-i)` } },
                    { email: { $regex: `(?i)${req.query.q}(?-i)` } },
                ],
                $and: [{ deletedAt: null }]
            })
        }
        res.status(200).send(results);
    } catch (error) {
        return next(
            new ApiError(500, "Server could not process the request")
        );
    }
}

exports.deleteOne = async (req, res, next) => {
    try {
        await AdminModel.findByIdAndUpdate(
            req.params.id,
            { deletedAt: new Date() },
            { new: true }
        );
        res.status(200).json({
            message: "Xóa quản trị viên thành công!"
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.toggleStatus = async (req, res, next) => {
    try {
        const current = await AdminModel.findById(req.params.id);
        const result = await AdminModel.findByIdAndUpdate(
            current._id,
            { status: !current.status },
            { new: true }
        );
        res.status(200).json({
            message: `${(result.status === true) ? "Khóa" : "Mở khóa"} tài khoản quản trị viên thành công`
        });
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.sendVerifyResetPassword = async (req, res, next) => {
    try {
        const isExist = await AdminModel.findOne({ email: req.body.email })
        if(!isExist) {
            return next( new ApiError(404, "Không tìm thấy tài khoản!"));
        }
        if (isExist.status == false) {
            return next( new ApiError(403, "Tài khoản của bạn đã bị khóa!"));
        }
        
        const secretKey = process.env.JWT_VERIFY_SECRET_KEY + isExist.password;
        const token = jwtUtils.generateVerifyToken(isExist, secretKey)
        const convertToken = token.replaceAll('.', '$dots$')
        const contentMail = mailResetPassword(
            `${process.env.URL_FE_SERVER}/admin/reset_password/${isExist._id}/${convertToken}`
        )
        
        const mailOption = {
            from: '"Ludwigia" <no-reply@ludwigia.edu.vn>',
            to: isExist.email,
            subject: "Xác minh tài khoản Quản trị viên quên mật khẩu!",
            html: contentMail,
        }

        await transporter.sendMail(mailOption, (err, info) => {
            if(err) {
                return next(
                    new ApiError(500, "Server couldn't process the request")
                )
            } else {
                res.status(200).send(info.response);
            }
        })
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}

exports.verifyTokenResetPassword = async (req, res, next) => {
    const { id, token } = req.query;
    try {
        const admin = await AdminModel.findById(id);
        const reconvertToken = token.replaceAll('$dots$', '.')
        const secret = process.env.JWT_VERIFY_SECRET_KEY + admin.password;
        const verify = jwt.verify(reconvertToken, secret);

        res.status(200).json({ message: "Xác minh hoàn tất!" });
    } catch (error) {
        return next(
            new ApiError(403, "Xác minh tài khoản thất bại!")
        );
    }
}

exports.resetPassword = async (req, res, next) => {
    try {
        const hashPassword = await bcrypt.hash(req.body.password, 10);
        await AdminModel.findByIdAndUpdate(
            req.params.id, 
            { password: hashPassword },
            { new: true }
        )
        res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' })
        
    } catch (error) {
        return next(
            new ApiError(500, "Server couldn't process the request")
        );
    }
}