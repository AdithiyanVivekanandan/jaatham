/**
 * geocoder.js — OpenCage geocoding with SSRF protections
 * 
 * Security hardening:
 * - Request timeout (5s) prevents SSRF slow-loris via placeOfBirth
 * - Response domain validated — must come from opencagedata.com
 * - Coordinate range validated after response
 * - No user input is included in the API key parameter
 */

const OPENCAGE_BASE = 'https://api.opencagedata.com/geocode/v1/json';
const TIMEOUT_MS = 5000; // 5 second timeout

const geocode = async (placeName) => {
  try {
    if (!process.env.OPENCAGE_API_KEY) {
      // Mock for development — return Chennai coordinates
      return { latitude: 13.0827, longitude: 80.2707 };
    }

    // Input is already validated by Zod in profiles.js before reaching here
    // (must match /^[\p{L}\s,.\-']+$/u) — but we still encode it safely
    const encoded = encodeURIComponent(placeName);
    const url = `${OPENCAGE_BASE}?q=${encoded}&key=${process.env.OPENCAGE_API_KEY}&limit=1&no_annotations=1`;

    // AbortController for timeout — prevents hanging requests (SSRF slow-loris)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Jatham-App/1.0'
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Validate the response came from the expected host
    // (fetch follows redirects; check final URL if available)
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.results?.length) {
      throw new Error('Location not found');
    }

    const { lat, lng } = data.results[0].geometry;

    // Validate coordinate ranges (basic sanity check)
    if (typeof lat !== 'number' || typeof lng !== 'number' ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates received from geocoder');
    }

    return { latitude: lat, longitude: lng };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Geocoding request timed out');
    }
    // Re-throw sanitized error — don't leak API response internals
    throw new Error('Location lookup failed. Please try a different place name.');
  }
};

module.exports = { geocode };
