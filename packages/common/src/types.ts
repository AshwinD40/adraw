import { z } from "zod";

const EmailSchema = z.string().trim().toLowerCase().email();
const PasswordSchema = z.string().min(6).max(72);
const RoomIdSchema = z.number().int().positive();

export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().trim().min(2).max(100),
});

export const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const CreateRoomSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
});

export const JoinRoomMessageSchema = z.object({
  type: z.literal("join_room"),
  roomId: RoomIdSchema,
});

export const LeaveRoomMessageSchema = z.object({
  type: z.literal("leave_room"),
  roomId: RoomIdSchema,
});

export const ChatMessageSchema = z.object({
  type: z.literal("chat"),
  roomId: RoomIdSchema,
  message: z.string().trim().min(1).max(1000),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  JoinRoomMessageSchema,
  LeaveRoomMessageSchema,
  ChatMessageSchema,
]);

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
