
import express, { request, response } from "express"
//Server:
const app=express()
const port=3000


app.set('view-engine', 'ejs')
  
//home page:
app.get("/Main_Page",(request,response) => {response.render('Main_Page.ejs')})

//other pages:
app.get("/Change_Password",(request,response) => {response.render('Change_Password.ejs')})
app.get("/Forgot_Password",(request,response) => {response.render('Forgot_Password.ejs')})
app.get("/Login",(request,response) => {response.render('Login.ejs')})
app.get("/New_Register",(request,response) => {response.render('New_Register.ejs')})
app.get("/System_Page",(request,response) => {response.render('System_Page.ejs')})
app.listen(port,()=>{console.log("listeing on 3000 port")})

;

