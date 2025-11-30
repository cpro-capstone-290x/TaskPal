import winston from "winston";

const { combine, timestamp, json, colorize, printf } = winston.format;

// Pretty format for local development
const devFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

// Production JSON format for BetterStack
const prodFormat = combine(
  timestamp(),
  json() // BetterStack loves this
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: process.env.NODE_ENV === "production"
    ? prodFormat
    : combine(colorize(), timestamp(), devFormat),
  defaultMeta: {
    service: "TaskPal", // Ensure all logs are grouped under TaskPal
  },
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;
