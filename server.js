const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const INQUIRY_LOG = path.join(DATA_DIR, "inquiries.ndjson");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const RECIPIENT_EMAIL = process.env.INQUIRY_EMAIL || "ichingciv@gmail.com";
const SENDMAIL_PATH = process.env.SENDMAIL_PATH || "sendmail";
const MAX_BODY_SIZE = 1024 * 1024;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

const LEGACY_REDIRECTS = {
  "/index.html": "/",
  "/guanju": "/guanju/index.html",
  "/guanju/": "/guanju/index.html",
  "/main": "/",
  "/main/index.html": "/",
  "/main/books.html": "/books.html",
  "/main/conferences.html": "/conferences.html",
  "/main/guanju-society.html": "https://www.ichingciv.net/",
  "/main/journal.html": "https://ichingandcivilization.org/",
  "/main/lectures.html": "/lectures.html",
  "/main/research-areas.html": "/research-areas.html",
  "/main/research-team.html": "/research-team.html",
  "/main/student-associations.html": "/student-associations.html",
  "/main/site.js": "/site.js",
  "/main/subpages.css": "/subpages.css",
  "/guanju-society.html": "https://www.ichingciv.net/",
  "/journal.html": "https://ichingandcivilization.org/",
};

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  res.end(text);
}

function redirect(res, statusCode, location) {
  res.writeHead(statusCode, {
    Location: location,
    "Cache-Control": "no-store",
  });
  res.end();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function sanitizeHeader(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function pickTopicLabel(topic) {
  const labels = {
    consulting: "Consulting",
    education: "Education",
    event: "Events and Lectures",
    fellowship: "Fellowship",
    health: "Health",
    law: "Law / Mediation Culture",
    publication: "Publications",
    research: "Academic Collaboration",
    relationship: "Relationship",
  };
  return labels[topic] || "Website Inquiry";
}

function normalizeRecord(input) {
  const record = {
    email: String(input.email || "").trim(),
    lang: String(input.lang || "zh").trim().toLowerCase(),
    message: String(input.message || "").trim(),
    name: String(input.name || "").trim(),
    organization: String(input.organization || "").trim(),
    page: String(input.page || "").trim(),
    phone: String(input.phone || "").trim(),
    subject: String(input.subject || "").trim(),
    timeline: String(input.timeline || "").trim(),
    topic: String(input.topic || "consulting").trim(),
  };

  if (!record.name) {
    throw new ValidationError("name is required");
  }

  if (!record.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    throw new ValidationError("a valid email is required");
  }

  if (!record.message) {
    throw new ValidationError("message is required");
  }

  if (record.message.length > 8000) {
    throw new ValidationError("message is too long");
  }

  return {
    ...record,
    submittedAt: new Date().toISOString(),
    topicLabel: pickTopicLabel(record.topic),
  };
}

async function persistInquiry(record) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.appendFile(INQUIRY_LOG, `${JSON.stringify(record)}\n`, "utf8");
}

function buildMailMessage(record) {
  const subjectParts = [
    "[Website Inquiry]",
    record.topicLabel,
    sanitizeHeader(record.name),
  ].filter(Boolean);
  const subject = subjectParts.join(" ");
  const lines = [
    `To: ${RECIPIENT_EMAIL}`,
    "From: Website Form <site-form@localhost>",
    `Reply-To: ${sanitizeHeader(record.email)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "New inquiry from the website",
    "",
    `Name: ${record.name}`,
    `Email: ${record.email}`,
    `Organization: ${record.organization || "-"}`,
    `Phone: ${record.phone || "-"}`,
    `Topic: ${record.topicLabel}`,
    `Page: ${record.page || "-"}`,
    `Language: ${record.lang || "-"}`,
    `Timeline: ${record.timeline || "-"}`,
    `Subject line: ${record.subject || "-"}`,
    `Submitted at: ${record.submittedAt}`,
    "",
    "Message:",
    record.message,
    "",
  ];
  return lines.join("\n");
}

function deliverMail(record) {
  if (process.env.DISABLE_SENDMAIL === "1") {
    return Promise.resolve({ delivered: false, reason: "disabled" });
  }

  return new Promise((resolve) => {
    const child = spawn(SENDMAIL_PATH, ["-t", "-oi"]);
    let stderr = "";

    child.on("error", (error) => {
      resolve({ delivered: false, reason: error.message });
    });

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ delivered: true });
        return;
      }

      resolve({
        delivered: false,
        reason: stderr.trim() || `sendmail exited with code ${code}`,
      });
    });

    child.stdin.end(buildMailMessage(record));
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
        reject(new ValidationError("request body is too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new ValidationError("request body must be valid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function safeFilePath(urlPathname) {
  const trimmed = decodeURIComponent(urlPathname.split("?")[0]);
  const normalized =
    trimmed === "/" || trimmed === ""
      ? "/index.html"
      : trimmed === "/consulting"
        ? "/consulting.html"
        : trimmed;
  const resolved = path.normalize(path.join(ROOT, normalized));

  if (!resolved.startsWith(ROOT)) {
    return null;
  }

  return resolved;
}

async function serveStatic(res, filePath) {
  try {
    const stats = await fsp.stat(filePath);

    if (stats.isDirectory()) {
      sendText(res, 404, "Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
      "Content-Type": contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    sendText(res, 404, "Not Found");
  }
}

function buildMailFallbackUrl(record) {
  const subject = encodeURIComponent(
    `[Website Inquiry] ${record.topicLabel} ${record.name}`,
  );
  const body = encodeURIComponent(
    [
      `Name: ${record.name}`,
      `Email: ${record.email}`,
      `Organization: ${record.organization || "-"}`,
      `Phone: ${record.phone || "-"}`,
      `Topic: ${record.topicLabel}`,
      "",
      record.message,
    ].join("\n"),
  );
  return `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
}

function requestHandler(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      recipient: RECIPIENT_EMAIL,
      sendmailPath: SENDMAIL_PATH,
      time: new Date().toISOString(),
    });
    return;
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/inquiry") {
    (async () => {
      try {
        const payload = await readJsonBody(req);
        const record = normalizeRecord(payload);
        await persistInquiry(record);
        const mailResult = await deliverMail(record);

        sendJson(res, mailResult.delivered ? 200 : 202, {
          ok: true,
          delivered: Boolean(mailResult.delivered),
          mailFallbackUrl: buildMailFallbackUrl(record),
          reason: mailResult.reason || null,
          recipient: RECIPIENT_EMAIL,
          stored: true,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          sendJson(res, 400, {
            ok: false,
            error: error.message,
          });
          return;
        }

        sendJson(res, 500, {
          ok: false,
          error: "internal server error",
        });
      }
    })();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendText(res, 405, "Method Not Allowed");
    return;
  }

  if (LEGACY_REDIRECTS[requestUrl.pathname]) {
    redirect(res, 302, LEGACY_REDIRECTS[requestUrl.pathname]);
    return;
  }

  if (
    requestUrl.pathname === "/consult" ||
    requestUrl.pathname === "/consulting" ||
    requestUrl.pathname === "/consulting.html"
  ) {
    redirect(res, 302, "https://ichingciv.com/");
    return;
  }

  if (requestUrl.pathname === "/consult/en") {
    redirect(res, 302, "https://ichingciv.com/en/index.html");
    return;
  }

  if (requestUrl.pathname === "/consult/zh") {
    redirect(res, 302, "https://ichingciv.com/zh/index.html");
    return;
  }

  const filePath = safeFilePath(requestUrl.pathname);

  if (!filePath) {
    sendText(res, 404, "Not Found");
    return;
  }

  serveStatic(res, filePath);
}

const server = http.createServer(requestHandler);

server.listen(PORT, HOST, () => {
  const summary = {
    recipient: RECIPIENT_EMAIL,
    root: ROOT,
    sendmail: SENDMAIL_PATH,
    url: `http://${HOST}:${PORT}`,
  };

  console.log(
    `Website server running at ${summary.url}\n` +
      `Recipient: ${summary.recipient}\n` +
      `Static root: ${summary.root}\n` +
      `Sendmail: ${summary.sendmail}`,
  );
});
