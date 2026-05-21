// ============================================================
// HUNAR Tool — src/tools/getDistance.js
// Google Maps Distance Matrix API + Haversine fallback
// ============================================================

const AVG_SPEED_KMH = 30;

// Islamabad sector coordinates for Haversine fallback
const SECTOR_COORDS = {
  "B-17": { lat: 33.6844, lng: 72.8122 },
  "B-18": { lat: 33.6668, lng: 72.7845 },
  "C-14": { lat: 33.7291, lng: 72.9372 },
  "C-15": { lat: 33.7198, lng: 72.9190 },
  "C-16": { lat: 33.7102, lng: 72.9004 },
  "D-11": { lat: 33.7335, lng: 72.9870 },
  "D-12": { lat: 33.7225, lng: 72.9695 },
  "D-13": { lat: 33.7130, lng: 72.9510 },
  "D-14": { lat: 33.7035, lng: 72.9325 },
  "D-15": { lat: 33.6940, lng: 72.9140 },
  "D-16": { lat: 33.6845, lng: 72.8955 },
  "D-17": { lat: 33.6750, lng: 72.8770 },
  "E-7": { lat: 33.7258, lng: 73.0482 },
  "E-8": { lat: 33.7229, lng: 73.0298 },
  "E-9": { lat: 33.7171, lng: 73.0116 },
  "E-10": { lat: 33.7125, lng: 72.9940 },
  "E-11": { lat: 33.7022, lng: 72.9774 },
  "E-12": { lat: 33.7095, lng: 72.9610 },
  "E-16": { lat: 33.6665, lng: 72.8885 },
  "E-17": { lat: 33.6570, lng: 72.8700 },
  "E-18": { lat: 33.6475, lng: 72.8515 },
  "F-5": { lat: 33.7268, lng: 73.0920 },
  "F-6": { lat: 33.7297, lng: 73.0745 },
  "F-7": { lat: 33.7214, lng: 73.0564 },
  "F-8": { lat: 33.7118, lng: 73.0371 },
  "F-9": { lat: 33.7028, lng: 73.0178 },
  "F-10": { lat: 33.6934, lng: 72.9995 },
  "F-11": { lat: 33.6841, lng: 72.9810 },
  "F-12": { lat: 33.6910, lng: 72.9635 },
  "F-14": { lat: 33.6625, lng: 72.9245 },
  "F-15": { lat: 33.6530, lng: 72.9060 },
  "F-16": { lat: 33.6435, lng: 72.8875 },
  "F-17": { lat: 33.6340, lng: 72.8690 },
  "G-5": { lat: 33.7240, lng: 73.1001 },
  "G-6": { lat: 33.7196, lng: 73.0825 },
  "G-7": { lat: 33.7101, lng: 73.0641 },
  "G-8": { lat: 33.7006, lng: 73.0450 },
  "G-9": { lat: 33.6912, lng: 73.0260 },
  "G-10": { lat: 33.6819, lng: 73.0075 },
  "G-11": { lat: 33.6726, lng: 72.9890 },
  "G-12": { lat: 33.6710, lng: 72.9700 },
  "G-13": { lat: 33.6540, lng: 72.9515 },
  "G-14": { lat: 33.6444, lng: 72.9333 },
  "G-15": { lat: 33.6350, lng: 72.9150 },
  "G-16": { lat: 33.6255, lng: 72.8965 },
  "G-17": { lat: 33.6160, lng: 72.8780 },
  "H-8": { lat: 33.6888, lng: 73.0531 },
  "H-9": { lat: 33.6795, lng: 73.0345 },
  "H-10": { lat: 33.6702, lng: 73.0160 },
  "H-11": { lat: 33.6610, lng: 72.9970 },
  "H-12": { lat: 33.6449, lng: 72.9912 },
  "H-13": { lat: 33.6420, lng: 72.9605 },
  "H-14": { lat: 33.6325, lng: 72.9420 },
  "H-15": { lat: 33.6230, lng: 72.9235 },
  "H-16": { lat: 33.6135, lng: 72.9050 },
  "H-17": { lat: 33.6040, lng: 72.8865 },
  "I-8": { lat: 33.6765, lng: 73.0620 },
  "I-9": { lat: 33.6672, lng: 73.0435 },
  "I-10": { lat: 33.6578, lng: 73.0250 },
  "I-11": { lat: 33.6485, lng: 73.0065 },
  "I-12": { lat: 33.6390, lng: 72.9880 },
  "I-14": { lat: 33.6190, lng: 72.9288 },
  "I-15": { lat: 33.6095, lng: 72.9100 },
  "I-16": { lat: 33.6000, lng: 72.8915 },
  "I-18": { lat: 33.5810, lng: 72.8545 },
};
/**
 * Haversine formula — straight-line distance with 1.3x road factor
 */
const haversineDistance = (fromSector, toSector) => {
  const from = SECTOR_COORDS[fromSector];
  const to = SECTOR_COORDS[toSector];

  if (!from || !to) return { distanceKm: 5.0, travelTimeMinutes: 10 };
  if (fromSector === toSector) return { distanceKm: 0.5, travelTimeMinutes: 2 };

  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
    Math.cos((to.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = parseFloat((R * c * 1.3).toFixed(1)); // ×1.3 road winding factor
  const mins = Math.ceil((km / AVG_SPEED_KMH) * 60);
  return { distanceKm: km, travelTimeMinutes: mins };
};

// Extract sector code from string like "G-13, Islamabad" → "G-13"
const extractSector = (locationString) => {
  const match = locationString.match(/[A-Z]-\d+/);
  return match ? match[0] : locationString.trim();
};

/**
 * Get real road distance using Google Maps Distance Matrix API.
 * Falls back to Haversine if API fails or key missing.
 *
 * @param {string} origin      - e.g. "G-13, Islamabad"
 * @param {string} destination - e.g. "G-11, Islamabad"
 * @returns {{ distanceKm, travelTimeMinutes, source }}
 */
const getDistance = async (origin, destination) => {
  const originSector = extractSector(origin);
  const destSector = extractSector(destination);

  // Same sector — short distance
  if (originSector === destSector) {
    return { distanceKm: 0.5, travelTimeMinutes: 2, source: "same_sector" };
  }

  // Try Google Maps Distance Matrix
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const { Client } = require("@googlemaps/google-maps-services-js");
      const client = new Client({});

      const response = await client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          key: process.env.GOOGLE_MAPS_API_KEY,
          units: "metric",
          mode: "driving",
          region: "pk",
        },
        timeout: 6000,
      });

      const element = response.data.rows[0]?.elements[0];
      if (element?.status === "OK") {
        const distanceKm = parseFloat((element.distance.value / 1000).toFixed(1));
        const travelTimeMinutes = Math.ceil(element.duration.value / 60);
        console.log(`📍 Google Maps: ${originSector}→${destSector} = ${distanceKm}km, ${travelTimeMinutes}min`);
        return { distanceKm, travelTimeMinutes, source: "google_maps" };
      }
      throw new Error(`Maps status: ${element?.status}`);
    } catch (err) {
      console.warn(`⚠️ Google Maps failed (${originSector}→${destSector}): ${err.message}`);
    }
  }

  // Haversine fallback
  const result = haversineDistance(originSector, destSector);
  console.log(`📍 Haversine fallback: ${originSector}→${destSector} = ${result.distanceKm}km`);
  return { ...result, source: "haversine_fallback" };
};

module.exports = getDistance;
module.exports.SECTOR_COORDS = SECTOR_COORDS;
module.exports.haversineDistance = haversineDistance;
