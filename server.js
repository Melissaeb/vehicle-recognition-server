const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: process.env.CLIENT_HOST }));
// app.use(cors());

// Configure multer for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage });
// const upload = multer({ dest: "/tmp/" });
const upload = multer({ dest: "uploads/" });

// Azure Computer Vision credentials
const subscriptionKey = process.env["VISION_KEY"];
const endpoint = process.env["VISION_ENDPOINT"];

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Route to analyse image URL
app.post("/analyse-url", async (req, res) => {
  const { imageUrl } = req.body;
  console.log(req.body);

  if (!imageUrl) {
    return res.status(400).send({ error: "Image URL is required" });
  }

  try {
    const response = await axios.post(
      `${endpoint}/vision/v3.1/analyze`,
      {
        url: imageUrl,
      },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Content-Type": "application/json",
        },
        params: {
          visualFeatures: "Tags",
        },
      }
    );

    res.send(response.data);
  } catch (error) {
    res.status(500).send({ error: "Error analyzing image" });
  }
});

// Route to analyse uploaded image
app.post("/analyse-upload", upload.single("image"), async (req, res) => {
  console.log("Received file:", req.file);
  if (!req.file) {
    return res.status(400).send({ error: "Image file is required" });
  }

  try {
    const imagePath = path.join(__dirname, req.file.path);
    const imageBuffer = fs.readFileSync(imagePath);

    const response = await axios.post(
      `${endpoint}/vision/v3.1/analyze`,
      imageBuffer,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Content-Type": "application/octet-stream",
        },
        params: {
          visualFeatures: "Tags",
        },
      }
    );

    fs.unlinkSync(imagePath); // Delete the file after upload

    res.send(response.data);
  } catch (error) {
    console.error("Error analysing image:", error);
    res.status(500).send({ error: "Error analyzing image" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
