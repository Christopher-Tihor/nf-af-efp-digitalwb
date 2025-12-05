import shoelace from '../../assets/css/shoelace.css';
import bootstrap from '../../assets/css/bootstrap.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Logger } from '../common/logger';
import { getActionPlansData, postActionPlanData } from '../common/fetch';
import { getCurrentWorkbookId } from '../common/workbookUtils';
import { getQuestionnaireFromStore, getChapterFromStore, getQuestionFromStore } from '../common/questionnaire';
import { POWERPOD } from '../common/constants';

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

  @query('#create-dialog') dialog!: any;
  @query('#chapter-select') chapterSelect!: any;
  @query('#question-select') questionSelect!: any;

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
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadActionPlans();
    this.loadChaptersAndQuestions();
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

  private handleChapterChange(e: Event) {
    const target = e.target as any;
    this.selectedChapterId = target?.value || '';
    this.selectedQuestionId = ''; // Reset question when chapter changes

    logger.info({
      fn: 'handleChapterChange',
      message: 'Chapter changed',
      data: { selectedChapterId: this.selectedChapterId },
    });

    // Load questions for selected chapter
    if (this.selectedChapterId) {
      const chapter = this.chapters.find(c => c.id === this.selectedChapterId);
      this.questions = chapter?.questions || [];
    } else {
      this.questions = [];
    }
  }

  private handleQuestionChange(e: Event) {
    const target = e.target as any;
    this.selectedQuestionId = target?.value || '';

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
    this.questions = [];

    // Force update to ensure the selects are cleared
    this.requestUpdate();

    this.dialog?.show();
  }

  private closeCreateDialog() {
    this.dialog?.hide();
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

  private getChapterName(chapterId: string | null): string {
    if (!chapterId) return '-';
    const chapter = this.chapters.find(c => c.id === chapterId);
    return chapter?.name || chapterId;
  }

  private getQuestionLabel(questionId: string | null): string {
    if (!questionId) return '-';
    const question = getQuestionFromStore(questionId);
    return question?.label || questionId;
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
          ? html`<div class="loading-message">Loading action plans...</div>`
          : this.error
          ? html`<div class="error-message">Error: ${this.error}</div>`
          : this.actionPlans.length === 0
          ? html`<div class="empty-message">No action plans found. Click "Create Action Plan" to add one.</div>`
          : html`
              <div class="table-container">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Workbook</th>
                      <th>Chapter</th>
                      <th>Question</th>
                      <th>Action</th>
                      <th>Created On</th>
                      <th>Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.actionPlans.map(
                      (plan) => html`
                        <tr>
                          <td>${plan['_quartech_workbook_value@OData.Community.Display.V1.FormattedValue'] || plan._quartech_workbook_value}</td>
                          <td>${this.getChapterName(plan._quartech_chapter_value)}</td>
                          <td>${this.getQuestionLabel(plan._quartech_workbookquestion_value)}</td>
                          <td>${plan.quartech_action}</td>
                          <td>${this.formatDate(plan.createdon, plan['createdon@OData.Community.Display.V1.FormattedValue'])}</td>
                          <td>${plan['_createdby_value@OData.Community.Display.V1.FormattedValue'] || plan._createdby_value}</td>
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
            <label>Chapter (Optional)</label>
            <sl-select
              id="chapter-select"
              placeholder="Select a chapter"
              .value=${this.selectedChapterId}
              @sl-change=${this.handleChapterChange}
              clearable
              hoist
            >
              ${this.chapters.map(
                (chapter) => html`
                  <sl-option value=${chapter.id}>${chapter.name}</sl-option>
                `
              )}
            </sl-select>
          </div>

          <div class="form-field">
            <label>Question (Optional)</label>
            <sl-select
              id="question-select"
              placeholder="Select a question"
              .value=${this.selectedQuestionId}
              @sl-change=${this.handleQuestionChange}
              ?disabled=${!this.selectedChapterId}
              clearable
              hoist
            >
              ${this.questions.map(
                (question) => html`
                  <sl-option value=${question.id}>${question.label || question.name}</sl-option>
                `
              )}
            </sl-select>
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
      </div>
    `;
  }
}

export default ActionPlanTable;

