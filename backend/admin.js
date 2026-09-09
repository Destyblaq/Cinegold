// ============================================================
// ONE-TIME SCRIPT to create an admin account.
//
// HOW TO USE:
// 1. Edit the ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD values
//    below to whatever you want your admin login to be.
// 2. Save this file.
// 3. Run it once from the backend folder:
//      node create-admin.js
// 4. You should see a confirmation message.
// 5. Afterwards, it's a good idea to change ADMIN_PASSWORD back
//    to something else (or delete this file) so the real
//    password isn't just sitting in a plain text file.
// ============================================================

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const ADMIN_NAME = "Admin";
const ADMIN_EMAIL = "admin@cinegold.com";
const ADMIN_PASSWORD = "ChangeThisPassword123";

const usersFile = path.join(__dirname, "data", "users.json");

function getUsers() {
    let data = fs.readFileSync(usersFile, "utf8");

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

async function createAdmin() {
    const users = getUsers();

    const existingUser = users.find(
        user => user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    );

    if (existingUser) {
        console.log(`An account with the email "${ADMIN_EMAIL}" already exists.`);
        console.log(`Its current role is: "${existingUser.role}"`);
        return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const newAdmin = {
        id: Date.now().toString(),
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        createdAt: new Date().toISOString()
    };

    users.push(newAdmin);
    saveUsers(users);

    console.log("Admin account created successfully!");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log("You can now log in at POST /api/login with this email and your chosen password.");
}

createAdmin();