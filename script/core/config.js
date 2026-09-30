/**
 * APP STATE & GLOBAL DATA
 * Shared across all pages — must be loaded before any page-specific JS.
 */
let allEvents = [];
let globalRawClasses = [];
let globalRawDescs = [];
let globalVideoVault = [];
let globalQualityImprovement = [];
let globalRawRooms = []; // Flattened room list
let calendar = null;
let currentVenueCategory = "internal";

const CONFIG = {
  files: {
    classes: "Data/ClassList.json",
    descriptions: "Data/CourseDescriptions.json",
    videoVault: "Data/VideoVault.json",
    rooms: "Data/rooms.json",
    qi: "Data/QualityImprovement.json",
  },
  excelEpoch: Date.UTC(1899, 11, 30),
  msPerDay: 86400000,
};

/**
 * UTILITIES
 */
const utils = {
  excelToJS: (serial) => {
    const n = Number(serial);
    if (!isFinite(n)) return new Date(NaN);
    return new Date(CONFIG.excelEpoch + Math.round(n * CONFIG.msPerDay));
  },

  formatDate: (d) => {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "TBD";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  },

  formatDisplay: (val) => {
    if (val === null || val === undefined || val === "") return "N/A";
    const n = Number(val);
    if (!isNaN(n) && typeof val !== "boolean" && n > 30000 && n < 60000) {
      return utils.formatDate(utils.excelToJS(n));
    }
    return String(val);
  },

  // Enhanced to remove prefixes like 376, LHD -, LHD Fire & Rescue -, Learning Half Day
  cleanTitle: (str) =>
    String(str || "")
      .replace(/^(376\s*|LHD\s*[-–—]\s*|LHD\s+Fire\s*&\s*Rescue\s*[-–—]\s*|LHD\s+Fire\s*&\s*Rescue\s+|LHD\s+|Learning Half Day\s*[-–—]\s*|Learning Half Day\s+)+/gi, "")
      .trim(),

  normalizeTitle: (str) =>
    String(str || "")
      .replace(/^(376\s*|LHD\s*[-–—]\s*|LHD\s+Fire\s*&\s*Rescue\s*[-–—]\s*|LHD\s+Fire\s*&\s*Rescue\s+|LHD\s+|Learning Half Day\s*[-–—]\s*|Learning Half Day\s+)+/gi, "")
      .replace(/\s+training$/gi, "")
      .replace(/self-care/gi, "self care")
      .replace(/Balidity/gi, "Validity")
      .trim()
      .toLowerCase(),

  getVenue: (obj) => {
    if (!obj) return "Virtual";
    const props = obj.extendedProps || obj;
    return (
      props["Delivery Mode"] ||
      props["Primary Venue"] ||
      props["Venue"] ||
      "Virtual"
    );
  },
};