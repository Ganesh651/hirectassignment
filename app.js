const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, "products.db")
let db = null 

const initializeDBAndServer = async ()=>{
      try{
            db = await open({
                  filename: dbPath,
                  driver: sqlite3.Database
            })
            app.listen(5000, ()=>console.log("Server Running"))
      }catch(e){
            console.log(e.message)
            process.exit(1)
      }
}

initializeDBAndServer()


app.post("/register", async (req,res)=>{
      const {username,password} = req.body
      const hashedPaasword = await bcrypt.hash(password,12)

      const isUserExist = `SELECT * FROM users WHERE username = "${username}"`
      const dbResponse = await db.get(isUserExist)

      if(dbResponse !== undefined){
            res.send("User already exits")
      }else{
            const createNewUser = `INSERT INTO users (username, password) VALUES ("${username}","${hashedPaasword}");`
            const dbResponse = await db.run(createNewUser)
            res.send("Account Created")
      }
})

app.post("/login", async(req,res)=>{
      const {username,password} = req.body
      const isUserExist = `SELECT * FROM users WHERE username = "${username}"`
      const dbResponse = await db.get(isUserExist)

      if (dbResponse === undefined){
            res.send("User not found")
      }else{
            const dbUserPassword = await bcrypt.compare(password,dbResponse.password)
            if (!dbUserPassword){
                  res.send({"error_msg": "Password didn't match"})
            }else{
                  const payload = {username: username}
                  const jwtToken = jwt.sign(payload,"gajarla")
                  res.send(jwtToken)
            }
      }
})

const authUser = (req,res,next)=>{
      let jwtToken 

      const authHeader = req.headers["authorization"]
      if( authHeader !== undefined){
            jwtToken = authHeader.split(" ")[0]
      }
      if(jwtToken === undefined){
            res.send({message: "Missing Authentication Token"})
      }else{
            jwt.verify(jwtToken,"gajarla", async(error,payload)=>{
                  if(error){
                        res.send({message: "Missing Authentication Token"})
                  }else{
                        next()
                  }
            })
      }
}

