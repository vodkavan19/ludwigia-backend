const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const ApiError = require('./middlewares/errorHandler');

const genusRoute = require('./routers/genus.route');
const speciesRoute = require('./routers/species.router');
const adminRoute = require('./routers/admin.route');

const app = express();
app.use(cors({
    credentials: true, 
    origin: [process.env.URL_FE_SERVER]
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api/genus', genusRoute);
app.use('/api/species', speciesRoute);
app.use('/api/admin', adminRoute);

app.use((req, res, next) => {
    return next(new ApiError(404, "Resource not found"));
})

app.use((err, req, res, next) => {
    return res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error"
    })
})

module.exports = app;
