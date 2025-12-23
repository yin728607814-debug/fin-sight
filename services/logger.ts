export const logInfo = (message: string, data?: unknown): void => {
  console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data || '');
};

export const logWarn = (message: string, data?: unknown): void => {
  console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data || '');
};

export const logError = (message: string, error?: unknown): void => {
  console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
};

// Placeholder for future API integration
export const checkHealth = async (): Promise<boolean> => {
  // Simulate an API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 500);
  });
};