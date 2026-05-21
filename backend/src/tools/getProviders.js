// ============================================================
// HUNAR Tool — src/tools/getProviders.js
// Query MongoDB for providers filtered by service + sector
// Real distance via Google Maps Distance Matrix API
// ============================================================
const Provider = require("../models/Provider");
const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Islamabad sector coordinates
const SECTOR_COORDS = {
  "G-6": { lat: 33.7294, lng: 73.0931 },
  "G-7": { lat: 33.7215, lng: 73.0982 },
  "G-8": { lat: 33.7154, lng: 73.0440 },
  "G-9": { lat: 33.7020, lng: 73.0440 },
  "G-10": { lat: 33.6960, lng: 73.0280 },
  "G-11": { lat: 33.6900, lng: 73.0100 },
  "G-12": { lat: 33.6840, lng: 72.9940 },
  "G-13": { lat: 33.6780, lng: 72.9780 },
  "G-14": { lat: 33.6720, lng: 72.9620 },
  "G-15": { lat: 33.6660, lng: 72.9460 },
  "F-6": { lat: 33.7294, lng: 73.0650 },
  "F-7": { lat: 33.7215, lng: 73.0720 },
  "F-8": { lat: 33.7154, lng: 73.0600 },
  "F-10": { lat: 33.7020, lng: 73.0100 },
  "F-11": { lat: 33.6960, lng: 72.9940 },
  "I-8": { lat: 33.6780, lng: 73.0780 },
  "I-9": { lat: 33.6650, lng: 73.0650 },
  "I-10": { lat: 33.6550, lng: 73.0440 },
  "E-7": { lat: 33.7350, lng: 73.0780 },
  "E-11": { lat: 33.7100, lng: 72.9800 },
};

const normalizeService = (service) => {
  const map = {
    ac_repair: "AC Repair",
    plumbing: "Plumbing",
    electrical: "Electrical",
    carpentry: "Carpentry",
    painting: "Painting",
    cleaning: "Cleaning",
    tutoring: "Tutoring",
    appliance_repair: "Appliance Repair",
    shifting: "Shifting",
    pest_control: "Pest Control",
    mechanics: "Mechanics",
  };
  return map[service] || service;
};

/**
 * Get real road distance between two sectors using Google Maps Distance Matrix.
 * Falls back to straight-line Haversine if API fails.
 */
const getRealDistance = async (fromSector, toSector) => {
  const from = SECTOR_COORDS[fromSector];
  const to = SECTOR_COORDS[toSector];

  if (!from || !to) {
    // Fallback — estimate 1.5 km per sector difference
    return { distanceKm: 3.0, durationMinutes: 10 };
  }

  if (fromSector === toSector) {
    return { distanceKm: 0.5, durationMinutes: 2 };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    const res = await axios.get(url, {
      params: {
        origins: `${from.lat},${from.lng}`,
        destinations: `${to.lat},${to.lng}`,
        mode: "driving",
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });

    const element = res.data.rows?.[0]?.elements?.[0];
    if (element?.status === "OK") {
      const distanceKm = parseFloat((element.distance.value / 1000).toFixed(1));
      const durationMinutes = Math.ceil(element.duration.value / 60);
      return { distanceKm, durationMinutes };
    }
    throw new Error("Google Maps returned non-OK status");
  } catch (err) {
    console.log(`⚠️ Distance Matrix fallback for ${fromSector}→${toSector}: ${err.message}`);
    // Haversine fallback
    const R = 6371;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = parseFloat((R * c * 1.3).toFixed(1)); // ×1.3 road factor
    return { distanceKm: km, durationMinutes: Math.ceil(km * 3) };
  }
};

/**
 * @param {string} service - e.g. "ac_repair"
 * @param {string} sector  - user's sector e.g. "G-13"
 * @returns {Object} { inSector, nearby, total }
 */
const getProviders = async (service, sector) => {
  const normalizedService = normalizeService(service);

  const providers = await Provider.find({
    services: { $regex: new RegExp(`^${normalizedService}$`, "i") },
    isAvailable: true,
  }).sort({ rating: -1 });

  // Attach real distances concurrently
  const withDistances = await Promise.all(
    providers.map(async (p) => {
      const { distanceKm, durationMinutes } = await getRealDistance(p.sector, sector);
      return {
        ...p.toObject(),
        distanceKm,
        travelTimeMinutes: durationMinutes,
      };
    })
  );

  // Sort by distance
  withDistances.sort((a, b) => a.distanceKm - b.distanceKm);

  const inSector = withDistances.filter((p) => p.sector === sector);
  const nearby = withDistances.filter((p) => p.sector !== sector);

  console.log(
    `🔍 getProviders: searched "${normalizedService}" in "${sector}" — ` +
    `found ${inSector.length} in sector, ${nearby.length} nearby`
  );

  return {
    inSector,
    nearby,
    total: providers.length,
    searchedService: normalizedService,
    searchedSector: sector,
  };
};

module.exports = { getProviders, getRealDistance, SECTOR_COORDS };