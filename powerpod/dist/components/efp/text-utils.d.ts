export declare class EFPTextUtils {
    static formatChapterTitle(chapterOrName: any): string;
    static truncateText(text: string, maxLength: number): string;
    /**
     * Converts newline characters (\n) to HTML line breaks (<br>)
     * Useful for displaying text with line breaks from the database
     */
    static convertNewlinesToBreaks(text: string): string;
}
