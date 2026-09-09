const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Single source of truth for where users.json lives:
// backend/data/users.json
const usersFile = path.join(__dirname, "..", "data", "users.json");

function getUsers() {
    let data = fs.readFileSync(usersFile, "utf8");

    // Strip a UTF-8 BOM character if present (common when files
    // are saved as "UTF-8 with BOM" on Windows) - it's invisible
    // in editors but breaks JSON.parse.
    if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
    }

    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );
}

async function signup(name, email, password) {
    const users = getUsers();

    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return {
            success: false,
            message: "Email already registered"
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        role: "user",
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    return {
        success: true,
        message: "Account created successfully",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    };
}

async function login(email, password) {
    const users = getUsers();

    const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password"
        };
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        return {
            success: false,
            message: "Invalid email or password"
        };
    }

    // Create a signed token containing the user's id and role.
    // The frontend will store this and send it back on future
    // requests so the server can recognize who's logged in
    // without needing the password again.
    const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        success: true,
        message: "Login successful",
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}

async function adminLogin(email, password) {
    const users = getUsers();

    const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password"
        };
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        return {
            success: false,
            message: "Invalid email or password"
        };
    }

    // This is the key difference from the regular login():
    // even with a correct password, only accounts with the
    // "admin" role are allowed through this endpoint.
    if (user.role !== "admin") {
        return {
            success: false,
            message: "This account does not have administrator access"
        };
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return {
        success: true,
        message: "Admin login successful",
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}

function listUsers() {
    const users = getUsers();

    return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    }));
}

function deleteUser(id, actorId) {
    const users = getUsers();
    const userToDelete = users.find(user => user.id === id);

    if (!userToDelete) {
        return {
            success: false,
            message: "User not found"
        };
    }

    if (actorId && actorId === id) {
        return {
            success: false,
            message: "You cannot delete your own account"
        };
    }

    if (userToDelete.role === "admin") {
        const remainingAdmins = users.filter(
            user => user.id !== id && user.role === "admin"
        ).length;

        if (remainingAdmins === 0) {
            return {
                success: false,
                message: "Cannot delete the last administrator account"
            };
        }
    }

    const index = users.findIndex(user => user.id === id);
    const [deletedUser] = users.splice(index, 1);
    saveUsers(users);

    return {
        success: true,
        message: "User deleted successfully",
        user: {
            id: deletedUser.id,
            name: deletedUser.name,
            email: deletedUser.email,
            role: deletedUser.role
        }
    };
}

module.exports = { signup, login, adminLogin, listUsers, deleteUser };