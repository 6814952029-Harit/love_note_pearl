const mongoose = require("mongoose");

const objectIdOrNull = {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Asset",
    default: null,
};

const styleSchema = new mongoose.Schema(
    {
        fontFamily: { type: String, trim: true, default: "Sarabun" },
        fontSize: { type: Number, min: 8, max: 200, default: 18 },
        color: { type: String, trim: true, default: "#1F2937" },
        fontWeight: { type: String, enum: ["normal", "bold"], default: "normal" },
        fontStyle: { type: String, enum: ["normal", "italic"], default: "normal" },
        textAlign: { type: String, enum: ["left", "center", "right"], default: "left" },
    },
    { _id: false }
);

const blockSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["text", "image", "sticker"], required: true },
        text: {
            type: String,
            trim: true,
            maxlength: 10000,
            default: null,
            validate: {
                validator(value) {
                    return this.type !== "text" || Boolean(value);
                },
                message: "A text block must contain text.",
            },
        },
        assetId: {
            ...objectIdOrNull,
            validate: {
                validator(value) {
                    return this.type !== "image" || value != null || Boolean(this.imageUrl);
                },
                message: "An image block must reference an asset or an image URL.",
            },
        },
        // Stickers can be a Unicode character; images may use a hosted URL.
        value: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: null,
            validate: {
                validator(value) {
                    return this.type !== "sticker" || Boolean(value);
                },
                message: "A sticker block must have a value.",
            },
        },
        imageUrl: { type: String, trim: true, maxlength: 3000, default: null },
        position: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
        },
        size: {
            width: { type: Number, min: 1, default: 100 },
            height: { type: Number, min: 1, default: 100 },
        },
        rotation: { type: Number, min: -360, max: 360, default: 0 },
        zIndex: { type: Number, min: 0, max: 100, default: 0 },
        style: { type: styleSchema, default: () => ({}) },
    },
    { _id: true }
);

const letterSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        recipientName: { type: String, trim: true, maxlength: 120, default: null },
        senderName: { type: String, trim: true, maxlength: 120, default: null },
        content: {
            blocks: { type: [blockSchema], default: [] },
        },
        appearance: {
            letterTemplate: { type: String, trim: true, default: "classic" },
            letterColor: { type: String, trim: true, default: "#FFF8E7" },
            backgroundColor: { type: String, trim: true, default: "#F9FAFB" },
            backgroundImageAssetId: objectIdOrNull,
            envelopeColor: { type: String, trim: true, default: "#E8D7B9" },
            borderColor: { type: String, trim: true, default: "#44352D" },
            backgroundPattern: { type: String, enum: ["none", "dots", "lines", "hearts"], default: "none" },
        },
        protection: {
            enabled: { type: Boolean, default: false },
            // Never return the hash from normal API queries.
            passwordHash: { type: String, select: false, default: null },
            passwordHint: { type: String, trim: true, maxlength: 300, default: null },
            failedAttempts: { type: Number, min: 0, default: 0, select: false },
            lockedUntil: { type: Date, default: null, select: false },
        },
        share: {
            slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
            accessMode: { type: String, enum: ["link", "qr", "both"], default: "both" },
            qr: {
                enabled: { type: Boolean, default: true },
                style: {
                    foregroundColor: { type: String, trim: true, default: "#000000" },
                    backgroundColor: { type: String, trim: true, default: "#FFFFFF" },
                    pattern: { type: String, enum: ["square", "dots", "rounded"], default: "square" },
                    cornerStyle: { type: String, enum: ["square", "rounded", "dot"], default: "square" },
                    logoAssetId: objectIdOrNull,
                },
            },
        },
        access: {
            status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
            opensAt: { type: Date, default: null },
            expiresAt: { type: Date, default: null },
            maxViews: { type: Number, min: 1, default: null },
            viewCount: { type: Number, min: 0, default: 0 },
        },
        publishedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

letterSchema.index({ "share.slug": 1 }, { unique: true });
letterSchema.index({ ownerId: 1, updatedAt: -1 });
letterSchema.index({ "access.expiresAt": 1 });

letterSchema.pre("validate", function validateProtection() {
    if (this.protection.enabled && !this.protection.passwordHash) {
        throw new Error("Password protection requires a password hash.");
    }

    if (!this.protection.enabled) {
        this.protection.passwordHash = null;
        this.protection.passwordHint = null;
        this.protection.failedAttempts = 0;
        this.protection.lockedUntil = null;
    }

    if (this.access.opensAt && this.access.expiresAt && this.access.opensAt >= this.access.expiresAt) {
        throw new Error("expiresAt must be later than opensAt.");
    }

    for (const block of this.content.blocks || []) {
        if (block.type === "sticker" && !block.value) {
            throw new Error("A sticker block must have a value.");
        }
    }
});

module.exports = mongoose.model("Letter", letterSchema);
