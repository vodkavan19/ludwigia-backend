const jwt = require("jsonwebtoken");
const ApiError = require("./errorHandler");

exports.verifyAccessToken = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new ApiError(403, "Thao tác không hợp lệ!"));
    }
    const token = authHeader.split(' ')[1];
    
    jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET_KEY, 
        (err, decode) => {
            if (err) {
                return next(new ApiError(403, "Phiên đăng nhập hết hạn!"));
            } 
            next();
        }
    );
}
