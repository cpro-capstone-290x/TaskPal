import express from "express";
// If you're using Node 18+ you can use global fetch and remove this import
// import fetch from "node-fetch";

const router = express.Router();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// POST /api/address/validate-google
router.post("/validate-google", async (req, res) => {
  const { placeId } = req.body;

  if (!GOOGLE_API_KEY) {
    return res.status(500).json({
      valid: false,
      city: null,
      province: null,
      error: "Missing GOOGLE_API_KEY in environment",
    });
  }

  if (!placeId) {
    return res.status(400).json({
      valid: false,
      city: null,
      province: null,
      error: "Missing placeId in request body",
    });
  }

  try {
    const url =
      "https://maps.googleapis.com/maps/api/geocode/json" +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&key=${GOOGLE_API_KEY}`;

    const r = await fetch(url);
    const json = await r.json();

    console.log("🔍 Raw Geocoding response:", JSON.stringify(json, null, 2));

    // If Google returns nothing useful
    if (!json || !Array.isArray(json.results) || json.results.length === 0) {
      return res.json({
        valid: false,
        city: null,
        province: null,
        error: "No geocoding results (ZERO_RESULTS)",
      });
    }

    const result = json.results[0];
    const comps = result.address_components || [];

    const findComponent = (types) =>
      comps.find((c) => types.every((t) => c.types.includes(t)));

    const cityComp =
      findComponent(["locality", "political"]) ||
      findComponent(["postal_town", "political"]) ||
      null;

    const provinceComp =
      findComponent(["administrative_area_level_1", "political"]) || null;

    const city = cityComp?.long_name || cityComp?.short_name || null;
    const province =
      provinceComp?.long_name || provinceComp?.short_name || null;

    const cityLower = (city || "").toLowerCase().trim();
    const provinceLower = (province || "").toLowerCase().trim();

    const isRedDeer = cityLower === "red deer";
    const isAlberta = provinceLower === "alberta" || provinceLower === "ab";

    const valid = isRedDeer && isAlberta;

    return res.json({
      valid,
      city,
      province,
    });
  } catch (err) {
    console.error("💥 validate-google (geocoding) error:", err);
    return res.status(500).json({
      valid: false,
      city: null,
      province: null,
      error: "Server error while validating address",
    });
  }
});

export default router;
