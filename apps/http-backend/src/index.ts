import express from "express";
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateUserSchema, SignInSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();

app.get("/", (req, res) => {
  res.send("Kya re ghochu, kyu ese betha hai, kuchh karna nahi hai kya?");
});

app.post("/signup", (req, res) => {
  // db call here
  const data = CreateUserSchema.safeParse(req.body);
  if(!data.success ) {
    res.status(400).json({
      message: "Incorrect Input",
    })
    return;
  }
  res.json({
    userId: 123,
  })
})

app.post("/signin", (req, res) => {

  const data = SignInSchema.safeParse(req.body);
  if(!data.success ) {
    res.status(400).json({
      message: "Incorrect Input",
    })
    return;
  }

  const userId = 1;

  const token = jwt.sign({
    userId,
  }, JWT_SECRET)

  res.json({
    token
  })

})

app.post("/room", middleware, (req, res) => {

  const data = CreateRoomSchema.safeParse(req.body);
  if(!data.success ) {
    res.status(400).json({
      message: "Incorrect Input",
    })
    return;
  }

  
  res.json({
    roomId: 123,
  })
});


app.listen(3001, () => {
  console.log("Server is running on port 3001");
})