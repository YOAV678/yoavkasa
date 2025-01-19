
import express, { request, response } from "express"
import mysql from 'mysql2'
import { validatePassword } from "./config/Password_Policy.js"
//Server:
const app = express()
const port = 3000

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123123',
    database: 'communication_ltd',
    port: 3306

}).promise()





app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: true }))

//home page:
app.get("/Main_Page", (request, response) => { response.render('Main_Page.ejs') })

//other pages:
app.get("/Change_Password", (request, response) => { response.render('Change_Password.ejs') })
app.get("/Forgot_Password", (request, response) => { response.render('Forgot_Password.ejs') })
app.get("/Login", (request, response) => { response.render('Login.ejs') })
app.get("/New_Register", (request, response) => { response.render('New_Register.ejs') })
app.get("/System_Page", (request, response) => { response.render('System_Page.ejs') })
app.listen(port, () => { console.log("listeing on 3000 port") })

    ;
    app.post("/Login", async (request, response) => {
        try {
            const username = request.body.username;
            const password_hash = request.body.password;
           

            // testing function
            const userPassword = "MySecureP@ssword1";
            const userHistory = ["OldPass1", "OldPass2", "MySecureP@ssword1"];

            console.log(validatePassword(userPassword, userHistory))


            // //הפיכת הקלט PASSWORD לHASH
            // const hmac =45;
            // hmac.update(password + salt);
            // const hashedPassword = hmac.digest('hex');
            // בניית השאילתה ישירות עם הערכים
            const query = `SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password_hash}'`;
            
            const [result] = await pool.query(query);
            
            if (result.length > 0) {
                console.log("User found:", result);
                response.send("Login successful!");
            } else {
                console.log("User not found.");
                response.status(401).send("Invalid credentials.");
            }
        } catch (error) {
            console.error("Error:", error);
            response.status(500).send("Server error.");
        }
    });

    
    