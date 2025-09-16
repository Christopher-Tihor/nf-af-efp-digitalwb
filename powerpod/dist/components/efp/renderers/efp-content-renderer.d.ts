/**
 * EFP Content Renderer
 * Main content rendering utilities for EFP components
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { TemplateResult } from 'lit';
import { EFPStep, EFPActiveContent } from '../types/efp-types.js';
export declare class EFPContentRenderer {
    private static logger;
    /**
     * Render main content area based on current step
     */
    static renderMainContent(activeContent: EFPActiveContent, currentStep: EFPStep | undefined, workbookId: string | undefined, getQuestionForQuestion: (questionId: string) => any, getResponseForQuestion: (questionId: string) => any): TemplateResult;
    /**
     * Render question content with appropriate question type component
     */
    static renderQuestionContent(question: any, workbookId: string | undefined, getQuestionForQuestion: (questionId: string) => any, getResponseForQuestion: (questionId: string) => any): TemplateResult;
    /**
     * Render question header with text and tooltip
     */
    static renderQuestionHeader(question: any): TemplateResult;
    /**
     * Render question based on its type
     */
    static renderQuestionByType(question: any, questionType: string, workbookId: string | undefined, questionData: any, responseData: any): TemplateResult;
    /**
     * Render rating question component
     */
    static renderRatingQuestion(questionId: string, workbookId: string | undefined, question: any, questionData: any, responseData: any): TemplateResult;
    /**
     * Render textarea question
     */
    static renderTextareaQuestion(questionId: string, question: any, responseData: any): TemplateResult;
    /**
     * Render text input question
     */
    static renderTextQuestion(questionId: string, question: any, responseData: any): TemplateResult;
    /**
     * Render select dropdown question
     */
    static renderSelectQuestion(questionId: string, question: any, responseData: any): TemplateResult;
    /**
     * Render radio button question
     */
    static renderRadioQuestion(questionId: string, question: any, responseData: any): TemplateResult;
    /**
     * Render checkbox question
     */
    static renderCheckboxQuestion(questionId: string, question: any, responseData: any): TemplateResult;
    /**
     * Render generic question fallback
     */
    static renderGenericQuestion(questionId: string, question: any, responseData: any): TemplateResult;
    /**
     * Handle question response changes
     */
    private static handleQuestionResponse;
    /**
     * Handle checkbox response changes
     */
    private static handleCheckboxResponse;
    /**
     * Render loading state
     */
    static renderLoadingState(message?: string): TemplateResult;
    /**
     * Render error state
     */
    static renderErrorState(error: string, onRetry?: () => void): TemplateResult;
    /**
     * Render empty state
     */
    static renderEmptyState(message?: string): TemplateResult;
}
