const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 10000;

// Backend-only playlist configuration.
// Change this value later if you want to replace the playlist.
const PLAYLIST_URL =
  "https://www.youtube.com/watch?v=yZ_UkMJHEAk&list=PLVwbgC8mRDea4xoSwC0ZNMiIr8OHiaFog";

const PLAYLIST_ID = new URL(PLAYLIST_URL).searchParams.get("list");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/api/playlist") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });

    res.end(JSON.stringify({ playlistId: PLAYLIST_ID }));
    return;
  }

  let requestedPath = requestUrl.pathname === "/"
    ? "/index.html"
    : requestUrl.pathname;

  requestedPath = decodeURIComponent(requestedPath);

  // Prevent path traversal outside the project directory.
  const filePath = path.resolve(__dirname, "." + requestedPath);
  if (!filePath.startsWith(path.resolve(__dirname))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
    });

    res.end(data);
  });
});



server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chai Tapri Radio running on port ${PORT}`);
});
