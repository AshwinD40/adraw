import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { JWT_SECRET, HTTP_PORT } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

import { 
  CreateUserSchema, 
  SignInSchema, 
  CreateRoomSchema 
} from "@repo/common/types";

import { middleware } from "./middleware";

const app = express();
const port = HTTP_PORT || 3001;

app.use(
  cors({
     origin: process.env.WEB_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json({ limit: "16kb" }));

app.get("/health", async (_req, res) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "database unavailable" });
  } 
})

app.post("/signup", async (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: "Invalid signup data" });
    return;
  }

  try {
    const password = await bcrypt.hash(result.data.password, 10);

    const user = await prismaClient.user.create({
      data: {
        email: result.data.email,
        password,
        name: result.data.name,
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if ((error as { code?: string}).code === "P2002") {
      res.status(409).json({ message: "Email is already registered" });
      return;
    }

    res.status(500).json({ message: "Could not create user" });
  }
});

app.post("/signin", async (req, res) => {
  const result = SignInSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: "Invalid signin data" });
    return;
  }

  try {
    const user = await prismaClient.user.findUnique({
      where: { email: result.data.email },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      result.data.password,
      user.password
    );      

    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch {
    res.status(500).json({ message: "Could not sign in" });
  }
});

app.post("/rooms", middleware, async (req, res) => {
  const result = CreateRoomSchema.safeParse(req.body);
  
  if (!result.success) {
    res.status(400).json({ message: "invalid room name" });
    return;
  }

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: result.data.slug,
        adminId: req.userId!,
      },
    });

    res.status(201).json({
      room: {
        id: room.id,
        slug: room.slug,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    if ((error as { code?: string}).code === "P2002") {
      res.status(409).json({ message: "Room name already exists" });
      return;
    }

    res.status(500).json({ message: "Could not create room" });
  }
});

app.get("/rooms/:slug", middleware, async (req, res) => {
  const slug = req.params.slug;

  if(typeof slug !== "string") {
    res.status(400).json({ message: "invalid room slug" });
    return;
  }

  try {
    const room = await prismaClient.room.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        createdAt: true,
        adminId: true,
      },
    });

    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }

    res.json({ room });
  } catch {
    res.status(500).json({ message: "Could not fetch room" });
  }
});

app.get("/rooms/:roomId/chats", middleware, async (req, res) => {
  const roomId = Number(req.params.roomId);

  if(!Number.isInteger(roomId) || roomId < 1) {
    res.status(400).json({ message: "Invalid room id" });
    return;
  }

  try {
    const chats = await prismaClient.chat.findMany({
      where: { roomId },
      orderBy: { id: "asc"},
      take: 100,
      select: {
        id: true,
        roomId: true,
        userId: true,
        message: true,
        createdAt: true,
      },
    });

    res.json({ chats });
  } catch {
    res.status(500).json({ message: "Could not fetch chats" });
  }
});

app.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});
