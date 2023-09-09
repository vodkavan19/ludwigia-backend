const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')

const genusRoute = require('./routers/genus.route');
const speciesRoute = require('./routers/species.router');
const adminRoute = require('./routers/admin.route');
const uploadEditorRoute = require('./routers/uploadEditor.router')

const app = express();
app.use(cors({
    credentials: true, 
    origin: [process.env.URL_FE_SERVER]
}));
app.use(cookieParser());
app.use(express.json());

app.use('/genus', genusRoute);
app.use('/species', speciesRoute);
app.use('/admin', adminRoute);
app.use('/upload-editor', uploadEditorRoute)

app.use((err, req, res, next) => {
    return res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error"
    })
})

module.exports = app;
