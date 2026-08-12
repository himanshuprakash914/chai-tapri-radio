/* =========================================================
   CHAI KI TAPRI - MUSIC PLAYER

   Features:
   - Backend playlist
   - Shuffle on every page load
   - Play / Pause
   - Next / Previous
   - YouTube artwork
   - Active listener count
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

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
   
   const albumArtwork =
       document.getElementById("albumArtwork");
   
   const listenerNumber =
       document.getElementById("listenerNumber");
   
   
   /* =========================================================
      VARIABLES
      ========================================================= */
   
   let playlistId = null;
   
   let ytPlayer = null;
   
   let ytApiReady = false;
   let playerReady = false;
   
   let playlistLoaded = false;
   let shuffleInitialized = false;
   let randomSongSelected = false;
   
   let listeningHeartbeat = null;
   
   
   /* =========================================================
      UNIQUE LISTENER ID
      ========================================================= */
   
   let listenerId =
       sessionStorage.getItem(
           "chaiTapriListenerId"
       );
   
   
   if (!listenerId) {
   
       listenerId =
           crypto.randomUUID();
   
       sessionStorage.setItem(
           "chaiTapriListenerId",
           listenerId
       );
   
   }
   
   
   /* =========================================================
      LOAD PLAYLIST FROM BACKEND
      ========================================================= */
   
   async function loadPlaylistFromBackend() {
   
       try {
   
           const response =
               await fetch(
                   "/api/playlist",
                   {
                       method: "GET",
   
                       headers: {
                           "Accept": "application/json"
                       },
   
                       cache: "no-store"
                   }
               );
   
   
           if (!response.ok) {
   
               throw new Error(
                   "Backend returned HTTP " +
                   response.status
               );
   
           }
   
   
           const data =
               await response.json();
   
   
           if (
               !data ||
               !data.playlistId
           ) {
   
               throw new Error(
                   "Playlist ID missing"
               );
   
           }
   
   
           playlistId =
               data.playlistId;
   
   
           console.log(
               "Backend playlist:",
               playlistId
           );
   
   
           if (msg) {
   
               msg.textContent =
                   "Playlist तैयार हो रही है...";
   
           }
   
   
           tryStartPlaylist();
   
   
       } catch (error) {
   
           console.error(
               "Backend playlist error:",
               error
           );
   
   
           if (msg) {
   
               msg.textContent =
                   "Playlist load नहीं हो पाई।";
   
               msg.style.color =
                   "#e58d73";
   
           }
   
       }
   
   }
   
   
   /* =========================================================
      YOUTUBE API READY
      ========================================================= */
   
   window.onYouTubeIframeAPIReady =
       function () {
   
           console.log(
               "YouTube API loaded"
           );
   
   
           ytApiReady = true;
   
   
           createPlayer();
   
       };
   
   
   /* =========================================================
      CREATE YOUTUBE PLAYER
      ========================================================= */
   
   function createPlayer() {
   
       if (!ytApiReady) {
           return;
       }
   
   
       if (ytPlayer) {
           return;
       }
   
   
       ytPlayer =
           new YT.Player(
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
   
                       origin:
                           window.location.origin
   
                   },
   
   
                   events: {
   
                       onReady:
                           onPlayerReady,
   
                       onStateChange:
                           onPlayerStateChange,
   
                       onError:
                           onPlayerError,
   
                       onAutoplayBlocked:
                           onAutoplayBlocked
   
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
        * Buttons are always enabled.
        */
       enableControls();
   
   
       /*
        * Try loading playlist.
        */
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
   
       randomSongSelected = false;
   
   
       console.log(
           "Loading YouTube playlist..."
       );
   
   
       /*
        * Load playlist without autoplay.
        */
       ytPlayer.cuePlaylist(
           {
               list: playlistId,
   
               listType: "playlist",
   
               index: 0
           }
       );
   
   
       if (msg) {
   
           msg.textContent =
               "Playlist load हो रही है...";
   
       }
   
   }
   
   
   /* =========================================================
      PLAYER STATE CHANGE
      ========================================================= */
   
   function onPlayerStateChange(event) {
   
       console.log(
           "YouTube state:",
           event.data
       );
   
   
       updatePlayPauseIcon();
   
   
       /*
        * Playlist is ready.
        *
        * We shuffle only once.
        */
       if (
           event.data === YT.PlayerState.CUED &&
           !shuffleInitialized
       ) {
   
           shuffleInitialized = true;
   
   
           setTimeout(
               initializeShuffle,
               800
           );
   
       }
   
   
       updateTrackInfo();
   
   
       switch (event.data) {
   
   
           /* ================================================
              PLAYING
              ================================================ */
   
           case YT.PlayerState.PLAYING:
   
               startListeningHeartbeat();
   
   
               setStatus(
                   "चाय की टपरी पर गाना बज रहा है 🎵",
                   true
               );
   
   
               if (msg) {
   
                   msg.textContent =
                       "गाना चल रहा है।";
   
               }
   
   
               updateTrackInfo();
   
               updateArtwork();
   
   
               break;
   
   
           /* ================================================
              PAUSED
              ================================================ */
   
           case YT.PlayerState.PAUSED:
   
               stopListeningHeartbeat();
   
   
               setStatus(
                   "गाना रुका हुआ है",
                   false
               );
   
   
               if (msg) {
   
                   msg.textContent =
                       "गाना paused है।";
   
               }
   
   
               break;
   
   
           /* ================================================
              ENDED
              ================================================ */
   
           case YT.PlayerState.ENDED:
   
               stopListeningHeartbeat();
   
   
               setStatus(
                   "अगला गाना 🎵",
                   false
               );
   
   
               /*
                * Playlist is already shuffled.
                * nextVideo() moves to another song.
                */
               setTimeout(
                   function () {
   
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
   
   
           /* ================================================
              BUFFERING
              ================================================ */
   
           case YT.PlayerState.BUFFERING:
   
               setStatus(
                   "गाना load हो रहा है...",
                   false
               );
   
   
               break;
   
   
           default:
   
               break;
   
       }
   
   }
   
   
   /* =========================================================
      INITIALIZE SHUFFLE
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
            * Enable YouTube shuffle.
            */
           ytPlayer.setShuffle(true);
   
   
           /*
            * Wait for YouTube to apply shuffle.
            */
           setTimeout(
               moveToRandomSong,
               1000
           );
   
   
       } catch (error) {
   
           console.error(
               "Shuffle error:",
               error
           );
   
   
           /*
            * Fallback:
            * allow current song to play.
            */
           randomSongSelected = true;
   
   
           updateTrackInfo();
   
           updateArtwork();
   
   
           if (msg) {
   
               msg.textContent =
                   "Playlist ready — Play दबाओ।";
   
           }
   
       }
   
   }
   
   
   /* =========================================================
      MOVE TO RANDOM SHUFFLED SONG
      ========================================================= */
   
   function moveToRandomSong() {
   
       if (!ytPlayer) {
           return;
       }
   
   
       if (randomSongSelected) {
           return;
       }
   
   
       console.log(
           "Selecting random shuffled song..."
       );
   
   
       try {
   
           /*
            * Because shuffle is ON,
            * nextVideo() moves to the shuffled
            * next song.
            */
           ytPlayer.nextVideo();
   
   
           /*
            * Wait for the new song to be ready.
            */
           waitForRandomSong();
   
   
       } catch (error) {
   
           console.error(
               "Random song selection error:",
               error
           );
   
   
           randomSongSelected = true;
   
   
           updateTrackInfo();
   
           updateArtwork();
   
       }
   
   }
   
   
   /* =========================================================
      WAIT FOR RANDOM SONG
      ========================================================= */
   
   function waitForRandomSong() {
   
       let attempts = 0;
   
   
       const checker =
           setInterval(
               function () {
   
                   attempts++;
   
   
                   if (!ytPlayer) {
   
                       clearInterval(checker);
   
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
                    * CUED means the song is loaded
                    * but NOT playing.
                    */
                   if (
                       state === YT.PlayerState.CUED
                   ) {
   
                       clearInterval(checker);
   
   
                       randomSongSelected =
                           true;
   
   
                       updateTrackInfo();
   
                       updateArtwork();
   
   
                       setStatus(
                           "Shuffle ON 🎵",
                           false
                       );
   
   
                       if (msg) {
   
                           msg.textContent =
                               "Shuffle ON — Play दबाओ।";
   
                           msg.style.color =
                               "#9f927f";
   
                       }
   
   
                       return;
   
                   }
   
   
                   /*
                    * Fallback after 6 seconds.
                    */
                   if (attempts >= 20) {
   
                       clearInterval(checker);
   
   
                       randomSongSelected =
                           true;
   
   
                       updateTrackInfo();
   
                       updateArtwork();
   
   
                       if (msg) {
   
                           msg.textContent =
                               "Play दबाओ।";
   
                       }
   
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
               "YouTube player is not ready"
           );
   
           return;
   
       }
   
   
       try {
   
           const state =
               ytPlayer.getPlayerState();
   
   
           /*
            * Pause if currently playing.
            */
           if (
               state ===
               YT.PlayerState.PLAYING
           ) {
   
               ytPlayer.pauseVideo();
   
               return;
   
           }
   
   
           /*
            * Play the currently selected song.
            */
           ytPlayer.playVideo();
   
   
       } catch (error) {
   
           console.error(
               "Play/Pause error:",
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
      NEXT BUTTON
      ========================================================= */
   
   if (nextBtn) {
   
       nextBtn.addEventListener(
           "click",
           function () {
   
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
      PREVIOUS BUTTON
      ========================================================= */
   
   if (prevBtn) {
   
       prevBtn.addEventListener(
           "click",
           function () {
   
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
      UPDATE SONG INFORMATION
      ========================================================= */
   
   function updateTrackInfo() {
   
       if (!ytPlayer) {
           return;
       }
   
   
       /*
        * Song title + video ID.
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
   
                   if (trackTitle) {
   
                       trackTitle.textContent =
                           data.title;
   
                   }
   
               }
   
   
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
        * Playlist position.
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
   
               if (playlistCount) {
   
                   playlistCount.textContent =
                       `SONG ${index + 1} / ${list.length}`;
   
               }
   
   
               if (trackSub) {
   
                   trackSub.textContent =
                       `Shuffle • ${list.length} गाने`;
   
               }
   
           }
   
       } catch (error) {
   
           console.log(
               "Playlist data not ready"
           );
   
       }
   
   }
   
   
   /* =========================================================
      UPDATE ALBUM ARTWORK
      ========================================================= */
   
   function updateArtwork(videoId = null) {
   
       if (!albumArtwork) {
           return;
       }
   
   
       /*
        * If video ID wasn't provided,
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
        */
       const thumbnail =
           `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
   
   
       /*
        * Remove ALT text so
        * "Album artwork" doesn't appear.
        */
       albumArtwork.removeAttribute(
           "alt"
       );
   
   
       albumArtwork.src =
           thumbnail;
   
   
       albumArtwork.style.display =
           "block";
   
   
       /*
        * Fallback thumbnail.
        */
       albumArtwork.onerror =
           function () {
   
               albumArtwork.onerror =
                   null;
   
   
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
           state ===
           YT.PlayerState.PLAYING;
   
   
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
        * Safe if you removed the status
        * section from HTML.
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
      ENABLE CONTROLS
      ========================================================= */
   
   function enableControls() {
   
       /*
        * Buttons NEVER become disabled.
        */
   
       if (prevBtn) {
   
           prevBtn.disabled =
               false;
   
       }
   
   
       if (nextBtn) {
   
           nextBtn.disabled =
               false;
   
       }
   
   
       if (playPauseBtn) {
   
           playPauseBtn.disabled =
               false;
   
       }
   
   }
   
   
   /* =========================================================
      YOUTUBE ERROR
      ========================================================= */
   
   function onPlayerError(error) {
   
       console.error(
           "YouTube Player Error:",
           error
       );
   
   
       if (msg) {
   
           msg.textContent =
               "इस गाने को play नहीं किया जा सकता।";
   
           msg.style.color =
               "#e58d73";
   
       }
   
   
       /*
        * Try another shuffled song.
        */
       setTimeout(
           function () {
   
               if (
                   ytPlayer &&
                   typeof ytPlayer.nextVideo ===
                   "function"
               ) {
   
                   ytPlayer.nextVideo();
   
               }
   
           },
           1000
       );
   
   }
   
   
   /* =========================================================
      AUTOPLAY BLOCKED
      ========================================================= */
   
   function onAutoplayBlocked() {
   
       console.log(
           "Browser blocked autoplay"
       );
   
   
       setStatus(
           "Play दबाकर गाना शुरू करो",
           false
       );
   
   
       if (msg) {
   
           msg.textContent =
               "Play दबाओ और music शुरू करो।";
   
       }
   
   }
   
   
   /* =========================================================
      ACTIVE LISTENER
      ========================================================= */
   
   
   /*
    * Send heartbeat to backend.
    */
   async function sendListenerHeartbeat() {
   
       try {
   
           await fetch(
               `/api/listeners/heartbeat?id=${encodeURIComponent(listenerId)}`,
               {
                   method: "GET",
                   cache: "no-store"
               }
           );
   
       } catch (error) {
   
           console.log(
               "Listener heartbeat failed"
           );
   
       }
   
   }
   
   
   /*
    * Get current active listener count.
    */
   async function updateListenerCount() {
   
       try {
   
           const response =
               await fetch(
                   "/api/listeners",
                   {
                       method: "GET",
                       cache: "no-store"
                   }
               );
   
   
           if (!response.ok) {
               return;
           }
   
   
           const data =
               await response.json();
   
   
           if (
               listenerNumber &&
               typeof data.count !==
               "undefined"
           ) {
   
               listenerNumber.textContent =
                   data.count;
   
           }
   
       } catch (error) {
   
           console.log(
               "Unable to get listener count"
           );
   
       }
   
   }
   
   
   /*
    * Start heartbeat when music is playing.
    */
   function startListeningHeartbeat() {
   
       /*
        * Don't create multiple intervals.
        */
       if (listeningHeartbeat) {
           return;
       }
   
   
       /*
        * Send immediately.
        */
       sendListenerHeartbeat();
   
   
       /*
        * Then every 10 seconds.
        */
       listeningHeartbeat =
           setInterval(
               sendListenerHeartbeat,
               10000
           );
   
   }
   
   
   /*
    * Stop heartbeat when music is paused.
    */
   function stopListeningHeartbeat() {
   
       if (listeningHeartbeat) {
   
           clearInterval(
               listeningHeartbeat
           );
   
           listeningHeartbeat =
               null;
   
       }
   
   }
   
   
   /*
    * Update visible listener count
    * every 5 seconds.
    */
   updateListenerCount();
   
   
   setInterval(
       updateListenerCount,
       5000
   );
   
   
   /* =========================================================
      STOP PLAYER ON PAGE EXIT
      ========================================================= */
   
   function stopPlayerNow() {
   
       /*
        * Stop listener heartbeat.
        */
       stopListeningHeartbeat();
   
   
       /*
        * Stop YouTube.
        */
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
      START APPLICATION
      ========================================================= */
   
   enableControls();
   
   loadPlaylistFromBackend();
