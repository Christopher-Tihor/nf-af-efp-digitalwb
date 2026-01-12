import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { LitElement } from 'lit';
import './SearchableDropdown.js';
type ActionPlan = {
    quartech_actionplanid: string;
    quartech_action: string;
    _quartech_workbook_value: string;
    _quartech_chapter_value: string | null;
    _quartech_workbookquestion_value: string | null;
    createdon: string;
    _createdby_value: string;
    'createdon@OData.Community.Display.V1.FormattedValue'?: string;
    '_createdby_value@OData.Community.Display.V1.FormattedValue'?: string;
    '_quartech_workbook_value@OData.Community.Display.V1.FormattedValue'?: string;
};
declare class ActionPlanTable extends LitElement {
    actionPlans: ActionPlan[];
    hideTable: boolean;
    private loading;
    private error;
    private selectedChapterId;
    private selectedQuestionId;
    private actionDescription;
    private creating;
    private chapters;
    private questions;
    private chapterOptions;
    private questionOptions;
    private editing;
    private deleting;
    private editingPlan;
    private deletingPlan;
    private viewingQuestionId;
    dialog: any;
    editDialog: any;
    deleteDialog: any;
    viewActionsDialog: any;
    static styles: import("lit").CSSResult[];
    private handleExternalActionPlansUpdate;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private loadActionPlans;
    private loadChaptersAndQuestions;
    private loadAllQuestions;
    private handleChapterChange;
    private handleQuestionChange;
    private handleActionChange;
    private openCreateDialog;
    /**
     * Public method to open the create dialog with pre-selected chapter and question.
     * This can be called externally (e.g., from a button next to a question).
     * @param chapterId - The chapter ID to pre-select
     * @param questionId - The question ID to pre-select
     */
    openCreateDialogWithSelection(chapterId: string, questionId: string): void;
    private closeCreateDialog;
    private openEditDialog;
    private closeEditDialog;
    private handleEditActionPlan;
    private openDeleteDialog;
    private closeDeleteDialog;
    private handleDeleteActionPlan;
    private handleCreateActionPlan;
    private stripHtmlAndDecode;
    private getChapterName;
    private getQuestionLabel;
    private formatDate;
    /**
     * Public method to get the count of action plans for a specific question.
     * This can be called externally (e.g., from EFPEntryForm) to check if a question has action plans.
     * @param questionId - The question ID to check
     * @returns The count of action plans associated with this question
     */
    getActionPlanCountForQuestion(questionId: string): number;
    /**
     * Public method to get action plans for a specific question.
     * This can be called externally to retrieve the actual action plans.
     * @param questionId - The question ID to check
     * @returns Array of action plans associated with this question
     */
    getActionPlansForQuestion(questionId: string): ActionPlan[];
    /**
     * Public method to open a dialog showing existing action plans for a question.
     * This can be called externally (e.g., from the "View Existing Actions" button).
     * @param questionId - The question ID to view action plans for
     */
    openViewActionsDialog(questionId: string): void;
    private closeViewActionsDialog;
    render(): import("lit-html").TemplateResult<1>;
}
export default ActionPlanTable;
