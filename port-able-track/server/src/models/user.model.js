const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ["user", "admin"], default: "user", index: true },
        avatarAssetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", default: null },
    },
    { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.methods.comparePassword = function comparePassword(password) { return bcrypt.compare(password, this.passwordHash); };
userSchema.statics.hashPassword = function hashPassword(password) { return bcrypt.hash(password, 12); };
userSchema.set("toJSON", { transform: (_doc, returned) => { delete returned.passwordHash; delete returned.__v; return returned; } });

module.exports = mongoose.model("User", userSchema);
