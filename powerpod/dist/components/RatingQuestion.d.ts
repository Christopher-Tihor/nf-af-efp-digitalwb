import { LitElement, TemplateResult } from 'lit';
export interface RatingOption {
    value: string;
    label: string;
    color: string;
}
export interface RatingMetadata {
    rating1OverwriteLabel?: string | null;
    rating1Description?: string | null;
    rating2OverwriteLabel?: string | null;
    rating2Description?: string | null;
    rating3OverwriteLabel?: string | null;
    rating3Description?: string | null;
    rating4OverwriteLabel?: string | null;
    rating4Description?: string | null;
}
export declare class RatingQuestion extends LitElement {
    questionId: string;
    questionType: string;
    options: RatingOption[];
    selectedValue: string;
    ratingMetadata: RatingMetadata;
    private hoveredValue;
    updated(changedProperties: Map<string, unknown>): void;
    static styles: import("lit").CSSResult;
    private getDefaultOptions;
    private handleOptionClick;
    private handleMouseEnter;
    private handleMouseLeave;
    private hasRatingDescriptions;
    private getRatingLabel;
    private getRatingDescription;
    private renderRatingOption;
    render(): TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'rating-question': RatingQuestion;
    }
}
