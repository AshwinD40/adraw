import { z } from "zod";

export const CreateUserSchema = z.object({
  username: z.string().min(4).max(20),
  password: z.string().min(6),
  name: z.string().min(4).max(100)

})

export const SignInSchema = z.object({
  username: z.string().min(4).max(20),
  password: z.string().min(6)

})

export const CreateRoomSchema = z.object({
  name: z.string().min(4).max(100),
})