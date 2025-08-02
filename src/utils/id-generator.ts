/**
 * Generates a random ID combining a timestamp and random characters
 */
export const generateId = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

/**
 * Generates a random 8-digit number for quote IDs
 */
const generateRandomDigits = (length: number): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

/**
 * Generates a quote ID with F-prefix followed by 8 random digits
 * Format: F-[random 8 digits]
 * @param baseId Optional base ID to use
 */
export const generateQuoteId = (baseId?: string): string => {
  // If a baseId is provided, use it, otherwise generate a new one
  const randomPart = baseId || generateRandomDigits(8);
  return `F-${randomPart}`;
};

/**
 * Formats a quote ID with its version number for display
 * Format: F-[random 8 digits]-[version]
 */
export const formatQuoteId = (baseId: string, version: number): string => {
  const paddedVersion = version.toString().padStart(3, '0');
  return `${baseId}-${paddedVersion}`;
};

/**
 * Extracts the base ID (8 digits) from a quote ID
 * @param quoteId The full quote ID in format F-[random 8 digits] or F-[random 8 digits]-[version]
 * @returns The 8-digit base ID or null if the format is invalid
 */
export const extractBaseId = (quoteId: string): string | null => {
  // Match both formats: F-12345678 and F-12345678-001
  const match = quoteId.match(/^F-(\d{8})(?:-\d+)?$/);
  return match ? match[1] : null;
};

/**
 * Extracts the version number from a quote ID
 * @param quoteId The full quote ID in format F-[random 8 digits]-[version]
 * @returns The version number as a number or null if the format is invalid
 */
export const extractVersion = (quoteId: string): number | null => {
  const match = quoteId.match(/^F-\d{8}-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Gets the next version number for a quote
 * @param currentVersion The current version number
 * @returns The next version number
 */
export const getNextVersion = (currentVersion: number): number => {
  return currentVersion + 1;
};

/**
 * Generates a sequential client ID in the format "0001", "0002", etc.
 * Gets the highest existing client ID and increments it by 1
 */
export const generateClientId = (existingClients: { id: string }[]): string => {
  // If no clients exist, start with 0001
  if (!existingClients || existingClients.length === 0) {
    return '0001';
  }

  // Find the highest existing client ID
  const numericIds = existingClients
    .map(client => {
      // Try to convert ID to a number, if it's in the expected format
      const numericId = parseInt(client.id, 10);
      return isNaN(numericId) ? 0 : numericId;
    })
    .filter(id => id > 0);

  const highestId = numericIds.length > 0 ? Math.max(...numericIds) : 0;

  // Increment and pad with leading zeros
  const nextId = (highestId + 1).toString().padStart(4, '0');
  return nextId;
};