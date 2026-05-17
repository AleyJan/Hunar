// ============================================================
// HUNAR Tool — src/tools/getDistance.js
// Google Maps Distance Matrix API + fallback sector table
// ============================================================

const { SECTOR_DISTANCES } = require("../config/constants");

const AVG_SPEED_KMH = 30; // Islamabad city average

/**
 * Get distance and travel time between two sectors.
 * Primary: Google Maps Distance Matrix API
 * Fallback: SECTOR_DISTANCES lookup table
 *
 * @param {string} origin      - e.g. "G-13, Islamabad"
 * @param {string} destination - e.g. "G-11, Islamabad"
 * @returns {{ distanceKm, travelTimeMinutes, source }}
 */
const getDistance = async (origin, destination) => {
  // ── Try Google Maps first ───────────────────────────────
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
        },
        timeout: 5000,
      });

      const element = response.data.rows[0]?.elements[0];
      if (element?.status === "OK") {
        const distanceKm = element.distance.value / 1000;
        const travelTimeMinutes = Math.ceil(element.duration.value / 60);
        return { distanceKm, travelTimeMinutes, source: "google_maps" };
      }
    } catch (err) {
      console.warn("⚠️  Google Maps API failed, using fallback table:", err.message);
    }
  }

  // ── Fallback: sector proximity table ───────────────────
  // Extract sector codes from origin/destination strings
  const originSector = extractSector(origin);
  const destSector   = extractSector(destination);

  const distanceKm =
    SECTOR_DISTANCES[originSector]?.[destSector] ??
    SECTOR_DISTANCES[destSector]?.[originSector] ??
    10; // Default 10km if unknown

  const travelTimeMinutes = Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);

  return {
    distanceKm,
    travelTimeMinutes,
    source: "fallback_table",
    note: "Google Maps unavailable — estimated from sector proximity table",
  };
};

// Extract sector code from strings like "G-13, Islamabad" → "G-13"
const extractSector = (locationString) => {
  const match = locationString.match(/[A-Z]-\d+/);
  return match ? match[0] : locationString.trim();
};

module.exports = getDistance;
