/**
 * EFP Data Service
 * Data management and API interaction service for EFP components
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { EFPSection, EFPResponseData, EFPCompletionStats } from '../types/efp-types.js';
export declare class EFPDataService {
    private static logger;
    private static cache;
    private static cacheExpiry;
    private static readonly CACHE_DURATION;
    /**
     * Load questionnaire data from store
     */
    static loadQuestionnaireData(): Promise<EFPSection[]>;
    /**
     * Load workbook responses
     */
    static loadWorkbookResponses(workbookId: string): Promise<EFPResponseData[]>;
    /**
     * Save question response
     */
    static saveQuestionResponse(questionId: string, response: string, workbookId: string, notes?: string): Promise<EFPResponseData>;
    /**
     * Get response for a specific question
     */
    static getQuestionResponse(questionId: string, workbookId: string): Promise<EFPResponseData | null>;
    /**
     * Delete question response
     */
    static deleteQuestionResponse(questionId: string, workbookId: string): Promise<boolean>;
    /**
     * Get completion statistics
     */
    static getCompletionStats(workbookId: string): Promise<EFPCompletionStats>;
    /**
     * Sync data with POWERPOD global store
     */
    static syncWithPOWERPOD(): {
        workbookResponses: any[];
        isLoaded: boolean;
        stats?: EFPCompletionStats;
    };
    /**
     * Cache management methods
     */
    private static setCache;
    private static getFromCache;
    private static invalidateCache;
    /**
     * Clear all cached data
     */
    static clearCache(): void;
    /**
     * Get cache statistics
     */
    static getCacheStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Validate response data
     */
    static validateResponseData(data: any): data is EFPResponseData;
    /**
     * Transform raw API response to EFPResponseData
     */
    static transformResponseData(rawData: any): EFPResponseData;
    /**
     * Handle API errors gracefully
     */
    private static handleApiError;
}
