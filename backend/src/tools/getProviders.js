// ============================================================
// HUNAR Tool — src/tools/getProviders.js
// Query MongoDB for providers filtered by service + sector
// ============================================================
const Provider = require("../models/Provider");

// Convert service slug to readable format for matching
// ac_repair → AC Repair, plumbing → Plumbing etc
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
 * @param {string} service  - e.g. "ac_repair" or "AC Repair"
 * @param {string} sector   - e.g. "G-13"
 * @returns {Object} { inSector, nearby, total }
 */
const getProviders = async (service, sector) => {

  // Normalize service to match what's stored in MongoDB
  const normalizedService = normalizeService(service);

  // Case-insensitive search using regex
  const providers = await Provider.find({
    services: { $regex: new RegExp(`^${normalizedService}$`, "i") },
    isAvailable: true,
  }).sort({ rating: -1 });

  // Split into same sector vs nearby
  const inSector = providers.filter((p) => p.sector === sector);
  const nearby = providers.filter((p) => p.sector !== sector);

  console.log(`🔍 getProviders: searched "${normalizedService}" in "${sector}" — found ${inSector.length} in sector, ${nearby.length} nearby`);

  return {
    inSector,
    nearby,
    total: providers.length,
    searchedService: normalizedService,
    searchedSector: sector,
  };
};

module.exports = getProviders;