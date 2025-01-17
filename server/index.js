const fs = require("fs");
const ytdl = require("ytdl-core");
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const port = process.env.port || 5000;

// Configure Socket.io with CORS
const io = new Server(http, {
  cors: {
    origin: "http://localhost:3000", // Replace with your client URL
    methods: ["GET", "POST"],
  },
});

const getAudio = (videoURL, client, res) => {
  console.log("Requested video URL:", videoURL);

  // Stream the audio using ytdl
  const stream = ytdl(videoURL, {
    quality: "highestaudio",
    filter: "audioonly",
  })
    .on("progress", (chunkSize, downloadedChunk, totalChunk) => {
      const progress = (downloadedChunk * 100) / totalChunk;
      console.log(`Progress: ${progress.toFixed(2)}%`);

      // Emit progress to the client
      client.emit("progressEventSocket", [progress]);
      client.emit("downloadCompletedServer", [downloadedChunk]);

      if (downloadedChunk === totalChunk) {
        console.log("Download completed");
      }
    })
    .pipe(res);

  // Retrieve video details
  ytdl.getInfo(videoURL).then((info) => {
    const videoDetails = {
      title: info.videoDetails.title,
      uploader: info.videoDetails.author.name,
    };
    console.log("Video details:", videoDetails);

    // Emit video details to the client
    client.emit("videoDetails", [videoDetails.title, videoDetails.uploader]);
  }).catch((error) => {
    console.error("Error fetching video details:", error);
  });
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to Fruittube <3");
});

app.post("/", (req, res) => {
  const videoURL = req.body.url;
  if (!videoURL) {
    return res.status(400).send("URL is required");
  }

  if (!clientGlob) {
    return res.status(500).send("No active socket connection");
  }

  getAudio(videoURL, clientGlob, res);
});

// Socket.io connection
let clientGlob = null;

io.on("connection", (client) => {
  console.log("User connected:", client.id);
  clientGlob = client;

  client.on("disconnect", () => {
    console.log("User disconnected:", client.id);
    if (clientGlob === client) clientGlob = null;
  });
});

// Start the server
http.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
