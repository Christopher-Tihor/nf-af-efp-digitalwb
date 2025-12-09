import shoelace from '../../assets/css/shoelace.css';
import bootstrap from '../../assets/css/bootstrap.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Logger } from '../common/logger';
import { getActionPlansData, postActionPlanData, patchActionPlanData, deleteActionPlanData } from '../common/fetch';
import { getCurrentWorkbookId } from '../common/workbookUtils';
import { getQuestionnaireFromStore, getQuestionFromStore } from '../common/questionnaire';
import store from '../store/index.js';
import './SearchableDropdown.js';
import type { DropdownOption } from './SearchableDropdown.js';

const logger = Logger('components/ActionPlanTable');

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

@customElement('action-plan-table')
class ActionPlanTable extends LitElement {
  @property({ type: Array }) actionPlans: ActionPlan[] = [];
  @state() private loading = true;
  @state() private error: string | null = null;
  @state() private selectedChapterId: string = '';
  @state() private selectedQuestionId: string = '';
  @state() private actionDescription: string = '';
  @state() private creating = false;
  @state() private chapters: any[] = [];
  @state() private questions: any[] = [];
  @state() private chapterOptions: DropdownOption[] = [];
  @state() private questionOptions: DropdownOption[] = [];
  @state() private editing = false;
  @state() private deleting = false;
  @state() private editingPlan: ActionPlan | null = null;
  @state() private deletingPlan: ActionPlan | null = null;

  @query('#create-dialog') dialog!: any;
  @query('#edit-dialog') editDialog!: any;
  @query('#delete-dialog') deleteDialog!: any;

  static styles = [
    css`
      ${unsafeCSS(shoelace)}
      ${unsafeCSS(bootstrap)}
      
      :host {
        display: block;
        font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif;
      }

      .action-plan-container {
        margin-top: 2rem;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .table-container {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }

      thead {
        background-color: #f8f9fa;
      }

      th {
        padding: 0.75rem;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #dee2e6;
        white-space: nowrap;
      }

      td {
        padding: 0.75rem;
        border-bottom: 1px solid #dee2e6;
      }

      tbody tr:hover {
        background-color: #f8f9fa;
      }

      .loading-message, .error-message, .empty-message {
        padding: 2rem;
        text-align: center;
      }

      .loading-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .error-message {
        color: #dc3545;
      }

      .form-field {
        margin-bottom: 1rem;
      }

      .form-field label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }

      .required::after {
        content: ' *';
        color: #dc3545;
      }

      sl-button::part(base) {
        font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .action-buttons sl-button::part(base) {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      }

      .delete-warning {
        color: #dc3545;
        margin-bottom: 1rem;
      }

      .delete-plan-details {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
      }

      .delete-plan-details dt {
        font-weight: 600;
        margin-top: 0.5rem;
      }

      .delete-plan-details dd {
        margin-left: 0;
        margin-bottom: 0.5rem;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadActionPlans();
    this.loadChaptersAndQuestions();

    // Subscribe to store changes to update when questionnaire data loads
    store.events.subscribe('stateChange', (state: any) => {
      if (state.questionnaire?.chapters?.length > 0 && this.chapters.length === 0) {
        logger.info({
          fn: 'connectedCallback',
          message: 'Questionnaire data loaded in store, updating chapters',
        });
        this.loadChaptersAndQuestions();
        this.requestUpdate();
      }
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Note: PubSub doesn't have unsubscribe, but component cleanup happens automatically
  }

  private async loadActionPlans() {
    try {
      this.loading = true;
      this.error = null;

      const workbookId = getCurrentWorkbookId();
      if (!workbookId) {
        throw new Error('No workbook ID found');
      }

      logger.info({
        fn: 'loadActionPlans',
        message: 'Fetching action plans',
        data: { workbookId },
      });

      const result = await getActionPlansData();

      if (!result?.data?.value) {
        throw new Error('Invalid response from action plans API');
      }

      // Filter action plans for current workbook
      this.actionPlans = result.data.value.filter(
        (plan: ActionPlan) => plan._quartech_workbook_value === workbookId
      );

      logger.info({
        fn: 'loadActionPlans',
        message: 'Action plans loaded successfully',
        data: { count: this.actionPlans.length },
      });
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load action plans';
      logger.error({
        fn: 'loadActionPlans',
        message: 'Failed to load action plans',
        data: { error: err },
      });
    } finally {
      this.loading = false;
    }
  }

  private loadChaptersAndQuestions() {
    try {
      const questionnaire = getQuestionnaireFromStore();
      if (!questionnaire?.chapters) {
        logger.warn({
          fn: 'loadChaptersAndQuestions',
          message: 'Questionnaire not loaded yet',
        });
        return;
      }

      // Flatten chapters from nested structure
      this.chapters = [];
      const flattenChapters = (chapterArray: any[]) => {
        for (const chapterGroup of chapterArray) {
          if (Array.isArray(chapterGroup)) {
            for (const chapter of chapterGroup) {
              this.chapters.push(chapter);
              if (chapter.subchapters) {
                flattenChapters([chapter.subchapters]);
              }
            }
          }
        }
      };
      flattenChapters(questionnaire.chapters);

      // Convert chapters to dropdown options
      this.chapterOptions = this.chapters.map(chapter => ({
        value: chapter.id,
        label: chapter.name
      }));

      // Load all questions from all chapters for the unfiltered dropdown
      this.loadAllQuestions();

      logger.info({
        fn: 'loadChaptersAndQuestions',
        message: 'Chapters loaded',
        data: { count: this.chapters.length },
      });
    } catch (err) {
      logger.error({
        fn: 'loadChaptersAndQuestions',
        message: 'Failed to load chapters and questions',
        data: { error: err },
      });
    }
  }

  private loadAllQuestions() {
    // Collect all questions from all chapters
    const allQuestions: any[] = [];
    for (const chapter of this.chapters) {
      if (chapter.questions && Array.isArray(chapter.questions)) {
        allQuestions.push(...chapter.questions);
      }
    }
    this.questions = allQuestions;

    // Convert questions to dropdown options
    this.questionOptions = this.questions.map(question => ({
      value: question.id,
      label: this.stripHtmlAndDecode(question.label || question.name)
    }));

    logger.info({
      fn: 'loadAllQuestions',
      message: 'All questions loaded',
      data: { count: this.questions.length },
    });
  }

  private handleChapterChange(e: CustomEvent) {
    this.selectedChapterId = e.detail?.value || '';
    this.selectedQuestionId = ''; // Reset question when chapter changes

    logger.info({
      fn: 'handleChapterChange',
      message: 'Chapter changed',
      data: { selectedChapterId: this.selectedChapterId },
    });

    // Load questions for selected chapter, or all questions if no chapter selected
    if (this.selectedChapterId) {
      const chapter = this.chapters.find(c => c.id === this.selectedChapterId);
      this.questions = chapter?.questions || [];
      this.questionOptions = this.questions.map(question => ({
        value: question.id,
        label: this.stripHtmlAndDecode(question.label || question.name)
      }));
    } else {
      // Load all questions when no chapter is selected
      this.loadAllQuestions();
    }
  }

  private handleQuestionChange(e: CustomEvent) {
    this.selectedQuestionId = e.detail?.value || '';

    logger.info({
      fn: 'handleQuestionChange',
      message: 'Question changed',
      data: { selectedQuestionId: this.selectedQuestionId },
    });
  }

  private handleActionChange(e: Event) {
    const target = e.target as any;
    this.actionDescription = target?.value || '';
  }

  private openCreateDialog() {
    // Ensure chapters are loaded before showing dialog
    this.loadChaptersAndQuestions();

    // Reset form state
    this.selectedChapterId = '';
    this.selectedQuestionId = '';
    this.actionDescription = '';

    // Load all questions initially (since no chapter is selected)
    this.loadAllQuestions();

    // Force update to ensure the selects are cleared
    this.requestUpdate();

    this.dialog?.show();
  }

  private closeCreateDialog() {
    this.dialog?.hide();
  }

  private openEditDialog(plan: ActionPlan) {
    // Ensure chapters are loaded before showing dialog
    this.loadChaptersAndQuestions();

    // Set form state from the plan being edited
    this.editingPlan = plan;
    this.selectedChapterId = plan._quartech_chapter_value || '';
    this.selectedQuestionId = plan._quartech_workbookquestion_value || '';
    this.actionDescription = plan.quartech_action || '';

    // Load questions based on selected chapter
    if (this.selectedChapterId) {
      const chapter = this.chapters.find(c => c.id === this.selectedChapterId);
      this.questions = chapter?.questions || [];
      this.questionOptions = this.questions.map(question => ({
        value: question.id,
        label: this.stripHtmlAndDecode(question.label || question.name)
      }));
    } else {
      this.loadAllQuestions();
    }

    // Force update to ensure the selects show correct values
    this.requestUpdate();

    this.editDialog?.show();
  }

  private closeEditDialog() {
    this.editDialog?.hide();
    this.editingPlan = null;
  }

  private async handleEditActionPlan() {
    if (!this.actionDescription.trim()) {
      alert('Action description is required');
      return;
    }

    if (!this.editingPlan) {
      alert('No action plan selected for editing');
      return;
    }

    try {
      this.editing = true;

      logger.info({
        fn: 'handleEditActionPlan',
        message: 'Updating action plan',
        data: {
          actionPlanId: this.editingPlan.quartech_actionplanid,
          chapterId: this.selectedChapterId || null,
          questionId: this.selectedQuestionId || null,
          action: this.actionDescription,
        },
      });

      await patchActionPlanData({
        actionPlanId: this.editingPlan.quartech_actionplanid,
        chapterId: this.selectedChapterId || null,
        questionId: this.selectedQuestionId || null,
        action: this.actionDescription,
      });

      logger.info({
        fn: 'handleEditActionPlan',
        message: 'Action plan updated successfully',
      });

      // Reload action plans
      await this.loadActionPlans();

      // Close dialog
      this.closeEditDialog();
    } catch (err) {
      logger.error({
        fn: 'handleEditActionPlan',
        message: 'Failed to update action plan',
        data: { error: err },
      });
      alert('Failed to update action plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      this.editing = false;
    }
  }

  private openDeleteDialog(plan: ActionPlan) {
    this.deletingPlan = plan;
    this.deleteDialog?.show();
  }

  private closeDeleteDialog() {
    this.deleteDialog?.hide();
    this.deletingPlan = null;
  }

  private async handleDeleteActionPlan() {
    if (!this.deletingPlan) {
      alert('No action plan selected for deletion');
      return;
    }

    try {
      this.deleting = true;

      logger.info({
        fn: 'handleDeleteActionPlan',
        message: 'Deleting action plan',
        data: {
          actionPlanId: this.deletingPlan.quartech_actionplanid,
        },
      });

      await deleteActionPlanData({
        actionPlanId: this.deletingPlan.quartech_actionplanid,
      });

      logger.info({
        fn: 'handleDeleteActionPlan',
        message: 'Action plan deleted successfully',
      });

      // Reload action plans
      await this.loadActionPlans();

      // Close dialog
      this.closeDeleteDialog();
    } catch (err) {
      logger.error({
        fn: 'handleDeleteActionPlan',
        message: 'Failed to delete action plan',
        data: { error: err },
      });
      alert('Failed to delete action plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      this.deleting = false;
    }
  }

  private async handleCreateActionPlan() {
    if (!this.actionDescription.trim()) {
      alert('Action description is required');
      return;
    }

    try {
      this.creating = true;
      const workbookId = getCurrentWorkbookId();

      if (!workbookId) {
        throw new Error('No workbook ID found');
      }

      logger.info({
        fn: 'handleCreateActionPlan',
        message: 'Creating action plan',
        data: {
          workbookId,
          chapterId: this.selectedChapterId || null,
          questionId: this.selectedQuestionId || null,
          action: this.actionDescription,
        },
      });

      await postActionPlanData({
        workbookId,
        chapterId: this.selectedChapterId || null,
        questionId: this.selectedQuestionId || null,
        action: this.actionDescription,
      });

      logger.info({
        fn: 'handleCreateActionPlan',
        message: 'Action plan created successfully',
      });

      // Reload action plans
      await this.loadActionPlans();

      // Close dialog
      this.closeCreateDialog();
    } catch (err) {
      logger.error({
        fn: 'handleCreateActionPlan',
        message: 'Failed to create action plan',
        data: { error: err },
      });
      alert('Failed to create action plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      this.creating = false;
    }
  }

  private stripHtmlAndDecode(html: string): string {
    if (!html) return '';

    // Create a temporary DOM element to decode HTML entities and strip tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get the text content (this automatically strips HTML tags)
    const text = tempDiv.textContent || tempDiv.innerText || '';

    // Clean up extra whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  private getChapterName(chapterId: string | null): string {
    if (!chapterId) return '-';
    const chapter = this.chapters.find(c => c.id === chapterId);
    return chapter?.name || chapterId;
  }

  private getQuestionLabel(questionId: string | null): string {
    if (!questionId) return '-';
    const question = getQuestionFromStore(questionId);
    const label = question?.label || questionId;
    return this.stripHtmlAndDecode(label);
  }

  private formatDate(dateString: string, formattedValue?: string): string {
    if (formattedValue) return formattedValue;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  render() {
    return html`
      <div class="action-plan-container">
        <div class="header-row">
          <h3>Action Plans</h3>
          <sl-button variant="primary" @click=${this.openCreateDialog}>
            Create Action Plan
          </sl-button>
        </div>

        ${this.loading
          ? html`<div class="loading-message">
              <sl-spinner style="font-size: 3rem;"></sl-spinner>
              <div>Loading action plans...</div>
            </div>`
          : this.error
          ? html`<div class="error-message">Error: ${this.error}</div>`
          : this.actionPlans.length === 0
          ? html`<div class="empty-message">No action plans found. Click "Create Action Plan" to add one.</div>`
          : html`
              <div class="table-container">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Chapter</th>
                      <th>Question</th>
                      <th>Action</th>
                      <th>Created On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.actionPlans.map(
                      (plan) => html`
                        <tr>
                          <td>${this.getChapterName(plan._quartech_chapter_value)}</td>
                          <td>${this.getQuestionLabel(plan._quartech_workbookquestion_value)}</td>
                          <td>${plan.quartech_action}</td>
                          <td>${this.formatDate(plan.createdon, plan['createdon@OData.Community.Display.V1.FormattedValue'])}</td>
                          <td>
                            <div class="action-buttons">
                              <sl-button size="small" variant="default" @click=${() => this.openEditDialog(plan)}>
                                Edit
                              </sl-button>
                              <sl-button size="small" variant="danger" @click=${() => this.openDeleteDialog(plan)}>
                                Delete
                              </sl-button>
                            </div>
                          </td>
                        </tr>
                      `
                    )}
                  </tbody>
                </table>
              </div>
            `}

        <!-- Create Action Plan Dialog -->
        <sl-dialog id="create-dialog" label="Create Action Plan">
          <div class="form-field">
            <searchable-dropdown
              id="chapter-dropdown"
              .options=${this.chapterOptions}
              .selectedValue=${this.selectedChapterId}
              fieldLabel="Chapter (Optional)"
              placeholder="Search or select a chapter"
              clearable
              @onChangeSearchableDropdown=${this.handleChapterChange}
            ></searchable-dropdown>
          </div>

          <div class="form-field">
            <searchable-dropdown
              id="question-dropdown"
              .options=${this.questionOptions}
              .selectedValue=${this.selectedQuestionId}
              fieldLabel="Question (Optional)"
              placeholder="Search or select a question"
              clearable
              @onChangeSearchableDropdown=${this.handleQuestionChange}
            ></searchable-dropdown>
          </div>

          <div class="form-field">
            <label class="required">Action Description</label>
            <sl-textarea
              placeholder="Enter action description"
              rows="4"
              .value=${this.actionDescription}
              @sl-input=${this.handleActionChange}
              required
            ></sl-textarea>
          </div>

          <div slot="footer">
            <sl-button variant="default" @click=${this.closeCreateDialog}>
              Cancel
            </sl-button>
            <sl-button
              variant="primary"
              @click=${this.handleCreateActionPlan}
              ?loading=${this.creating}
              ?disabled=${!this.actionDescription.trim()}
            >
              Create
            </sl-button>
          </div>
        </sl-dialog>

        <!-- Edit Action Plan Dialog -->
        <sl-dialog id="edit-dialog" label="Edit Action Plan">
          <div class="form-field">
            <searchable-dropdown
              id="edit-chapter-dropdown"
              .options=${this.chapterOptions}
              .selectedValue=${this.selectedChapterId}
              fieldLabel="Chapter (Optional)"
              placeholder="Search or select a chapter"
              clearable
              @onChangeSearchableDropdown=${this.handleChapterChange}
            ></searchable-dropdown>
          </div>

          <div class="form-field">
            <searchable-dropdown
              id="edit-question-dropdown"
              .options=${this.questionOptions}
              .selectedValue=${this.selectedQuestionId}
              fieldLabel="Question (Optional)"
              placeholder="Search or select a question"
              clearable
              @onChangeSearchableDropdown=${this.handleQuestionChange}
            ></searchable-dropdown>
          </div>

          <div class="form-field">
            <label class="required">Action Description</label>
            <sl-textarea
              placeholder="Enter action description"
              rows="4"
              .value=${this.actionDescription}
              @sl-input=${this.handleActionChange}
              required
            ></sl-textarea>
          </div>

          <div slot="footer">
            <sl-button variant="default" @click=${this.closeEditDialog}>
              Cancel
            </sl-button>
            <sl-button
              variant="primary"
              @click=${this.handleEditActionPlan}
              ?loading=${this.editing}
              ?disabled=${!this.actionDescription.trim()}
            >
              Save Changes
            </sl-button>
          </div>
        </sl-dialog>

        <!-- Delete Confirmation Dialog -->
        <sl-dialog id="delete-dialog" label="Delete Action Plan">
          <p class="delete-warning">Are you sure you want to delete this action plan? This action cannot be undone.</p>

          ${this.deletingPlan ? html`
            <div class="delete-plan-details">
              <dl>
                <dt>Chapter</dt>
                <dd>${this.getChapterName(this.deletingPlan._quartech_chapter_value)}</dd>
                <dt>Question</dt>
                <dd>${this.getQuestionLabel(this.deletingPlan._quartech_workbookquestion_value)}</dd>
                <dt>Action</dt>
                <dd>${this.deletingPlan.quartech_action}</dd>
              </dl>
            </div>
          ` : ''}

          <div slot="footer">
            <sl-button variant="default" @click=${this.closeDeleteDialog}>
              Cancel
            </sl-button>
            <sl-button
              variant="danger"
              @click=${this.handleDeleteActionPlan}
              ?loading=${this.deleting}
            >
              Delete
            </sl-button>
          </div>
        </sl-dialog>
      </div>
    `;
  }
}

export default ActionPlanTable;

