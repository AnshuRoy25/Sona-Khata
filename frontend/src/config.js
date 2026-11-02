// backend address, set VITE_API_URL in .env to change it
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// longest voice clip we send (Prisma REST accepts up to 30 seconds)
export const MAX_RECORDING_SECONDS = 25;
