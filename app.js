const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors")
const jwt = require("jsonwebtoken");

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const { error } = require("console");

const app = express()
app.use(cors())
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

app.post("/add-products", authUser, async(req,res)=>{
      const {image,title,category,price}  =  req.body 

     try{
            const addProduct = `INSERT INTO products (image,title,category,price) VALUES("${image}","${title}","${category}",${price});`
            const dbResponse = await db.run(addProduct)
            res.send({message:"Product has been added"})
     }catch(error){
      console.log(error)
     }
})

app.delete("/delete-product/:id", authUser, async(req,res)=>{
      const {id} = req.params 
      const deleteProduct = `DELETE FROM products WHERE id = ${id}`
      const dbResponse = await db.run(deleteProduct)
      res.send("Product removed")
})

app.get("/products", authUser, async(req,res)=>{
      const getProducts = `SELECT * FROM products`
      const dbResponse = await db.all(getProducts)
      res.send(dbResponse)
})

app.get("/products/:id", authUser, async(req,res)=>{
      const {id} = req.params 
      const getSpecificProduct = `SELECT * FROM products WHERE id = ${id}`
      const dbResponse = await db.get(getSpecificProduct)
      res.send(dbResponse)
})