import express, { request, response } from "express";
import mysql from 'mysql2';
import { validatePassword } from "./config/Password_Policy.js";
import { generateHash } from "./config/Salt_HMAC.js";
import crypto from 'crypto';
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import session from "express-session";


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Server:
const app = express()
const port = 3000
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'communication_ltd',
    port: 3306
}).promise();
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "1234", // יש להחליף במפתח סודי משלך
    resave: false,
    saveUninitialized: true,
  })
  
);
// פונקציה ליצירת טוקן
function createToken(email) {
    const token = crypto.createHash("sha1").update(Date.now().toString() + email).digest("hex");
    console.log(`Generated token for email ${email}: ${token}`); // הדפסת הטוקן שנוצר
    return token;
  }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// pages:
app.get("/Main_Page", (request, response) => { response.render('Main_Page.ejs') })
app.get("/Forgot_Password", (request, response) => { response.render('Forgot_Password.ejs') })
app.get("/Change_Password", (request, response) => { response.render('Change_Password.ejs') })
app.get("/Login", (request, response) => { response.render('Login.ejs') })
app.get("/New_Register", (request, response) => { response.render('New_Register.ejs') })
app.get("/System_Page", (request, response) => { response.render('System_Page.ejs') })
app.get("/Reset_Token", (req, res) => {res.render("Reset_Token.ejs", { errorMessage: null });
});
app.listen(port, () => { console.log("listeing on 3000 port") })

    ;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/Login", async (request, response) => {
    try {
        const username = request.body.username;
        const password = request.body.password;
        const salt = "mydSalt"; // Salt קבוע
        const password_hash = await generateHash(password, salt);

        // שימוש בפרמטרים מוכנים למניעת SQL Injection
        const query = `SELECT * FROM users WHERE username = ? AND password_hash = ?`;
        const [result] = await pool.query(query, [username, password_hash]);

        if (result.length > 0) {
            response.send("Login successful!");
        } else {
            console.log("User not found.");
            response.status(401).send("Wrong credentials.");
        }
    } catch (error) {
        response.status(500).send("Server error.");
    }
});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const escapeHtml = (str) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};


app.post("/System_Page", async (request, response) => {
    try {
        const new_customer = request.body.newcustomer;
        console.log("New customer input:", new_customer);

        // קידוד המידע לפני הכנסת הנתון לבסיס הנתונים
        const encoded_customer = escapeHtml(new_customer);

        // שימוש בפרמטרים מוכנים למניעת SQL Injection
        const query = `INSERT INTO customers (name) VALUES (?)`;
        await pool.query(query, [encoded_customer]);

        // שאילתה לאחזור הלקוח שהוסף
        const query2 = `SELECT name FROM customers WHERE name = ?`;
        const [result] = await pool.query(query2, [encoded_customer]);

        // הדפסת שם הלקוח
        const message = `Customer was added successfully: ${result[0].name}`;
        response.status(200).send(message);
    } catch (error) {
        console.log("Error:", error);
        response.status(500).send("Server error.");
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/Change_Password", async (request, response) => {
    try {       
        const username = request.body.username1;
        const password = request.body.CurrentPassword;
        const newpassword = request.body.NewPassword
        const salt = "mydSalt"; // Salt קבוע
        const password_hash = await generateHash(password, salt);

        // שאלת בסיס נתונים לאימות הסיסמה הנוכחית
        const query = `SELECT * FROM users WHERE username = ? AND password_hash = ?`;
        const [result] = await pool.query(query, [username, password_hash]);
        
        // אם נמצא משתמש והסיסמה תקינה, אפשר לעדכן
        if ((result.length > 0) && await validatePassword(username, newpassword) === true && (password!=newpassword)){
            const newPassword_hash = await generateHash(newpassword,salt)
            const updateQuery = `UPDATE users SET password_hash = ? WHERE username = ?`;
            await pool.query(updateQuery, [newPassword_hash, username]);
            response.status(200).send("Password changed successfully.");
        } else {
            response.status(400).send("Invalid password or password policy not met.");
        }

    } catch (error) {
        console.error(error);
        response.status(500).send("Server error.");
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/New_Register", async (request, response) => {
    try {
        const email = request.body.email;
        const username = request.body.username;
        const password = request.body.password;

        const salt = "mydSalt";

        // בדיקת הסיסמה לפי המדיניות
        const passwordError = await validatePassword(username, password);
        if (passwordError === false) {
            response.status(400).send("Invalid password or password policy not met.");
        }

        const password_hash = await generateHash(password, salt);

        // שימוש בפרמטרים מוכנים למניעת SQL Injection
        const query = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
        await pool.query(query, [username, email, password_hash]);

        response.status(200).send("User was added successfully.");
    } catch (error) {
        console.error(error);
        response.status(500).send("Server error.");
    }
});

    //P@ssw0rd#1 aviel_t 21247a1a9bf17bd17e5e1bb3814c038581f9e0ba
    //Gr8#T!me2  yoav_k  bd51b3c537b46313721faeee8e16b400a155072f
    //H@ppyDay3! samara_a 21667ab6a0ec8c1666be91c5a115f533d5c6101b

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post("/Forgot_Password", (req, res) => {
    const { email } = req.body;
    // יצירת טוקן אקראי
    const token = createToken(email);

    // עדכון הטוקן במסד הנתונים
    const sql = "UPDATE users SET reset_token = ? WHERE email = ?";
    pool.query(sql, [token, email])
        
                   
        // שליחת אימייל למשתמש
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'supoortt10@gmail.com',
                pass: 'zugi fojb znig ccvy', // סיסמת אפליקציה
            },
            tls: {
                rejectUnauthorized: false // מוודא שגילוי בעיות תעודת SSL לא יפסק את השליחה
            }
        });
        

        const mailOptions = {
            from: "supoortt10@gmail.com",
            to: email,
            subject: "Password Reset Token",
            text:  `Here is your reset token: ${token}`,
        };
        

        transporter.sendMail(mailOptions, (error, info) => {
            console.log('Preparing to send email...');

            if (error) {
               

                console.error("Error sending email:", error.response || error.message);
                console.log(`Failed to send token to email: ${email}`);
                return res.render("Forgot_Password.ejs", {
                    errorMessage: "Error sending email. Check your email settings.",
                    successMessage: null,
                });
            }
        
            // הצלחת שליחה
            console.log("Email sent successfully!");
            console.log(`Token sent to email: ${email}`);
            console.log("Mail server response:", info.response);
        
            // שמירת האימייל בסשן
            req.session.email = email;
        
            // הפניה לדף Reset_Token
            res.redirect("/Reset_Token");
        });
        
    });


// דף Reset_Token

// טיפול בהגשת טוקן לעדכון סיסמה
app.post("/Reset_Token", async (req, res) => {
    const { token } = req.body; // קריאה מהגוף של הבקשה לטוקן

    if (!token) {
        return res.render("Reset_Token.ejs", { errorMessage: "Token is required." });
    }

    try {
        const sql = "SELECT email FROM users WHERE reset_token = ?";
        const [results] = await pool.query(sql, [token]);

        if (results.length === 0) {
            return res.render("Reset_Token.ejs", { errorMessage: "Invalid or expired token." });
        }

        const email = results[0].email;

        // שמירת האימייל בסשן לצורך דף שינוי סיסמה
        req.session.email = email;
        console.log("Token valid for email:", email);

        // הפניה לדף שינוי סיסמה
        res.redirect("/Change_Password");
    } catch (err) {
        console.error("Error checking token:", err);
        return res.status(500).send("Error checking token.");
    }
});