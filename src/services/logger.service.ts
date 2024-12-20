// LoggerService.ts
import { Service } from "typedi";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { format } from "winston";
import config from "../configs";

@Service()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          let logString = `${timestamp} [${level.toUpperCase()}] ${message}`;

          // Attach meta information if available
          if (Object.keys(meta).length > 0) {
            logString += ` | Meta: ${JSON.stringify(meta)}`;
          }

          return logString;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new DailyRotateFile({
          dirname: config.logLocation,
          filename:  `${config.microserviceName}-%DATE%.log`,
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "30d",
        }),
      ],
    });
  }

  log(level: string, message: string, meta?: object) {
    this.logger.log(level, message, meta); // Log with meta information
  }

  info(message: string, meta?: object) {
    this.logger.info(message, meta); // Log info with meta
  }

  error(message: string, meta?: object) {
    this.logger.error(message, meta); // Log error with meta
  }

  warn(message: string, meta?: object) {
    this.logger.warn(message, meta); // Log warning with meta
  }

  debug(message: string, meta?: object) {
    this.logger.debug(message, meta); // Log debug with meta
  }
}
