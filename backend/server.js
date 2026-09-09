const http = require("http");
const { signup, login, adminLogin, listUsers, deleteUser } = require("./routes/auth");
const { verifyToken, verifyAdmin } = require("./routes/middleware");

const PORT = 3000;

const server = http.createServer((req, res) => {

    // Allow frontend to communicate with backend
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle browser preflight request
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // Homepage test
    if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Welcome to CineGold Backend!");
        return;
    }

    // USER SIGNUP
    if (req.method === "POST" && req.url === "/api/signup") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const { name, email, password } = JSON.parse(body);

                if (!name || !email || !password) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        success: false,
                        message: "Name, email and password are required"
                    }));
                    return;
                }

                const result = await signup(name, email, password);

                res.writeHead(result.success ? 201 : 409, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result));

            } catch (error) {
                console.error("[signup] error:", error);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: false,
                    message: "Invalid request"
                }));
            }
        });

        return;
    }

    // USER LOGIN
    if (req.method === "POST" && req.url === "/api/login") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const { email, password } = JSON.parse(body);

                if (!email || !password) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        success: false,
                        message: "Email and password are required"
                    }));
                    return;
                }

                const result = await login(email, password);

                res.writeHead(result.success ? 200 : 401, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result));

            } catch (error) {
                console.error("[login] error:", error);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: false,
                    message: "Invalid request"
                }));
            }
        });

        return;
    }

    // ADMIN LOGIN
    if (req.method === "POST" && req.url === "/api/admin-login") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const { email, password } = JSON.parse(body);

                if (!email || !password) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({
                        success: false,
                        message: "Email and password are required"
                    }));
                    return;
                }

                const result = await adminLogin(email, password);

                res.writeHead(result.success ? 200 : 401, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result));

            } catch (error) {
                console.error("[admin-login] error:", error);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: false,
                    message: "Invalid request"
                }));
            }
        });

        return;
    }

    // ADMIN DASHBOARD DATA (admin-only route)
    if (req.method === "GET" && req.url === "/api/admin/dashboard") {
        try {
            const decoded = verifyAdmin(req);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                message: "Welcome to the admin dashboard",
                admin: decoded
            }));

        } catch (error) {
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                message: "Forbidden - " + error.message
            }));
        }

        return;
    }

    // ADMIN: LIST REGISTERED USERS (admin-only route)
    if (req.method === "GET" && req.url === "/api/admin/users") {
        try {
            verifyAdmin(req);

            const users = listUsers();

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                users
            }));

        } catch (error) {
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                message: "Forbidden - " + error.message
            }));
        }

        return;
    }

    // ADMIN: DELETE A USER (admin-only route)
    // Matches /api/admin/users/<id>
    if (req.method === "DELETE" && req.url.startsWith("/api/admin/users/")) {
        try {
            const decoded = verifyAdmin(req);

            const id = decodeURIComponent(
                req.url.slice("/api/admin/users/".length)
            );

            if (!id) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: false,
                    message: "User id is required"
                }));
                return;
            }

            const result = deleteUser(id, decoded.id);

            res.writeHead(result.success ? 200 : 404, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));

        } catch (error) {
            res.writeHead(403, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                message: "Forbidden - " + error.message
            }));
        }

        return;
    }

    // PAGE NOT FOUND
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        success: false,
        message: "Route not found"
    }));
});

server.listen(PORT, () => {
    console.log(`CineGold backend is running on port ${PORT}`);
});