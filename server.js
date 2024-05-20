const { ImageAnalysisClient } = require("@azure-rest/ai-vision-image-analysis");
const createClient = require("@azure-rest/ai-vision-image-analysis").default;
const { AzureKeyCredential } = require("@azure/core-auth");

// Logging for troubleshooting
// const { setLogLevel } = require("@azure/logger");

// setLogLevel("info");

require("dotenv").config();

const endpoint = process.env["VISION_ENDPOINT"];
const key = process.env["VISION_KEY"];
const credential = new AzureKeyCredential(key);
const client = createClient(endpoint, credential);

// Get the visual feature for analysis
const features = ["Tags"];

const imageUrl =
  "https://www.aa.co.nz/assets/motoring/car-reviews/toyota/corolla/2013/_resampled/FillWyIxMjgwIiwiNzIwIl0/Toyota-Corolla-2013-1.jpg?m=1533775245";
async function analyzeImageFromUrl() {
  const result = await client.path("/imageanalysis:analyze").post({
    body: {
      url: imageUrl,
    },
    queryParameters: {
      features: features,
    },
    contentType: "application/json",
  });

  const iaResult = result.body;

  // console.log(`Model Version: ${iaResult.modelVersion}`);
  // console.log(`Image Metadata: ${JSON.stringify(iaResult.metadata)}`);
  if (iaResult.tagsResult) {
    iaResult.tagsResult.values.forEach((tag) =>
      console.log(`Tag: ${JSON.stringify(tag)}`)
    );
  }
}

analyzeImageFromUrl();
