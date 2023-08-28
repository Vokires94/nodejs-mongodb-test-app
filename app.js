const auth = require("./auth");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const Products = require("./db/productsModel");

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// execute database connection 
dbConnect();

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});

// products get endpoint
app.get("/products", (request, response) => {
  const products = Products.find({ user: request.query.id })
  products
    .then((result) => {
      response.status(201).send({
        message: "Products received",
        result,
      });
    })
    // catch error if the no products table in database
    .catch((error) => {
      response.status(500).send({
        message: "Error getting products",
        error,
      });
    });
});

// product delete endpoint
app.delete("/products/delete", async (request, response) => {
  try {
    const row = await Products.deleteOne({ _id: request.query.id });
    response.status(201).send({
      message: row,
    });
  }
  catch (err) {
    response.status(500).send({
      message: "Error ",
    });
  }
});

// product post update items endpoint
app.post("/products/update", async (request, response) => {

  const doc = await Products.findOne({ _id: request.body.id });
  try {
    const product = await doc.updateOne({
      items: request.body.items,
      amount: request.body.amount,
    });
    response.status(201).send({
      message: 'Updated Successfully',
    });
  }
  catch (err) {
    response.status(500).send({
      message: "Error ",
    });
  }

});

// product post new items endpoint
app.post("/products/add", (request, response) => {

  // create a new product instance and collect the data
  const product = new Products({
    items: request.body.items,
    amount: request.body.amount,
    user: request.body.id,
  });

  // save the new product
  product
    .save()
    // return success if the new product is added to the database successfully
    .then((result) => {
      response.status(201).send({
        message: "Product Created Successfully",
        result,
      });
    })
    // catch error if the new product wasn't added successfully to the database
    .catch((error) => {
      response.status(500).send({
        message: "Error creating product",
        error,
      });
    });
});

// register endpoint
app.post("/register", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {

      //   create JWT token
      const token = jwt.sign(
        {
          email: request.body.email,
          password: hashedPassword,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );

      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        password: hashedPassword,
        token
      });

      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result: { userId: user._id, email: user.email, token: user.token },
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((error) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        error,
      });
    });
});

// login endpoint
app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {

          // check if password matches
          if (!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          user.token = token;

          //   return success response
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            userId: user._id,
            token,
          });
        })
        // catch error if password does not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((error) => {
      response.status(404).send({
        message: "Email not found",
        error,
      });
    });
});

// logout endpoint
app.put("/logout", (request, response) => {
  // update user
  User.findOneAndUpdate({ email: request.body.email }, { token: "" }, { new: true })
    // if user updated
    .then(() => {
      //  return success response
      response.status(200).send({
        message: "Logout Successful",
      });
    })
    // catch error if email does not exist
    .catch((error) => {
      response.status(404).send({
        message: "Logout error",
        error,
      });
    });
});

// free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "You are authorized to access me" });
});


module.exports = app;
