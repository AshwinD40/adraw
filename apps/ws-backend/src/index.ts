import { RawData, WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";

import { JWT_SECRET, WS_PORT } from "@repo/backend-common/config";
import { ClientMessageSchema, type ClientMessage } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

interface TokenPayload extends JwtPayload {
  userId: string;
}

type Client = {
  ws: WebSocket;
  userId: string;
  rooms: Set<number>;
};

const clients = new Map<WebSocket, Client>();

const port = WS_PORT || 8080;
const wss = new WebSocketServer({ port });

function getUserId(token: string | null): string | null {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

function send(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function parseMessage(data: RawData): ClientMessage | null {
  try {
    const value: unknown = JSON.parse(data.toString());
    const result = ClientMessageSchema.safeParse(value);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function handleMessage(client: Client, rawData: RawData) {
  const message = parseMessage(rawData);

  if(!message) {
    send(client.ws, {
      type: "error",
      message: "Invalid WebSocket message",
    });
    return;
  }

  if(message.type === "join_room") {
    const room = await prismaClient.room.findUnique({
      where: { id: message.roomId },
      select: { id: true },
    });

    if(!room) {
      send(client.ws, {
        type: "error", 
        message: "Room not found",
      });
      return;
    }

    client.rooms.add(room.id);

    send(client.ws, {
      type: "joined_room",
      roomId: room.id,
    });
    return;
  }

  if (message.type === "leave_room") {
    client.rooms.delete(message.roomId);

    send(client.ws,  {
      type: "left_room",
      roomId: message.roomId,
    });
    return;
  }

  if (!client.rooms.has(message.roomId)) {
    send(client.ws, {
      type: "error",
      message: "Join the room before sending a message",
    });
    return;
  }

  const chat = await prismaClient.chat.create({
    data: {
      roomId: message.roomId,
      userId: client.userId,
      message: message.message,
    },
    select: {
      id: true,
      roomId: true,
      userId: true,
      message: true,
      createdAt: true,
    },
  });

  for (const recipient of clients.values()) {
    if (recipient.rooms.has(chat.roomId)) {
      send(recipient.ws, {
        type: "chat",
        chat,
      });
    }
  }
}

wss.on("connection", (ws, request ) => {
  const url = new URL(
    request.url || "/",
    `ws://${request.headers.host || "localhost"}`
  );

  const userId = getUserId(url.searchParams.get("token"));

  if (!userId) {
    ws.close(1008, "Unauthorized");
    return;
  }

  const client: Client = {
    ws,
    userId,
    rooms: new Set<number>(),
  };

  clients.set(ws, client);

  send(ws, {
    type: "connected",
    userId,
  });

  ws.on("message", (data) => {
    handleMessage(client, data).catch(() => {
      send(ws, {
        type: "error",
        message: "Could not process message",
      });
    });
  });


  ws.on("close", () => {
    clients.delete(ws);
  });

  ws.on("error", () => {
    clients.delete(ws);
  });
})

console.log(`WebSocket server running on port ${port}`);
