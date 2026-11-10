import {
  Router,
  type IRouter,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  AskGlobalEdgeBody,
  GetResearchRuntimeStatusResponse,
} from "@workspace/api-zod";
import {
  askResearch,
  getQuestionMaxLength,
  getResearchRuntimeStatus,
  ResearchServiceError,
} from "../lib/research";

const router: IRouter = Router();
const acceptedQuestionFields = new Set(["question", "requestId"]);
const ASK_WINDOW_MS = 60_000;
const ASK_LIMIT_PER_WINDOW = 60;
let askWindowStartedAt = Date.now();
let askCountInWindow = 0;

router.get("/status", (_req, res, next) => {
  try {
    const result = GetResearchRuntimeStatusResponse.parse(
      getResearchRuntimeStatus(),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/ask",
  (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (now - askWindowStartedAt >= ASK_WINDOW_MS) {
      askWindowStartedAt = now;
      askCountInWindow = 0;
    }
    if (askCountInWindow >= ASK_LIMIT_PER_WINDOW) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({
        code: "RATE_LIMITED",
        message:
          "The research service is receiving too many requests. Try again shortly.",
      });
      return;
    }
    askCountInWindow += 1;
    next();
  },
  async (req, res) => {
    const body: unknown = req.body;
    if (!isRecord(body)) {
      res.status(400).json({
        code: "INVALID_REQUEST",
        message: "Send a JSON object with a question and requestId.",
      });
      return;
    }
    if (Object.keys(body).some((key) => !acceptedQuestionFields.has(key))) {
      res.status(400).json({
        code: "INVALID_REQUEST",
        message: "The request contains unsupported fields.",
      });
      return;
    }
    if (typeof body.question !== "string") {
      res.status(400).json({
        code: "INVALID_QUESTION",
        message: "Enter a research question.",
      });
      return;
    }

    const question = body.question.trim();
    if (!question) {
      res.status(400).json({
        code: "INVALID_QUESTION",
        message: "Enter a research question.",
      });
      return;
    }
    if (question.length > getQuestionMaxLength()) {
      res.status(400).json({
        code: "QUESTION_TOO_LONG",
        message: `Questions must be ${getQuestionMaxLength()} characters or fewer.`,
      });
      return;
    }

    const parsed = AskGlobalEdgeBody.safeParse({
      question,
      requestId: body.requestId,
    });
    if (!parsed.success) {
      res.status(400).json({
        code: "INVALID_REQUEST",
        message: "The request question or request ID is invalid.",
      });
      return;
    }

    try {
      const result = await askResearch(parsed.data);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ResearchServiceError) {
        req.log.warn({ code: error.code }, "Research request did not complete");
        res.status(error.httpStatus).json({
          code: error.code,
          message: error.message,
        });
        return;
      }

      req.log.error("Unexpected research service error");
      res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "The research request could not be completed.",
      });
    }
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default router;
