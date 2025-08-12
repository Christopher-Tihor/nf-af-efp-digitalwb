import { LitElement } from 'lit';
export interface RatingOption {
    value: string;
    label: string;
    color: string;
}
export declare class RatingQuestion extends LitElement {
    questionId: string;
    questionType: string;
    options: RatingOption[];
    selectedValue: string;
    private hoveredValue;
    updated(changedProperties: Map<string, unknown>): void;
    static styles: import("lit").CSSResult;
    private getDefaultOptions;
    private handleOptionClick;
    private handleMouseEnter;
    private handleMouseLeave;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'rating-question': RatingQuestion;
    }
}
