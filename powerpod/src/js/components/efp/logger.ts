// Utility class for logging (can be disabled in production)
export class EFPLogger {
  private static DEBUG = true; // Set to false in production

  static log(...args: any[]): void {
    if (EFPLogger.DEBUG) {
      console.log('[EFP]', ...args);
    }
  }

  static warn(...args: any[]): void {
    if (EFPLogger.DEBUG) {
      console.warn('[EFP]', ...args);
    }
  }

  static error(...args: any[]): void {
    if (EFPLogger.DEBUG) {
      console.error('[EFP]', ...args);
    }
  }

  static setDebug(enabled: boolean): void {
    EFPLogger.DEBUG = enabled;
  }

  static isDebugEnabled(): boolean {
    return EFPLogger.DEBUG;
  }
}
