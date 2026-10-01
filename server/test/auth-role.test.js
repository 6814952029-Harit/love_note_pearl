const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../src/models/user.model");
const { requireRole } = require("../src/middlewares/auth.middleware");

test("new accounts receive the user role by default", () => {
    const user = new User({ displayName: "Member", email: "member@example.com", passwordHash: "hash" });
    assert.equal(user.role, "user");
    assert.equal(user.validateSync(), undefined);
});

test("user model rejects an unsupported role", () => {
    const user = new User({ displayName: "Member", email: "member@example.com", passwordHash: "hash", role: "owner" });
    assert.ok(user.validateSync());
});

test("admin role middleware permits admins and denies ordinary users", () => {
    const guard = requireRole("admin");
    let calledNext = false;
    guard({ user: { role: "admin" } }, {}, () => { calledNext = true; });
    assert.equal(calledNext, true);

    let statusCode;
    let response;
    const res = { status: (code) => { statusCode = code; return { json: (body) => { response = body; } }; } };
    guard({ user: { role: "user" } }, res, () => assert.fail("next must not run"));
    assert.equal(statusCode, 403);
    assert.match(response.message, /permission/i);
});
