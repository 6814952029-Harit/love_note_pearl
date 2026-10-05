const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI;

        // ถ้าตั้งค่าให้ใช้ Memory DB หรือต่อออนไลน์ไม่ได้ ให้สร้างฐานข้อมูลจำลองในเครื่องทันที
        if (process.env.USE_MEMORY_DB === "true") {
            const mongoServer = await MongoMemoryServer.create();
            mongoUri = mongoServer.getUri();
            console.log("Using In-Memory MongoDB Database for testing!");
        }

        await mongoose.connect(mongoUri);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        
        // ระบบสำรอง: ถ้าต่อเน็ตข้างนอกพลาด ให้สลับมาใช้ Memory DB อัตโนมัติ
        try {
            console.log("Falling back to In-Memory MongoDB...");
            const mongoServer = await MongoMemoryServer.create();
            const fallbackUri = mongoServer.getUri();
            await mongoose.connect(fallbackUri);
            console.log("MongoDB connected (Fallback Memory DB)");
        } catch (memError) {
            console.error("Fallback failed:", memError.message);
            process.exit(1);
        }
    }
};

module.exports = connectDB;