import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "16kb", strict: true }));

app.use("/api", router);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    isRecord(error) && typeof error.status === "number" ? error.status : 500;
  if (status === 413) {
    res.status(413).json({
      code: "REQUEST_TOO_LARGE",
      message: "The request body exceeds the 16 KB limit.",
    });
    return;
  }
  if (isRecord(error) && error.type === "entity.parse.failed") {
    res.status(400).json({
      code: "INVALID_JSON",
      message: "The request body must be valid JSON.",
    });
    return;
  }
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "The request could not be completed.",
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default app;
