require('dotenv').config();
const app = require("./app");

const { connectDB } = require('./configs/mongodb')
connectDB();

app.listen(process.env.APP_PORT, () => {
    console.log(`Server is running on port ${process.env.APP_PORT}`)
})