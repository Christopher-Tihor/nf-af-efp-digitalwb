import { EFPSection } from './types.js';
export declare class EFPCompletionUtils {
    static calculateOverallCompletion(sections: EFPSection[]): number;
    static isSectionComplete(section: EFPSection): boolean;
}
