const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 10000;

/* =========================================================
   PLAYLIST CONFIGURATION
   ========================================================= */

const PLAYLIST_URL =
    "https://www.youtube.com/watch?v=yZ_UkMJHEAk&list=PLVwbgC8mRDea4xoSwC0ZNMiIr8OHiaFog";

const PLAYLIST_ID =
    new URL(PLAYLIST_URL).searchParams.get("list");


/* =========================================================
   MIME TYPES
   ========================================================= */

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


/* =========================================================
   ACTIVE LISTENERS
   ========================================================= */

/*
 * Stores:
 *
 * listener ID -> last heartbeat time
 *
 * Example:
 *
 * abc123 -> 1723489200000
 * xyz456 -> 1723489205000
 */
const activeListeners = new Map();


/*
 * A listener is considered inactive
 * if we don't receive a heartbeat for 30 seconds.
 */
const LISTENER_TIMEOUT = 30000;


/*
 * Remove inactive listeners.
 */
function cleanupInactiveListeners() {

    const now = Date.now();


    for (
        const [listenerId, lastSeen]
        of activeListeners.entries()
    ) {

        if (
            now - lastSeen >
            LISTENER_TIMEOUT
        ) {

            activeListeners.delete(
                listenerId
            );

        }

    }

}


/*
 * Run cleanup every 10 seconds.
 */
setInterval(
    cleanupInactiveListeners,
    10000
);


/* =========================================================
   SERVER
   ========================================================= */

const server =
    http.createServer(
        (req, res) => {

            const requestUrl =
                new URL(
                    req.url,
                    `http://${req.headers.host || "localhost"}`
                );


            /* =================================================
               API: PLAYLIST
               ================================================= */

            if (
                requestUrl.pathname ===
                "/api/playlist"
            ) {

                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8",

                        "Cache-Control":
                            "no-store"
                    }
                );


                res.end(
                    JSON.stringify({
                        playlistId:
                            PLAYLIST_ID
                    })
                );


                return;
            }


            /* =================================================
               API: LISTENER HEARTBEAT
               ================================================= */

            if (
                requestUrl.pathname ===
                "/api/listeners/heartbeat"
            ) {

                const listenerId =
                    requestUrl.searchParams.get(
                        "id"
                    );


                /*
                 * Listener ID is required.
                 */
                if (!listenerId) {

                    res.writeHead(
                        400,
                        {
                            "Content-Type":
                                "application/json; charset=utf-8"
                        }
                    );


                    res.end(
                        JSON.stringify({
                            success: false,

                            error:
                                "Listener ID is required"
                        })
                    );


                    return;
                }


                /*
                 * Register/update listener.
                 */
                activeListeners.set(
                    listenerId,
                    Date.now()
                );


                /*
                 * Remove old listeners
                 * before returning count.
                 */
                cleanupInactiveListeners();


                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8",

                        "Cache-Control":
                            "no-store"
                    }
                );


                res.end(
                    JSON.stringify({
                        success: true,

                        count:
                            activeListeners.size
                    })
                );


                return;
            }


            /* =================================================
               API: ACTIVE LISTENER COUNT
               ================================================= */

            if (
                requestUrl.pathname ===
                "/api/listeners"
            ) {

                /*
                 * Remove inactive listeners first.
                 */
                cleanupInactiveListeners();


                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8",

                        "Cache-Control":
                            "no-store"
                    }
                );


                res.end(
                    JSON.stringify({
                        count:
                            activeListeners.size
                    })
                );


                return;
            }


            /* =================================================
               STATIC WEBSITE FILES
               ================================================= */

            let requestedPath =
                requestUrl.pathname === "/"
                    ? "/index.html"
                    : requestUrl.pathname;


            requestedPath =
                decodeURIComponent(
                    requestedPath
                );


            /*
             * Prevent path traversal.
             */
            const rootDirectory =
                path.resolve(__dirname);


            const filePath =
                path.resolve(
                    rootDirectory,
                    "." + requestedPath
                );


            if (
                filePath !== rootDirectory &&
                !filePath.startsWith(
                    rootDirectory +
                    path.sep
                )
            ) {

                res.writeHead(403);

                res.end("Forbidden");

                return;
            }


            /*
             * Read requested file.
             */
            fs.readFile(
                filePath,
                (error, data) => {

                    if (error) {

                        res.writeHead(
                            error.code === "ENOENT"
                                ? 404
                                : 500
                        );


                        res.end(
                            error.code === "ENOENT"
                                ? "Not found"
                                : "Server error"
                        );


                        return;
                    }


                    const extension =
                        path.extname(
                            filePath
                        ).toLowerCase();


                    res.writeHead(
                        200,
                        {
                            "Content-Type":
                                MIME_TYPES[
                                    extension
                                ] ||
                                "application/octet-stream"
                        }
                    );


                    res.end(data);

                }
            );

        }
    );


/* =========================================================
   START SERVER
   ========================================================= */

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Chai Tapri Radio running on port ${PORT}`
        );

    }
);
