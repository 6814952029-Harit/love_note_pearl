const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Letter = require("../models/letter.model");

const createSlug = () => crypto.randomBytes(9).toString("base64url").toLowerCase();
const publicFields = "title recipientName senderName content appearance protection.enabled protection.passwordHint share access.status";
const lockedFields = "title recipientName senderName appearance protection.enabled protection.passwordHint share access.status";
const editableFields = ["title", "recipientName", "senderName", "content", "appearance", "share", "access"];
const sanitizeLetter = (letter) => {
    const result = letter.toObject ? letter.toObject() : letter;
    if (result.protection) {
        delete result.protection.passwordHash;
        delete result.protection.failedAttempts;
        delete result.protection.lockedUntil;
    }
    return result;
};

const createLetter = async (req, res, next) => {
    try {
        const { title, recipientName, senderName, content, appearance, protection = {}, share = {} } = req.body;
        if (!title) return res.status(400).json({ message: "Letter title is required." });
        if (protection.enabled && (!protection.password || protection.password.length < 1)) {
            return res.status(400).json({ message: "A password is required when protection is enabled." });
        }

        const passwordHash = protection.enabled ? await bcrypt.hash(protection.password, 12) : null;
        let letter;
        // A collision is extremely unlikely; retry maintains the unique slug guarantee.
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                letter = await Letter.create({
                    ownerId: req.user._id,
                    title,
                    recipientName,
                    senderName,
                    content: content || { blocks: [] },
                    appearance,
                    protection: { enabled: Boolean(protection.enabled), passwordHash, passwordHint: protection.passwordHint || null },
                    share: { slug: createSlug(), accessMode: share.accessMode || "both", qr: share.qr },
                    access: { status: "published" },
                    publishedAt: new Date(),
                });
                break;
            } catch (error) {
                if (error.code !== 11000 || attempt === 2) throw error;
            }
        }
        res.status(201).json({ letter: sanitizeLetter(letter), slug: letter.share.slug });
    } catch (error) { next(error); }
};

const getMyLetter = async (req, res, next) => {
    try {
        const letter = await Letter.findOne({ _id: req.params.id, ownerId: req.user._id });
        if (!letter) return res.status(404).json({ message: "Letter not found." });
        res.json({ letter: sanitizeLetter(letter) });
    } catch (error) { next(error); }
};

const updateLetter = async (req, res, next) => {
    try {
        const letter = await Letter.findOne({ _id: req.params.id, ownerId: req.user._id }).select("+protection.passwordHash");
        if (!letter) return res.status(404).json({ message: "Letter not found." });

        for (const field of editableFields) {
            if (req.body[field] !== undefined) letter[field] = req.body[field];
        }

        if (req.body.protection !== undefined) {
            const protection = req.body.protection;
            letter.protection.enabled = Boolean(protection.enabled);
            letter.protection.passwordHint = protection.passwordHint || null;
            if (letter.protection.enabled && protection.password) {
                letter.protection.passwordHash = await bcrypt.hash(protection.password, 12);
            }
            if (letter.protection.enabled && !letter.protection.passwordHash) {
                return res.status(400).json({ message: "A password is required when protection is enabled." });
            }
        }

        await letter.save();
        res.json({ letter: sanitizeLetter(letter), slug: letter.share.slug });
    } catch (error) { next(error); }
};

const listMyLetters = async (req, res, next) => {
    try {
        const letters = await Letter.find({ ownerId: req.user._id }).sort({ updatedAt: -1 });
        res.json({ letters });
    } catch (error) { next(error); }
};

const getPublicLetter = async (req, res, next) => {
    try {
        const letter = await Letter.findOne({ "share.slug": req.params.slug, "access.status": "published" }).select(lockedFields);
        if (!letter) return res.status(404).json({ message: "Letter not found." });
        if (letter.protection.enabled) return res.json({ locked: true, letter });
        const unlocked = await Letter.findById(letter._id).select(publicFields);
        res.json({ locked: false, letter: sanitizeLetter(unlocked) });
    } catch (error) { next(error); }
};

const unlockLetter = async (req, res, next) => {
    try {
        const letter = await Letter.findOne({ "share.slug": req.params.slug, "access.status": "published" }).select("+protection.passwordHash +protection.failedAttempts +protection.lockedUntil");
        if (!letter) return res.status(404).json({ message: "Letter not found." });
        if (!letter.protection.enabled) return res.json({ letter: sanitizeLetter(letter) });
        if (!req.body.password || !(await bcrypt.compare(req.body.password, letter.protection.passwordHash))) {
            return res.status(401).json({ message: "Incorrect password." });
        }
        await Letter.updateOne({ _id: letter._id }, { $inc: { "access.viewCount": 1 }, $set: { "protection.failedAttempts": 0, "protection.lockedUntil": null } });
        res.json({ letter: sanitizeLetter(letter) });
    } catch (error) { next(error); }
};

module.exports = { createLetter, listMyLetters, getMyLetter, updateLetter, getPublicLetter, unlockLetter };
