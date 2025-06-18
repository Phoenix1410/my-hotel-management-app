const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
    try {
        // Try to connect to local MongoDB first
        let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel-booking';
        
        try {
            const conn = await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (localError) {
            console.log('Local MongoDB not available, starting in-memory MongoDB...');
        }

        // If local MongoDB fails, use in-memory server
        mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Memory Server Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
