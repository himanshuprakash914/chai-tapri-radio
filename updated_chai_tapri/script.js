/* =========================================================
   CHAI KI TAPRI - MUSIC PLAYER
   Backend Playlist + Shuffle + Artwork
   ========================================================= */


/* ---------- Elements ---------- */

const msg = document.getElementById("setupMessage");

const trackTitle = document.getElementById("trackTitle");
const trackSub = document.getElementById("trackSub");
const playlistCount = document.getElementById("playlistCount");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playPauseBtn = document.getElementById("playPauseBtn");

const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

/*
 * Your custom player should have:
 *
 * <img id="albumArtwork" ...>
 *
 * If it doesn't exist, the code simply skips artwork.
 */
const albumArtwork = document.getElementById("albumArtwork");


/* =========================================================
   VARIABLES
   ========================================================= */

let playlistId = null;

let ytPlayer = null;

let ytApiReady = false;
let playerReady = false;

let playlistLoaded = false;
let shuffleInitialized = false;

let selectedRandomSong = false;


/* =========================================================
   BACKEND PLAYLIST
   ========================================================= */

async function loadPlaylistFromBackend() {

    try {

        const response = await fetch("/api/playlist", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });


        if (!response.ok) {

            throw new Error(
                "Backend returned " + response.status
            );

        }


        const data = await response.json();


        if (!data || !data.playlistId) {

            throw new Error(
                "Playlist ID missing"
            );

        }


        playlistId = data.playlistId;


        console.log(
            "Backend playlist:",
            playlistId
        );


        msg.textContent =
            "Playlist तैयार हो रही है...";


        tryStartPlaylist();


    } catch (error) {

        console.error(
            "Backend error:",
            error
        );


        msg.textContent =
            "Playlist load नहीं हो पाई।";


        msg.style.color =
            "#e58d73";

    }

}


/* =========================================================
   YOUTUBE API
   ========================================================= */

window.onYouTubeIframeAPIReady = function () {

    console.log(
        "YouTube API loaded"
    );


    ytApiReady = true;


    createPlayer();

};


function createPlayer() {

    if (!ytApiReady) {
        return;
    }


    if (ytPlayer) {
        return;
    }


    ytPlayer = new YT.Player(
        "ytPlayer",
        {

            height: "1",

            width: "1",


            playerVars: {

                autoplay: 0,

                controls: 0,

                playsinline: 1,

                rel: 0,

                modestbranding: 1,

                enablejsapi: 1,

                origin: window.location.origin

            },


            events: {

                onReady: onPlayerReady,

                onStateChange: onPlayerStateChange,

                onError: onPlayerError,

                onAutoplayBlocked: onAutoplayBlocked

            }

        }
    );

}


/* =========================================================
   PLAYER READY
   ========================================================= */

function onPlayerReady() {

    console.log(
        "YouTube player ready"
    );


    playerReady = true;


    /*
     * Make buttons usable immediately.
     */
    enableControls();


    tryStartPlaylist();

}


/* =========================================================
   START PLAYLIST
   ========================================================= */

function tryStartPlaylist() {

    if (!playlistId) {
        return;
    }


    if (!playerReady) {
        return;
    }


    if (!ytPlayer) {
        return;
    }


    if (playlistLoaded) {
        return;
    }


    playlistLoaded = true;


    shuffleInitialized = false;

    selectedRandomSong = false;


    console.log(
        "Loading playlist..."
    );


    /*
     * IMPORTANT:
     *
     * cuePlaylist does NOT autoplay.
     *
     * We wait for CUED before doing shuffle.
     */
    ytPlayer.cuePlaylist({

        list: playlistId,

        listType: "playlist",

        index: 0

    });


    msg.textContent =
        "Playlist load हो रही है...";

}


/* =========================================================
   PLAYER STATE
   ========================================================= */

function onPlayerStateChange(event) {

    console.log(
        "Player state:",
        event.data
    );


    updatePlayPauseIcon();


    /*
     * Playlist is now actually ready.
     */
    if (
        event.data === YT.PlayerState.CUED &&
        !shuffleInitialized
    ) {

        shuffleInitialized = true;


        /*
         * Give YouTube a little time before
         * changing playlist order.
         */
        setTimeout(
            initializeShuffle,
            800
        );

    }


    updateTrackInfo();


    switch (event.data) {


        /* ---------- PLAYING ---------- */

        case YT.PlayerState.PLAYING:

            setStatus(
                "चाय की टपरी पर गाना बज रहा है 🎵",
                true
            );


            msg.textContent =
                "गाना चल रहा है।";


            updateTrackInfo();


            break;


        /* ---------- PAUSED ---------- */

        case YT.PlayerState.PAUSED:

            setStatus(
                "गाना रुका हुआ है",
                false
            );


            break;


        /* ---------- ENDED ---------- */

        case YT.PlayerState.ENDED:

            setStatus(
                "अगला गाना 🎵",
                false
            );


            /*
             * With shuffle enabled,
             * nextVideo chooses another shuffled song.
             */
            setTimeout(
                () => {

                    if (
                        ytPlayer &&
                        typeof ytPlayer.nextVideo ===
                        "function"
                    ) {

                        ytPlayer.nextVideo();

                    }

                },
                300
            );


            break;


        /* ---------- BUFFERING ---------- */

        case YT.PlayerState.BUFFERING:

            setStatus(
                "गाना load हो रहा है...",
                false
            );


            break;

    }

}


/* =========================================================
   SHUFFLE
   ========================================================= */

function initializeShuffle() {

    if (!ytPlayer) {
        return;
    }


    console.log(
        "Turning shuffle ON..."
    );


    try {

        /*
         * Enable shuffle.
         */
        ytPlayer.setShuffle(true);


        /*
         * Wait for shuffle to be applied.
         */
        setTimeout(
            moveToRandomSong,
            700
        );


    } catch (error) {

        console.error(
            "Shuffle error:",
            error
        );


        /*
         * Still allow Play button.
         */
        selectedRandomSong = true;


        msg.textContent =
            "Playlist ready — Play दबाओ।";

    }

}


/* =========================================================
   RANDOM SONG
   ========================================================= */

function moveToRandomSong() {

    if (!ytPlayer) {
        return;
    }


    if (selectedRandomSong) {
        return;
    }


    /*
     * After setShuffle(true),
     * nextVideo() goes to another song
     * in the shuffled playlist.
     *
     * This avoids trying to manually re-cue
     * the playlist, which was causing the
     * refresh problem.
     */
    try {

        ytPlayer.nextVideo();


        /*
         * Wait until the new video is CUED.
         */
        waitForRandomSong();

    } catch (error) {

        console.error(
            "Random song error:",
            error
        );


        selectedRandomSong = true;

    }

}


/* =========================================================
   WAIT FOR RANDOM SONG
   ========================================================= */

function waitForRandomSong() {

    let attempts = 0;


    const check = setInterval(
        () => {

            attempts++;


            if (!ytPlayer) {

                clearInterval(check);

                return;

            }


            let state = -1;


            try {

                state =
                    ytPlayer.getPlayerState();

            } catch (error) {

                return;

            }


            /*
             * CUED = song is loaded but not playing.
             */
            if (
                state === YT.PlayerState.CUED
            ) {

                clearInterval(check);


                selectedRandomSong = true;


                updateTrackInfo();

                updateArtwork();


                msg.textContent =
                    "Shuffle ON — Play दबाओ।";


                msg.style.color =
                    "#9f927f";


                setStatus(
                    "Shuffle ON 🎵",
                    false
                );


                return;

            }


            /*
             * Don't wait forever.
             */
            if (attempts > 20) {

                clearInterval(check);


                selectedRandomSong = true;


                updateTrackInfo();

                updateArtwork();

            }

        },
        300
    );

}


/* =========================================================
   PLAY / PAUSE
   ========================================================= */

function playPause() {

    if (!ytPlayer) {

        console.log(
            "YouTube player not ready"
        );

        return;

    }


    try {

        const state =
            ytPlayer.getPlayerState();


        /*
         * Currently playing.
         */
        if (
            state === YT.PlayerState.PLAYING
        ) {

            ytPlayer.pauseVideo();

            return;

        }


        /*
         * Start the already-selected song.
         */
        ytPlayer.playVideo();


    } catch (error) {

        console.error(
            "Play error:",
            error
        );

    }

}


if (playPauseBtn) {

    playPauseBtn.addEventListener(
        "click",
        playPause
    );

}


/* =========================================================
   NEXT
   ========================================================= */

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        () => {

            if (
                ytPlayer &&
                typeof ytPlayer.nextVideo ===
                "function"
            ) {

                ytPlayer.nextVideo();

            }

        }
    );

}


/* =========================================================
   PREVIOUS
   ========================================================= */

if (prevBtn) {

    prevBtn.addEventListener(
        "click",
        () => {

            if (
                ytPlayer &&
                typeof ytPlayer.previousVideo ===
                "function"
            ) {

                ytPlayer.previousVideo();

            }

        }
    );

}


/* =========================================================
   SONG INFORMATION
   ========================================================= */

function updateTrackInfo() {

    if (!ytPlayer) {
        return;
    }


    /*
     * Get current video information.
     */
    try {

        if (
            typeof ytPlayer.getVideoData ===
            "function"
        ) {

            const data =
                ytPlayer.getVideoData();


            if (
                data &&
                data.title
            ) {

                trackTitle.textContent =
                    data.title;

            }


            /*
             * Update album artwork from YouTube.
             */
            if (
                data &&
                data.video_id
            ) {

                updateArtwork(
                    data.video_id
                );

            }

        }

    } catch (error) {

        console.log(
            "Video data not ready"
        );

    }


    /*
     * Playlist information.
     */
    try {

        const list =
            ytPlayer.getPlaylist();


        const index =
            ytPlayer.getPlaylistIndex();


        if (
            list &&
            list.length
        ) {

            playlistCount.textContent =
                `SONG ${index + 1} / ${list.length}`;


            trackSub.textContent =
                `Shuffle • ${list.length} गाने`;

        }

    } catch (error) {

        console.log(
            "Playlist data not ready"
        );

    }

}


/* =========================================================
   ALBUM ARTWORK
   ========================================================= */

function updateArtwork(videoId = null) {

    /*
     * If your HTML has:
     *
     * <img id="albumArtwork">
     *
     * this will update it.
     */

    if (!albumArtwork) {
        return;
    }


    /*
     * If video ID wasn't passed,
     * get it from YouTube.
     */
    if (!videoId && ytPlayer) {

        try {

            const data =
                ytPlayer.getVideoData();


            if (
                data &&
                data.video_id
            ) {

                videoId =
                    data.video_id;

            }

        } catch (error) {

            return;

        }

    }


    if (!videoId) {
        return;
    }


    /*
     * YouTube thumbnail.
     *
     * maxresdefault may not exist for every video,
     * so hqdefault is safer.
     */
    const thumbnail =
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;


    /*
     * Remove old fallback/alt appearance.
     */
    albumArtwork.removeAttribute("alt");


    albumArtwork.src =
        thumbnail;


    albumArtwork.style.display =
        "block";


    albumArtwork.onerror = () => {

        /*
         * If HQ thumbnail fails,
         * try standard thumbnail.
         */
        albumArtwork.src =
            `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    };

}


/* =========================================================
   PLAY / PAUSE ICON
   ========================================================= */

function updatePlayPauseIcon() {

    if (!ytPlayer) {
        return;
    }


    let state = -1;


    try {

        state =
            ytPlayer.getPlayerState();

    } catch (error) {

        return;

    }


    const isPlaying =
        state === YT.PlayerState.PLAYING;


    if (playIcon) {

        playIcon.style.display =
            isPlaying
                ? "none"
                : "block";

    }


    if (pauseIcon) {

        pauseIcon.style.display =
            isPlaying
                ? "block"
                : "none";

    }

}


/* =========================================================
   STATUS
   ========================================================= */

function setStatus(
    text,
    isLive
) {

    /*
     * Safe even if you removed the
     * status indicator from HTML.
     */

    if (statusText) {

        statusText.textContent =
            text;

    }


    if (statusDot) {

        statusDot.style.background =
            isLive
                ? "#49df80"
                : "#c9a568";


        statusDot.style.boxShadow =
            isLive
                ? "0 0 16px #49df80"
                : "0 0 12px #c9a568";

    }

}


/* =========================================================
   BUTTONS ALWAYS ENABLED
   ========================================================= */

function enableControls() {

    if (prevBtn) {
        prevBtn.disabled = false;
    }


    if (nextBtn) {
        nextBtn.disabled = false;
    }


    if (playPauseBtn) {
        playPauseBtn.disabled = false;
    }

}


/* =========================================================
   YOUTUBE ERROR
   ========================================================= */

function onPlayerError(error) {

    console.error(
        "YouTube error:",
        error
    );


    msg.textContent =
        "इस गाने को play नहीं किया जा सकता।";


    msg.style.color =
        "#e58d73";


    /*
     * Try another shuffled song.
     */
    setTimeout(
        () => {

            if (
                ytPlayer &&
                typeof ytPlayer.nextVideo ===
                "function"
            ) {

                ytPlayer.nextVideo();

            }

        },
        800
    );

}


/* =========================================================
   AUTOPLAY BLOCKED
   ========================================================= */

function onAutoplayBlocked() {

    console.log(
        "Autoplay blocked"
    );


    /*
     * This is normal browser behavior.
     * The Play button should still work.
     */
    setStatus(
        "Play दबाकर गाना शुरू करो",
        false
    );

}


/* =========================================================
   STOP PLAYER ON PAGE EXIT
   ========================================================= */

function stopPlayerNow() {

    if (
        ytPlayer &&
        typeof ytPlayer.stopVideo ===
        "function"
    ) {

        try {

            ytPlayer.stopVideo();

        } catch (error) {

            console.log(
                "Player already closed"
            );

        }

    }

}


window.addEventListener(
    "beforeunload",
    stopPlayerNow
);


window.addEventListener(
    "pagehide",
    stopPlayerNow
);


/* =========================================================
   START
   ========================================================= */

enableControls();

loadPlaylistFromBackend();