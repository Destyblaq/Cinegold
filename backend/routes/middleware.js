const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Reads the Authorization header, expects format: "Bearer <token>"
// Returns the decoded token payload (e.g. { id, role }) if valid.
// Throws an error if the header is missing or the token is invalid/expired.
function verifyToken(req) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("No token provided");
    }

    const token = authHeader.split(" ")[1];

    // jwt.verify throws automatically if the token is invalid or expired
    const decoded = jwt.verify(token, JWT_SECRET);

    return decoded;
}

// Same as verifyToken, but additionally requires the token's
// role to be "admin". Use this on any route that only
// administrators should be able to access.
function verifyAdmin(req) {
    const decoded = verifyToken(req);

    if (decoded.role !== "admin") {
        throw new Error("Administrator access required");
    }

    return decoded;
}

module.exports = { verifyToken, verifyAdmin };