const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
    {
        // null supports letters created without an account.
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        type: {
            type: String,
            enum: ["image", "sticker", "background", "qr-logo"],
            required: true,
        },
        url: { type: String, required: true, trim: true },
        thumbnailUrl: { type: String, trim: true, default: null },
        mimeType: { type: String, required: true, trim: true },
        sizeBytes: { type: Number, min: 0, default: 0 },
        width: { type: Number, min: 1, default: null },
        height: { type: Number, min: 1, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);
