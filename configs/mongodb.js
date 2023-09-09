const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const connectDB = async() => {
    const connectOption = {}
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, connectOption);
        console.log('Connect database success!');
    } catch (error) {
        console.log(`Connect Failure! Error: ${error}`);
        process.exit(1);
    }
}

module.exports = { connectDB }