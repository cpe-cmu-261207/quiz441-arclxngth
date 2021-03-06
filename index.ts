import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import { body, query, validationResult } from 'express-validator'

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"

interface JWTPayload {
  username: string;
  password: string;
}

app.post('/login',
  body('username').isString(),
  body('password').isString(),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid username or password" })

    const { username, password } = req.body
    // Use username and password to create token.
    const buffer = fs.readFileSync("./db.json", { encoding: "utf-8" });
    const data = JSON.parse(buffer);

    const isCompleted = data.users.find((value: 
      { username: any; password: string }) => value.username === username 
                                              && value.password === password
    );

    if (isCompleted) {
      const token = jwt.sign({ username: isCompleted.username },SECRET);
      return res.status(200).json({
        message: 'Login succesfully',
        token,
      })
    }

    return res.status(400).json({
      message: "Invalid username or password"
    })
  })

app.post('/register',
  body('username').isString(),
  body('password').isString(),
  body('firstname').isString(),
  body('lastname').isString(),
  body('balance').isInt(),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })

    const { username, password, firstname, lastname, balance } = req.body
    const newUser = { username, password, firstname, lastname, balance };

    const buffer = fs.readFileSync("./db.json", { encoding: "utf-8" });
    const data = JSON.parse(buffer);

    const isExistUser = data.users.find((value: { username: any }) => value.username === username);

    if(isExistUser){
      return res.status(400).json({
        message: "Username is already in used"
      })
    }

    data.users.push(newUser);
    fs.writeFileSync("./db.json", JSON.stringify(data));

    return res.status(200).json({
      message: "Register successfully"
    })
  })  

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload

      const buffer = fs.readFileSync("./db.json", { encoding: "utf-8" });
      const data = JSON.parse(buffer);

      let balance;

      const targetUser = data.users.map((value: { username: string, balance: number }) => {
        if(value.username === username){
          balance = value.balance;
          return
        }
      })
  
      return res.status(200).json({
        name: username,
        balance: balance,
      })

    }
    catch (e) {
      //response in case of invalid token
      return res.status(401).json({
        message: "Invalid Token"
      })
    }
  })

app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  (req, res) => {

    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })

    const token = req.query

    if(!token){
      return res.status(401).json({
        message: "Invalid Token"
      })
    }

    const token2 = token.token as string

    const { amount } = req.body

    try {
      const { username } = jwt.verify(token2, SECRET) as JWTPayload

      const buffer = fs.readFileSync("./db.json", { encoding: "utf-8" });
      const data = JSON.parse(buffer);

      let balance;

      const targetUser = data.users.map((value: { username: string, balance: number }) => {
        if(value.username === username){
          balance = value.balance + amount;
          value.balance = balance
          return value;
        }
      })

      fs.writeFileSync("./db.json", JSON.stringify(data));

  
      return res.status(200).json({
        message: "Deposit Successfully",
        balance: balance,
      })

    }
    catch (e) {
      //response in case of invalid token
      return res.status(401).json({
        message: "Invalid Token"
      })
    }
  })

app.post('/withdraw',
  body('amount').isInt({ min: 1 }),
  (req, res) => {

    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })

    const token = req.query

    if(!token){
      return res.status(401).json({
        message: "Invalid Token"
      })
    }

    const token2 = token.token as string

    const { amount } = req.body

    try {
      const { username } = jwt.verify(token2, SECRET) as JWTPayload

      const buffer = fs.readFileSync("./db.json", { encoding: "utf-8" });
      const data = JSON.parse(buffer);

      let balance;

      const targetUser = data.users.map((value: { username: string, balance: number }) => {
        if(value.username === username){
          balance = value.balance - amount;

          if(balance < 0 ) return res.status(400).json({ message: "Invalid data" })

          value.balance = balance
          return value;
        }
      })

      fs.writeFileSync("./db.json", JSON.stringify(data));

  
      return res.status(200).json({
        message: "Withdraw Successfully",
        balance: balance,
      })

    }
    catch (e) {
      //response in case of invalid token
      return res.status(401).json({
        message: "Invalid Token"
      })
    }
  })

app.delete('/reset', (req, res) => {

  const buffer = fs.readFileSync("./db.json", { encoding: "utf-8" });
  const data = JSON.parse(buffer);

  data.users = [];
  fs.writeFileSync("./db.json", JSON.stringify(data));
  
  //code your database reset here
  
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  return res.status(200).json({
    firstname: "HONG LENG",
    lastname: "TOH",
    code: "620610819",
    gpa: "3.88",
  })
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))