const express = require('express');
const cors = require('cors');
require('./db/Config')
const User = require('./db/User')
const Product = require('./db/Product')
const Jwt = require('jsonwebtoken')
const app = express();

app.use(express.json());
const jwtKey = 'e-commerce'

app.use(cors());

app.use(express.static('dist'));

app.post('/register', async (req, res) => {
  let user = new User(req.body)
  let result = await user.save();
  // result= result.toObject();
  // delete result.password;
  Jwt.sign({ result }, jwtKey, (err, token) => {
    if (err) {
      res.send({ result: "Something went wrong, please try again" })
    }
    res.send({ result, auth: token })
  })
})

app.post('/login', async (req, res) => {
  if (req.body.email && req.body.password) {
    let user = await User.findOne(req.body).select('-password');
    if (user) {
      Jwt.sign({ user }, jwtKey, (err, token) => {
        if (err) {
          res.send({ result: "Something went wrong, please try again" })
        }
        res.send({ user, auth: token })
      })
    } else {
      res.send({ result: 'Result not found' })
    }
  } else {
    res.send({ result: 'Result not found' })
  }
})

app.post('/add-product', verifyToken, async (req, res) => {
  let product = new Product(req.body)
  let result = await product.save();
  res.send(result)
})

app.get('/products', verifyToken, async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products)
  } else {
    res.send({ result: 'Result not found' })
  }
})

app.delete('/product/:id', verifyToken, async (req, res) => {
  let result = await Product.deleteOne({ id: req.params.id });
  res.send(result)
})

app.get('/product/:id', verifyToken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result)
  } else {
    res.send({ result: 'Result not found' })
  }
})

app.put('/product/:id', verifyToken, async (req, res) => {
  let result = await Product.updateOne({ _id: req.params.id }, { $set: req.body });
  res.send(result)
})

app.get('/search/:key', verifyToken, async (req, res) => {
  let result = await Product.find({
    "$or": [
      { name: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { company: { $regex: req.params.key } }
    ]
  })
  if (result.length > 0) {
    res.send(result)
  } else {
    res.send({ result: 'Result not found' })
  }
})

function verifyToken(req, res, next) {
  let token = req.headers['authorization']
  if(token){
    token = token.split(' ')[1];
    console.log(token)
    Jwt.verify(token, jwtKey, (err, decoded) => {
      if (err) {
        res.status(401).send({ result: "Something went wrong, please provide valid token" })
      }else{
        next();
      }
    })
  }else{
    res.status(403).send({ result: "Please add token with header" })
  }

}


app.listen(2000);