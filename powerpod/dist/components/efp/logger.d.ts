export declare class EFPLogger {
    private static DEBUG;
    static log(...args: any[]): void;
    static warn(...args: any[]): void;
    static error(...args: any[]): void;
    static setDebug(enabled: boolean): void;
    static isDebugEnabled(): boolean;
}
