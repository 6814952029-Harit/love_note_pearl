const test = require("node:test");
const assert = require("node:assert/strict");
const Letter = require("../src/models/letter.model");

const validLetter = () => new Letter({
    title: "A letter",
    content: { blocks: [{ type: "text", text: "Hello" }] },
    protection: { enabled: false },
    share: { slug: "valid-test-slug" },
});

test("accepts text decoration and QR colour settings", () => {
    const letter = validLetter();
    letter.content.blocks[0].style = { fontWeight: "bold", fontStyle: "italic", textAlign: "center", color: "#A64B49" };
    letter.appearance = { borderColor: "#A64B49", backgroundPattern: "dots" };
    letter.share.qr = { enabled: true, style: { pattern: "rounded", foregroundColor: "#A64B49", backgroundColor: "#FFF8E8" } };
    assert.equal(letter.validateSync(), undefined);
});

test("rejects sticker blocks without a sticker value", () => {
    const letter = validLetter();
    letter.content.blocks.push({ type: "sticker" });
    assert.match(letter.validateSync().message, /sticker block must have a value/);
});

test("rejects image blocks without an asset or URL", () => {
    const letter = validLetter();
    letter.content.blocks.push({ type: "image" });
    assert.ok(letter.validateSync());
});
