const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

app.use(cors({ origin: process.env.CLIENT_HOST }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Route to analyse image URL
app.post("/analyse-url", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).send({ error: "Image URL is required" });
  }

  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    const resizedImage = await sharp(response.data)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    const visionResponse = await axios.post(
      `${process.env.VISION_ENDPOINT}/vision/v3.1/analyze`,
      resizedImage,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.VISION_KEY,
          "Content-Type": "application/octet-stream",
        },
        params: {
          visualFeatures: "Tags",
        },
      }
    );

    res.send(visionResponse.data);
  } catch (error) {
    console.error("Error analysing image:", error);
    res.status(500).send({ error: "Error analyzing image" });
  }
});

// Route to analyse uploads
app.post("/analyse-upload", upload.single("image"), async (req, res) => {
  try {
    const fileBuffer = await fs.promises.readFile(req.file.path);

    const resizedImage = await sharp(fileBuffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    const visionResponse = await axios.post(
      `${process.env.VISION_ENDPOINT}/vision/v3.1/analyze`,
      resizedImage,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.VISION_KEY,
          "Content-Type": "application/octet-stream",
        },
        params: {
          visualFeatures: "Tags",
        },
      }
    );

    res.send(visionResponse.data);

    await unlinkFile(req.file.path);
  } catch (error) {
    console.error("Error analysing image:", error);
    res.status(500).send({ error: "Error analyzing image" });

    if (req.file) {
      await unlinkFile(req.file.path);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
