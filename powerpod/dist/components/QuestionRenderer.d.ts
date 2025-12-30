import { LitElement } from 'lit';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import './RatingQuestion';
import { WorkbookResponseService } from '../services/WorkbookResponseService.js';
/**
 * Component responsible for rendering individual questions
 * Handles different question types and their interactions
 */
export declare class QuestionRenderer extends LitElement {
    question: any;
    isDisabled: boolean;
    hasTriedToSubmit: boolean;
    responseService: WorkbookResponseService | null;
    actionPlanCount: number;
    existingResponse: any;
    updateCounter: number;
    createRenderRoot(): this;
    private getQuestionTypeName;
    private isIncomplete;
    private handleRatingChanged;
    private handleMultiselectChange;
    private handleMultilineTextInput;
    private handleForceSave;
    private handleAddNoteToActionPlan;
    private handleViewExistingActions;
    private renderActionPlanButtons;
    private renderQuestionInput;
    private renderSaveStatusIndicator;
    private renderMultiselectInput;
    private renderRatingInput;
    private renderMultilineTextInput;
    private renderDefaultInput;
    render(): import("lit-html").TemplateResult<1>;
}
