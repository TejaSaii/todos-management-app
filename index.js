const express = require("express");
const app = express();
const { UserModel, TodoModel } = require("./db");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { SECRET, auth } = require("./auth");
const bcrypt = require("bcryptjs");
const {z} = require("zod");

app.use(express.json());

mongoose.connect(
  "mongodb+srv://Tejas7844:Tejas@cluster0.35jadss.mongodb.net/todos-app-database"
);

app.post("/signup", async (req, res) => {
  const requiredBody = z.object({
    email: z.string().min(5).max(100).email(),
    password: z.string()
      .min(8)
      .regex(/[A-Z]/, "Password must include atleast one uppercase letter")
      .regex(/[a-z]/, "Password must include atleast one lowercase letter")
      .regex(/[0-9]/, "Password must inlucde atleast one numeric value")
      .regex(/[!@#$%^&*-+=]/, "Password must include atleast one special character"),
    name: z.string().min(3).max(100)
  });

  const {success, error} = requiredBody.safeParse(req.body);
  if(!success){
    return res.status(400).json({
      error: error
    });
  }

  const email = req.body.email;
  const user = await UserModel.findOne({
    email
  });
  if(user){
    return res.status(400).json({
      message: "Email already exists"
    })
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  await UserModel.create({
    email: req.body.email,
    password: hashedPassword,
    name: req.body.name,
  });

  res.json({ message: "you are signed up!" });
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const foundUser = await UserModel.findOne({
    email,
  });
  if (!foundUser)
    res.status(403).json({ message: "Incorrect user credentials" });

  if(!bcrypt.compare(password, foundUser.password))
    res.status(403).json({ message: "Incorrect user credentials" });

  const token = jwt.sign(
    {
      id: foundUser._id.toString(),
    },
    SECRET,
    { expiresIn: "1h" }
  );
  res.json({
    token,
  });
});

app.post("/todo", auth, async (req, res) => {
  const newTodo = {
    title: req.body.title,
    done: false,
    userId: req.headers.userId,
  };

  try {
    await TodoModel.create(newTodo);
    res.json({ message: "Todo created Successfully" });
  } catch (e) {
    res.status(400).json("Unable to create todo");
  }
});

app.get("/todos", auth, async (req, res) => {
  try {
    const todos = await TodoModel.find({
      userId: req.headers.userId
    });
    res.json({
      todos: todos,
    });
  } catch (e) {
    res.status(400).json("Unable to retrieve Todos");
  }
});


app.listen(3000, () => {
  console.log("listening on port 3000");
});
