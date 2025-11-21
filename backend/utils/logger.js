import winston from "winston";

const { combine, timestamp, json, colorize, printf } = winston.format;

// Pretty format for development
const devFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format:
    process.env.NODE_ENV === "production"
      ? combine(timestamp(), json())        // Render gets JSON logs
      : combine(colorize(), timestamp(), devFormat),  // Local dev
  transports: [
    new winston.transports.Console(),       // IMPORTANT: Render captures these
  ],
});

export default logger;
