/**
 * EFP Logger Utility
 * Centralized logging for EFP components with configurable debug levels
 * Extracted from EFPEntryForm.ts for better maintainability
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export interface LoggerConfig {
    enabled: boolean;
    level: LogLevel;
    prefix: string;
    timestamp: boolean;
    context: boolean;
}
export declare class EFPLogger {
    private static config;
    private static contexts;
    /**
     * Configure the logger
     */
    static configure(config: Partial<LoggerConfig>): void;
    /**
     * Set global context that will be included in all log messages
     */
    static setContext(key: string, value: any): void;
    /**
     * Remove global context
     */
    static removeContext(key: string): void;
    /**
     * Clear all global context
     */
    static clearContext(): void;
    /**
     * Format log message with timestamp and context
     */
    private static formatMessage;
    /**
     * Check if logging is enabled for the given level
     */
    private static shouldLog;
    /**
     * Log error messages (always shown if logging is enabled)
     */
    static error(...args: any[]): void;
    /**
     * Log warning messages
     */
    static warn(...args: any[]): void;
    /**
     * Log info messages
     */
    static info(...args: any[]): void;
    /**
     * Log debug messages
     */
    static debug(...args: any[]): void;
    /**
     * Log general messages (alias for debug)
     */
    static log(...args: any[]): void;
    /**
     * Log with custom level
     */
    static logWithLevel(level: LogLevel, ...args: any[]): void;
    /**
     * Create a scoped logger with additional context
     */
    static createScoped(scope: string, additionalContext?: Record<string, any>): ScopedLogger;
    /**
     * Log performance timing
     */
    static time(label: string): void;
    /**
     * End performance timing
     */
    static timeEnd(label: string): void;
    /**
     * Log a table (useful for debugging data structures)
     */
    static table(data: any, columns?: string[]): void;
    /**
     * Log a group (collapsible in browser dev tools)
     */
    static group(label: string, collapsed?: boolean): void;
    /**
     * End a log group
     */
    static groupEnd(): void;
    /**
     * Log an assertion
     */
    static assert(condition: boolean, ...args: any[]): void;
    /**
     * Count occurrences of a label
     */
    static count(label?: string): void;
    /**
     * Reset count for a label
     */
    static countReset(label?: string): void;
}
/**
 * Scoped logger that includes additional context in all log messages
 */
export declare class ScopedLogger {
    private scope;
    private context?;
    constructor(scope: string, context?: Record<string, any> | undefined);
    private formatArgs;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
    log(...args: any[]): void;
    time(label: string): void;
    timeEnd(label: string): void;
    table(data: any, columns?: string[]): void;
    group(label: string, collapsed?: boolean): void;
    groupEnd(): void;
    assert(condition: boolean, ...args: any[]): void;
    count(label?: string): void;
    countReset(label?: string): void;
}
export declare const logger: ScopedLogger;
export declare const error: (...args: any[]) => void, warn: (...args: any[]) => void, info: (...args: any[]) => void, debug: (...args: any[]) => void, log: (...args: any[]) => void, time: (label: string) => void, timeEnd: (label: string) => void, table: (data: any, columns?: string[]) => void, group: (label: string, collapsed?: boolean) => void, groupEnd: () => void, assert: (condition: boolean, ...args: any[]) => void, count: (label?: string) => void, countReset: (label?: string) => void;
