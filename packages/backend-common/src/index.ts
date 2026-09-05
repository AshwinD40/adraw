import dotenv from "dotenv";
import path from "path";

// This package lives at packages/backend-common. In both src/ and dist/, three
// parent directories lead to the monorepo root, where the local .env belongs.
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function portFromEnvironment(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }

  return port;
}

export const NODE_ENV = process.env.NODE_ENV || "development";
export const JWT_SECRET = requiredEnvironmentVariable("JWT_SECRET");
export const DATABASE_URL = requiredEnvironmentVariable("DATABASE_URL");
export const HTTP_PORT = portFromEnvironment("HTTP_PORT", 3001);
export const WS_PORT = portFromEnvironment("WS_PORT", 8080);
