import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import './NavigationButtons';
import './RatingQuestion';
import './EFPBreadcrumbs';
import WorkbookResponseHelper from '../common/workbookResponseHelper.js';
import { getWorkbookId } from '../common/workbookUtils.js';
import { POWERPOD } from '../common/constants.js';
import { Logger } from '../common/logger.js';
import {
  getQuestionnaireFromStore,
  getChapterFromStore,
  getQuestionFromStore,
  updateQuestionResponse,
  isQuestionnaireLoaded
} from '../common/questionnaire.js';
import { EFPEventUtils } from './efp/event-utils.js';
import { EFPTextUtils } from './efp/text-utils.js';
import { EFPCompletionUtils } from './efp/completion-utils.js';
import { EFPNavigationUtils } from './efp/navigation-utils.js';
import { EFPLifecycleUtils } from './efp/lifecycle-utils.js';
import { EFPSectionGenerator } from './efp/section-generator.js';
import { EFPRenderUtils } from './efp/render-utils.js';







import { efpEntryFormStyles } from './EFPEntryForm.styles';

// Shared type definitions
import { EFPStep, EFPSection, EFPSectionItem, QuestionsAndResponsesMemory } from './efp/types.js';

interface EFPActiveContent {
  title: string;
  content: string;
}

// Create logger instance for EFP components
const logger = Logger('components/EFPEntryForm');










@customElement('efp-entry-form')
export class EFPEntryForm extends LitElement {
  @property({ type: Number }) currentSectionIndex = 0;
  @property({ type: Number }) currentStepIndex = 0;
  @property({ type: Array, attribute: false }) nestedChapterStructure: any[] = [];
  @property({ type: Array, attribute: false }) workbookResponses: any[] = [];
  @property({ type: Boolean, attribute: false }) isLoadingResponses = false;
  @property({ type: Boolean, attribute: false }) questionnaireStoreLoaded = false;
  @property({ type: Boolean, attribute: false }) questionsAndResponsesLoaded = false;
  private isNavigating = false; // Flag to prevent tab change interference
  @property({ type: Object }) activeContent: EFPActiveContent = {
    title: 'Introduction to the Environmental Farm Plan (EFP)',
    content:
      'The purpose of the EFP is to assess the features and management of your farm to identify environmental risks and develop an action plan.',
  };
  @query('sl-tab-group') tabGroupEl!: HTMLElement & {
    show: (tabName: string) => void;
  };

  // Debounce timers for all response saves (questionId -> timer)
  private responseSaveDebounceTimers: Map<string, number> = new Map();
  // Pending response values (questionId -> response value)
  private pendingResponseValues: Map<string, string> = new Map();
  // Pending multi-select values (questionId -> selected options array)
  private pendingMultiselectValues: Map<string, string[]> = new Map();

  connectedCallback() {
    super.connectedCallback();
    logger.info({ message: 'EFPEntryForm connected' });

    // Check if questionnaire store is already loaded
    this.updateQuestionnaireStoreStatus();

    // Set up periodic check for questionnaire store loading
    this.setupQuestionnaireStoreWatcher();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Clear all pending debounce timers
    this.responseSaveDebounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.responseSaveDebounceTimers.clear();
    this.pendingResponseValues.clear();
    this.pendingMultiselectValues.clear();

    logger.info({ message: 'EFPEntryForm disconnected, cleared pending timers' });
  }

  // Update the reactive property based on store status
  private updateQuestionnaireStoreStatus() {
    const wasLoaded = this.questionnaireStoreLoaded;
    this.questionnaireStoreLoaded = isQuestionnaireLoaded();

    if (!wasLoaded && this.questionnaireStoreLoaded) {
      logger.info({ message: '📋 Questionnaire store loaded, updating navigation' });
      this.requestUpdate(); // Force re-render when store becomes available
    }
  }

  // Set up watcher for questionnaire store loading
  private setupQuestionnaireStoreWatcher() {
    // Check every 500ms if store is loaded (only if not already loaded)
    const checkInterval = setInterval(() => {
      if (!this.questionnaireStoreLoaded) {
        this.updateQuestionnaireStoreStatus();
      } else {
        clearInterval(checkInterval); // Stop checking once loaded
      }
    }, 500);

    // Clear interval after 30 seconds to prevent infinite checking
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  }

  static styles = efpEntryFormStyles;

  private get sections(): EFPSection[] {
    return [
    {
      tab: 'Section A',
      title: 'Farm Business Profile',
      items: [
        {
          label: 'Farm Business Name',
          content: `
          <h3>Farm Business Name</h3>
          <p>Please enter the legal name under which your farm operates. This should match your tax documents and business registration.</p>
          <p>If your farm uses a different operating name or DBA ("doing business as"), include that as well.</p>
          ${this.renderResponsesSummary()}
        `,
          complete: true,
        },
        {
          label: 'Ownership Details',
          content: `
          <h3>Ownership Details</h3>
          <p>Provide details about the ownership structure of your farm.</p>
          <ul>
            <li>Is the farm owned by an individual, partnership, or corporation?</li>
            <li>List all owners and their roles.</li>
            <li>Indicate who is responsible for daily operations and environmental decision-making.</li>
          </ul>
        `,
          complete: false,
        },
        {
          label: 'Nested Section: Certifications',
          title: 'Nested Section: Certifications',
          items: [
            {
              label: 'Organic Certification',
              content: `
              <h3>Organic Certification</h3>
              <p>This section documents your organic certification status.</p>
              <p>Certified by: <strong>Pacific Organic Growers (POG)</strong></p>
              <p>Include your certificate number and expiration date, and upload supporting documentation if available.</p>
            `,
              complete: true,
            },
            {
              label: 'Other Accreditation',
              content: `
              <h3>Other Environmental or Farm Certifications</h3>
              <p>If your farm has additional certifications such as:</p>
              <ul>
                <li>Environmental Farm Stewardship</li>
                <li>Salmon Safe</li>
                <li>Bee-Friendly Farming</li>
              </ul>
              <p>Provide issuing organization, validity period, and documentation.</p>
            `,
              complete: false,
            },
          ],
        },
      ],
    },
    {
      tab: 'Section B',
      title: 'Environmental Farm Plan Questionnaire',
      items: this.getSectionBItemsFromStore(),
    },
    {
      tab: 'Section C',
      title: 'Declaration & Consent',
      items: [
        {
          label: 'Terms & Conditions',
          content: `
          <h3>Environmental Farm Plan Terms & Conditions</h3>
          <p>Please read the following terms and conditions carefully before proceeding with your Environmental Farm Plan submission.</p>

          <h4>1. Purpose and Scope</h4>
          <p>The Environmental Farm Plan (EFP) is a voluntary assessment tool designed to help farmers identify environmental risks and opportunities on their farm operations. By participating in this program, you acknowledge that:</p>
          <ul>
            <li>The EFP is intended for educational and planning purposes</li>
            <li>Participation is voluntary and confidential</li>
            <li>The information provided will be used to develop customized environmental recommendations</li>
          </ul>

          <h4>2. Data Collection and Privacy</h4>
          <p>Your privacy is important to us. We collect and use your information in accordance with applicable privacy laws:</p>
          <ul>
            <li>Personal and farm operation information will be kept confidential</li>
            <li>Data may be used in aggregate form for program evaluation and improvement</li>
            <li>Individual farm information will not be shared without your explicit consent</li>
            <li>You have the right to access and correct your personal information</li>
          </ul>

          <h4>3. Accuracy of Information</h4>
          <p>By submitting this Environmental Farm Plan, you certify that:</p>
          <ul>
            <li>All information provided is accurate and complete to the best of your knowledge</li>
            <li>You are authorized to provide information about the farm operation</li>
            <li>You will notify us of any significant changes to the information provided</li>
          </ul>

          <h4>4. Recommendations and Implementation</h4>
          <p>Please understand that:</p>
          <ul>
            <li>Environmental recommendations are suggestions based on the information provided</li>
            <li>Implementation of recommendations is at your discretion</li>
            <li>You are responsible for ensuring compliance with all applicable laws and regulations</li>
            <li>The EFP does not guarantee regulatory compliance or environmental outcomes</li>
          </ul>

          <h4>5. Limitation of Liability</h4>
          <p>The Environmental Farm Plan program and its administrators:</p>
          <ul>
            <li>Provide information and recommendations in good faith</li>
            <li>Are not liable for any damages resulting from the use or implementation of recommendations</li>
            <li>Do not warrant the accuracy or completeness of third-party information</li>
          </ul>
        `,
          complete: false,
        },
        {
          label: 'Agreement & Consent',
          content: `
          <h3>Declaration of Agreement</h3>
          <p>By checking the box below, you acknowledge that you have read, understood, and agree to the terms and conditions outlined in this Environmental Farm Plan program.</p>

          <div style="background-color: var(--sl-color-neutral-50); padding: 1.5rem; border-radius: var(--sl-border-radius-medium); border: 1px solid var(--sl-color-neutral-200); margin: 1.5rem 0;">
            <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; font-family: var(--body-font); font-size: 1rem; line-height: 1.5;">
              <input
                type="checkbox"
                id="terms-agreement"
                name="terms-agreement"
                style="margin-top: 0.25rem; transform: scale(1.2);"
                required
              />
              <span>
                <strong>I agree to the terms and conditions</strong> of the Environmental Farm Plan program as outlined above.
                I understand that my participation is voluntary and that the information I provide will be used to develop
                environmental recommendations for my farm operation. I certify that the information I have provided is
                accurate and complete to the best of my knowledge.
              </span>
            </label>
          </div>

          <p style="font-size: 0.9rem; color: var(--sl-color-neutral-600); font-style: italic;">
            <strong>Note:</strong> You must agree to these terms and conditions to proceed with your Environmental Farm Plan submission.
            If you have any questions about these terms, please contact the program administrator before proceeding.
          </p>

          <div style="margin-top: 2rem; padding: 1rem; background-color: var(--sl-color-primary-50); border-radius: var(--sl-border-radius-small); border-left: 4px solid var(--sl-color-primary-600);">
            <p style="margin: 0; font-size: 0.95rem; color: var(--sl-color-primary-800);">
              <strong>Ready to submit?</strong> Once you've agreed to the terms and conditions, you can proceed to submit your Environmental Farm Plan for review and receive your customized environmental recommendations.
            </p>
          </div>
        `,
          complete: false,
        },
      ],
    },
  ];
  }

  // Rendering methods
  private renderQuestion(question: any) {
    const questionTypeMap: { [key: number]: string } = {
      100000000: 'Yes/No/NA',
      100000001: 'Point Rating',
      100000002: 'Multi-select List',
      // Add more question types as needed
    };

    const questionTypeName = questionTypeMap[question.questionType] || 'Unknown';

    return html`
      <div class="question-container">
        ${question.textAboveQuestion ? html`
          <div class="question-text">
            ${unsafeHTML(question.textAboveQuestion)}
          </div>
        ` : ''}

        <div class="question-label">
          <span>${unsafeHTML(question.label)}</span>
          ${question.tooltip ? html`
            <sl-tooltip placement="top" style="--max-width: 300px;">
              <div slot="content">${unsafeHTML(question.tooltip)}</div>
              <sl-icon
                name="question-circle"
                class="question-tooltip-icon"
                aria-label="Question help"
              ></sl-icon>
            </sl-tooltip>
          ` : ''}
        </div>

        ${question.textBelowQuestion ? html`
          <div class="question-text">
            ${unsafeHTML(question.textBelowQuestion)}
          </div>
        ` : ''}

        <div class="question-response">
          ${this.renderQuestionInput(question, questionTypeName)}
        </div>
      </div>
    `;
  }

  private renderQuestionInput(question: any, questionType: string) {
    switch (questionType) {
      case 'Multi-select List':
        // Parse the semicolon-separated options from the question
        const optionsString = question.multiselectOptions || '';
        const options = optionsString.split(';').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);

        // Get selected options - prefer pending value over saved response
        let selectedOptions: string[];
        if (this.pendingMultiselectValues.has(question.id)) {
          // Use pending value if user is actively selecting
          selectedOptions = this.pendingMultiselectValues.get(question.id)!;
        } else {
          // Otherwise get from existing response
          const existingResponse = this.getResponseForQuestion(question.id);
          const selectedOptionsString = existingResponse?.quartech_response || '';
          const existingSelectedOptions = selectedOptionsString.split(';').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);

          // Filter to only include options that are valid for the current question
          // This prevents old/invalid options from being displayed as checked
          selectedOptions = existingSelectedOptions.filter((opt: string) => options.includes(opt));
        }

        return html`
          <div class="multiselect-list-container">
            ${options.map((option: string) => {
              const isChecked = selectedOptions.includes(option);
              return html`
                <div class="multiselect-option">
                  <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem 0;">
                    <input
                      type="checkbox"
                      .checked=${isChecked}
                      @change=${(e: Event) => this.handleMultiselectChange(question.id, option, (e.target as HTMLInputElement).checked)}
                      style="transform: scale(1.2);"
                    />
                    <span>${option}</span>
                  </label>
                </div>
              `;
            })}
          </div>
        `;

      case 'Yes/No/NA':
      case 'Point Rating':
        // Get existing response value for this question
        const existingResponse2 = this.getResponseForQuestion(question.id);
        const selectedValue = existingResponse2?.quartech_response || '';

        return html`
          <rating-question
            .questionId=${question.id}
            .questionType=${questionType}
            .selectedValue=${selectedValue}
            @rating-changed=${this.handleRatingChanged}
          ></rating-question>
        `;

      default:
        return html`
          <sl-textarea
            label="Your response"
            name="question-${question.id}"
            rows="3"
            placeholder="Enter your response..."
          ></sl-textarea>
        `;
    }
  }

  private renderSubchapter(subchapter: any) {
    return html`
      ${subchapter.description ? html`
        <div class="subchapter-header">
          <div>${unsafeHTML(subchapter.description)}</div>
        </div>
      ` : ''}
      ${subchapter.questions.map((question: any) => this.renderQuestion(question))}

      ${subchapter.subchapters ? subchapter.subchapters.map((subSubchapter: any) => this.renderSubSubchapter(subSubchapter)) : ''}
    `;
  }

    private renderContainerSubchapter(subchapter: any) {
    return html`
      ${subchapter.description ? html`
        <div class="subchapter-header">
          <div>${unsafeHTML(subchapter.description)}</div>
        </div>
      ` : ''}
    `;
  }

  private renderSubSubchapter(subSubchapter: any) {
    return html`
      ${subSubchapter.description ? html`
        <div class="sub-subchapter-header">
          <div>${unsafeHTML(subSubchapter.description)}</div>
        </div>
      ` : ''}

      ${subSubchapter.questions.map((question: any) => this.renderQuestion(question))}
    `;
  }

  private renderChapter(chapter: any) {
    return html`
      ${chapter?.description ? html`
        <div class="chapter-header">
          <div>${unsafeHTML(chapter.description)}</div>
        </div>
      ` : ''}

      ${chapter?.questions ? chapter.questions.map((question: any) => this.renderQuestion(question)) : ''}

      ${chapter?.subchapters ? chapter.subchapters.map((subchapter: any) => this.renderSubchapter(subchapter)) : ''}
    `;
  }

  private renderContainerChapter(chapter: any) {
    return html`
      ${chapter?.description ? html`
        <div class="chapter-header">
          <div>${unsafeHTML(chapter.description)}</div>
        </div>
      ` : ''}
    `;
  }



  private renderMainContent() {
    return EFPRenderUtils.renderMainContent(
      this.currentSectionIndex,
      this.flatSteps,
      this.currentStepIndex,
      this.activeContent,
      html,
      unsafeHTML,
      (subchapterData: any) => this.renderSubchapter(subchapterData),
      (chapterData: any) => this.renderChapter(chapterData),
      (subchapterData: any) => this.renderContainerSubchapter(subchapterData),
      (chapterData: any) => this.renderContainerChapter(chapterData)
    );
  }



  // Generate Section B items directly from questionnaire store
  private getSectionBItemsFromStore(): EFPSectionItem[] {
    const questionnaire: any = getQuestionnaireFromStore();

    // If questionnaire store is not loaded, show loading state
    if (!questionnaire?.chapters?.length) {
      logger.info({ message: '📋 Questionnaire store not loaded, showing loading state' });
      return [
        {
          label: 'Loading Environmental Farm Plan...',
          content: `
            <h3>Loading Environmental Farm Plan Questionnaire</h3>
            <p>Please wait while we load the questionnaire chapters and questions from the store...</p>
            <p><em>The questionnaire store is being initialized...</em></p>
          `,
          complete: false,
        }
      ];
    }



    const chapters = questionnaire.chapters[0] || [];
    const items: EFPSectionItem[] = [];

    chapters.forEach((chapter: any) => {


      // Create the main chapter container (collapsible parent)
      const chapterItem: EFPSectionItem = {
        label: EFPTextUtils.formatChapterTitle(chapter),
        title: EFPTextUtils.formatChapterTitle(chapter),
        content: EFPSectionGenerator.renderChapterContainerContent(chapter), // We now want to display the description for containers
        complete: chapter.complete || false, // Use completion from store
        isContainer: true,
        chapterId: chapter.id, // Store chapter ID for completion lookup
        items: []
      };

      // Add all subchapters as direct clickable items under the main chapter
      if (chapter.subchapters && chapter.subchapters.length > 0) {
        chapter.subchapters.forEach((subchapter: any) => {
          // Add the subchapter as a clickable item
          const formattedSubchapterTitle = EFPTextUtils.formatChapterTitle(subchapter);
          const subchapterItem: EFPSectionItem = {
            label: formattedSubchapterTitle,
            content: EFPSectionGenerator.renderSubchapterContent(subchapter),
            complete: subchapter.complete || false, // Use completion from store
            chapterId: subchapter.id, // Store chapter ID for completion lookup
            subchapterData: subchapter, // Keep for backward compatibility
          };

          // If subchapter has sub-subchapters, add them as nested items
          if (subchapter.subchapters && subchapter.subchapters.length > 0) {
            subchapterItem.items = subchapter.subchapters.map((subSubchapter: any) => {
              // Format sub-subchapter title
              const formattedSubSubTitle = EFPTextUtils.formatChapterTitle(subSubchapter);

              return {
                label: formattedSubSubTitle,
                content: EFPSectionGenerator.renderSubchapterContent(subSubchapter),
                complete: subSubchapter.complete || false, // Use completion from store
                chapterId: subSubchapter.id, // Store chapter ID for completion lookup
                subchapterData: subSubchapter, // Keep for backward compatibility
              };
            });

            // Add title property for sl-details rendering
            subchapterItem.title = subchapterItem.label;
          }

          // Always add the subchapter to the main chapter items
          chapterItem.items!.push(subchapterItem);
        });
      } else {
        // If no subchapters, add the main chapter itself as a clickable item
        const formattedTitle = EFPTextUtils.formatChapterTitle(chapter);
        chapterItem.items!.push({
          label: formattedTitle,
          content: EFPSectionGenerator.renderChapterContent(chapter),
          complete: chapter.complete || false, // Use completion from store
          chapterId: chapter.id, // Store chapter ID for completion lookup
          chapterData: chapter // Keep for backward compatibility
        });
      }

      items.push(chapterItem);
    });


    return items;
  }

  // Get completion status from questionnaire store for navigation items
  private getCompletionFromStore(item: any): boolean {


    if (!isQuestionnaireLoaded()) {
      // Fallback to item's current complete status

      return item.complete || false;
    }

    try {
      // Check if this is a chapter item (new chapterId property from store)
      if (item.chapterId) {
        const chapter = getChapterFromStore(item.chapterId);
        const storeComplete = chapter?.complete || false;

        return storeComplete;
      }

      // Check if this is a question item
      if (item.questionId) {
        const question = getQuestionFromStore(item.questionId);
        const storeComplete = question?.complete || false;

        return storeComplete;
      }

      // For nested items (containers), check children completion
      if ('items' in item && Array.isArray(item.items)) {
        // All child items must be complete for parent to be complete
        const childrenComplete = item.items.every((child: any) => this.getCompletionFromStore(child));

        return childrenComplete;
      }

      // Fallback to item's current status

      return item.complete || false;

    } catch (error) {
      logger.warn({ message: `Failed to get completion from questionnaire store: ${String(error)}` });
      return item.complete || false;
    }
  }

  // Get section completion status from questionnaire store
  private getSectionCompletionFromStore(section: any): boolean {
    // For Section B, use questionnaire store completion
    if (section.tab === 'Section B' && isQuestionnaireLoaded()) {
      try {
        // Import questionnaire stats dynamically to avoid circular imports
        const questionnaire = getQuestionnaireFromStore();
        if (questionnaire) {
          // Calculate completion based on questionnaire store data
          let totalQuestions = 0;
          let answeredQuestions = 0;

          const countInChapters = (chapters: any[]) => {
            chapters.forEach((chapter: any) => {
              if (chapter.questions) {
                totalQuestions += chapter.questions.length;
                answeredQuestions += chapter.questions.filter((q: any) => q.complete).length;
              }
              if (chapter.subchapters) {
                countInChapters(chapter.subchapters);
              }
            });
          };

          if (questionnaire.chapters && questionnaire.chapters.length > 0) {
            countInChapters(questionnaire.chapters[0]);
          }

          // Section is complete if all questions are answered
          return totalQuestions > 0 && answeredQuestions === totalQuestions;
        }
      } catch (error) {
        logger.warn({ message: `Failed to get section completion from questionnaire store: ${String(error)}` });
      }
    }

    // Fallback to existing logic
    return EFPCompletionUtils.isSectionComplete(section);
  }

  // Public API methods
  public updateNestedChapterStructure(nestedStructure: any[]) {
    logger.info({ message: `updateNestedChapterStructure called with ${nestedStructure?.length || 0} chapters` });

    this.nestedChapterStructure = nestedStructure;

    // Also update the questionnaire store if not already loaded
    if (!isQuestionnaireLoaded()) {
      logger.info({ message: 'Loading questionnaire data into store from updateNestedChapterStructure' });
      // Import the loadQuestionnaireIntoStore function dynamically to avoid circular imports
      import('../common/questionnaire.js').then(({ loadQuestionnaireIntoStore }) => {
        loadQuestionnaireIntoStore(nestedStructure);
      });
    }

    // The @property decorator will automatically trigger a re-render
    // But we can force it to be sure
    this.requestUpdate();
  }

  // Computed properties
  private get completionPercent(): number {
    // Use questionnaire store completion if available (preferred method)
    if (isQuestionnaireLoaded()) {
      try {
        // Get stats synchronously from questionnaire store
        const questionnaire = getQuestionnaireFromStore();
        if (questionnaire) {
          // Calculate completion percentage from questionnaire store
          let totalQuestions = 0;
          let answeredQuestions = 0;

          const countInChapters = (chapters: any[]) => {
            chapters.forEach((chapter: any) => {
              if (chapter.questions) {
                totalQuestions += chapter.questions.length;
                answeredQuestions += chapter.questions.filter((q: any) => q.complete).length;
              }
              if (chapter.subchapters) {
                countInChapters(chapter.subchapters);
              }
            });
          };

          if (questionnaire.chapters && questionnaire.chapters.length > 0) {
            countInChapters(questionnaire.chapters[0]);
          }

          return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
        }
      } catch (error) {
        logger.warn({ message: 'Failed to get completion from questionnaire store, falling back' });
      }
    }

    // Use workbook responses completion if available, otherwise fall back to static completion
    if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      return POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage;
    }
    return EFPCompletionUtils.calculateOverallCompletion(this.sections);
  }

  // Navigation methods
  private goToNext() {
    logger.info({ message: `goToNext called, current step: ${this.currentStepIndex}, ${this.flatSteps[this.currentStepIndex]?.label}` });

    // Handle case where currentStepIndex is -1 (step not found in flatSteps)
    if (this.currentStepIndex === -1) {
      logger.warn({ message: 'currentStepIndex is -1, trying to find current step by activeContent title' });
      const foundIndex = this.flatSteps.findIndex(step => step.label === this.activeContent.title);
      if (foundIndex !== -1) {
        logger.info({ message: `Found current step "${this.activeContent.title}" at index ${foundIndex}` });
        this.currentStepIndex = foundIndex;
      } else {
        logger.error({ message: `Could not find current step "${this.activeContent.title}" in flatSteps` });
        return; // Don't proceed with navigation if we can't find current position
      }
    }

    const nextIndex = EFPNavigationUtils.findNextSelectableStep(this.currentStepIndex, this.flatSteps, this.sections);
    if (nextIndex != null) {
      const nextStep = this.flatSteps[nextIndex];
      this.isNavigating = true;
      this.currentStepIndex = nextIndex;
      this.currentSectionIndex = nextStep.sectionIndex;
      this.activeContent = { title: nextStep.label, content: nextStep.content };
      this.updateNavigationState(nextStep.label);
      setTimeout(() => { this.isNavigating = false; }, 100);
      this.requestUpdate();
    }
  }



  // Navigation event handlers
  private handleNavigationPrevious() {
    this.goToPrevious();
  }

  private handleNavigationSkip(event: CustomEvent) {
    this.currentSectionIndex = event.detail.sectionIndex;
  }

  private handleNavigationContinue() {
    this.goToNext();
  }

  // Section navigation event handler
  private handleSectionChange(newSectionIndex: number) {
    EFPEventUtils.handleSectionChange(
      newSectionIndex,
      this.isNavigating,
      this.flatSteps,
      (stepIndex: number, sectionIndex: number) => {
        this.currentStepIndex = stepIndex;
        this.currentSectionIndex = sectionIndex;

        // Update the active content
        const step = this.flatSteps[stepIndex];
        if (step) {
          this.activeContent = {
            title: step.label,
            content: step.content,
          };
        }

        // Force a re-render
        this.requestUpdate();
      },
      (label: string) => this.updateNavigationState(label)
    );
  }

  // Question interaction event handler
  private handleRatingChanged(event: CustomEvent) {

    const { questionId, value } = event.detail;

    try {

      logger.info({ message: `Rating changed for question ${questionId}: ${value}` });

      // Store the pending value
      this.pendingResponseValues.set(questionId, String(value));

      // Clear any existing debounce timer for this question
      const existingTimer = this.responseSaveDebounceTimers.get(questionId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set a new debounce timer (1500ms delay)
      const timer = window.setTimeout(() => {
        this.saveDebouncedResponse(questionId);
      }, 1500);

      this.responseSaveDebounceTimers.set(questionId, timer);

      // Also call the original handler for any additional processing
      EFPEventUtils.handleRatingChanged(
        event,
        (questionId: string, value: any) => {
          logger.info({ message: `Rating stored in memory for question ${questionId}: ${value}` });
        }
      );

    } catch (error) {

      logger.error({ message: `Failed to save rating response: ${(error as Error).message}` });

      // Still call the original handler even if save fails
      EFPEventUtils.handleRatingChanged(
        event,
        (questionId: string, value: any) => {
          logger.info({ message: `Rating stored locally for question ${questionId}: ${value} (save failed)` });
        }
      );
    }
  }

  // Multi-select list interaction event handler
  private handleMultiselectChange(questionId: string, option: string, isChecked: boolean) {
    try {
      logger.info({ message: `Multi-select option changed for question ${questionId}: ${option} = ${isChecked}` });

      // Get the valid options for this question
      const question = getQuestionFromStore(questionId);
      const optionsString = question?.multiselectOptions || '';
      const validOptions = optionsString.split(';').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);

      // Get current pending value or existing response
      let selectedOptions: string[];
      if (this.pendingMultiselectValues.has(questionId)) {
        // Use pending value if it exists
        selectedOptions = this.pendingMultiselectValues.get(questionId)!;
      } else {
        // Start with an empty array and only add valid options from existing response
        const existingResponse = this.getResponseForQuestion(questionId);
        const currentSelectedString = existingResponse?.quartech_response || '';
        const existingSelectedOptions = currentSelectedString.split(';').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);

        // Filter to only include options that are valid for the current question
        selectedOptions = existingSelectedOptions.filter((opt: string) => validOptions.includes(opt));

        logger.info({
          message: `Filtered existing response for question ${questionId}`,
          data: {
            existingOptions: existingSelectedOptions,
            validOptions: validOptions,
            filteredOptions: selectedOptions
          }
        });
      }

      // Update the selected options based on checkbox state
      if (isChecked) {
        // Add option if not already present
        if (!selectedOptions.includes(option)) {
          selectedOptions.push(option);
        }
      } else {
        // Remove option
        selectedOptions = selectedOptions.filter((opt: string) => opt !== option);
      }

      // Store the pending value
      this.pendingMultiselectValues.set(questionId, selectedOptions);

      // Clear any existing debounce timer for this question
      const existingTimer = this.responseSaveDebounceTimers.get(questionId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set a new debounce timer (2000ms delay)
      const timer = window.setTimeout(() => {
        this.saveMultiselectResponse(questionId);
      }, 2000);

      this.responseSaveDebounceTimers.set(questionId, timer);

    } catch (error) {
      logger.error({ message: `Failed to handle multi-select change: ${(error as Error).message}` });
    }
  }

  // Save the debounced response (for rating questions and other text-based responses)
  private async saveDebouncedResponse(questionId: string) {
    try {
      const responseValue = this.pendingResponseValues.get(questionId);
      if (responseValue === undefined) {
        logger.warn({ message: `No pending value found for question ${questionId}` });
        return;
      }

      logger.info({ message: `Saving debounced response for question ${questionId}: ${responseValue}` });

      // Save the response
      const responseData = await this.saveRatingResponse(questionId, responseValue);

      // Update the questionnaire store with the full response data
      updateQuestionResponse(questionId, responseValue, true, responseData);

      logger.info({ message: `Successfully saved debounced response for question ${questionId}` });

      // Clean up
      this.pendingResponseValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);

    } catch (error) {
      logger.error({ message: `Failed to save debounced response: ${(error as Error).message}` });
      // Don't delete pending value on error, so user can retry
    }
  }

  // Save the debounced multi-select response
  private async saveMultiselectResponse(questionId: string) {
    try {
      const selectedOptions = this.pendingMultiselectValues.get(questionId);
      if (!selectedOptions) {
        logger.warn({ message: `No pending value found for question ${questionId}` });
        return;
      }

      // Create semicolon-delimited string
      const newValue = selectedOptions.join(';');

      logger.info({ message: `Saving multi-select value for question ${questionId}: ${newValue}` });

      // Save the response
      const responseData = await this.saveRatingResponse(questionId, newValue);

      // Update the questionnaire store with the full response data
      updateQuestionResponse(questionId, newValue, true, responseData);

      logger.info({ message: `Successfully saved multi-select response for question ${questionId}` });

      // Clean up
      this.pendingMultiselectValues.delete(questionId);
      this.responseSaveDebounceTimers.delete(questionId);

    } catch (error) {
      logger.error({ message: `Failed to save multi-select response: ${(error as Error).message}` });
      // Don't delete pending value on error, so user can retry
    }
  }

  // Helper method to save rating responses
  private async saveRatingResponse(questionId: string, ratingValue: any): Promise<any> {

    try {
      const responseText = String(ratingValue);
      const notes = `Rating: ${ratingValue}`;



      // Check if response already exists
      const existingResponse = this.getResponseForQuestion(questionId);


      let responseData;
      let isNewResponse = false;

      // Only update if we have an existing response WITH a valid ID
      if (existingResponse && existingResponse.quartech_workbookresponseid) {
        // Update existing response

        await WorkbookResponseHelper.updateResponse(
          existingResponse.quartech_workbookresponseid,
          responseText,
          { notes }
        );

        // Create updated response data
        responseData = {
          ...existingResponse,
          quartech_response: responseText,
          quartech_notes: notes,
          modifiedon: new Date().toISOString()
        };



      } else {
        // Create new response (either no response exists, or existing response lacks valid ID)
        isNewResponse = true;

        const createResult = await WorkbookResponseHelper.createResponse(questionId, responseText, { notes }) as any;

        const workbookId = getWorkbookId();

        // Create new response data with all fields from the API response
        responseData = {
          ...createResult.response,
          quartech_workbookresponseid: createResult.response?.quartech_workbookresponseid,
          quartech_response: responseText,
          quartech_notes: notes,
          _quartech_question_value: questionId,
          _quartech_workbook_value: workbookId,
          createdon: createResult.response?.createdon || new Date().toISOString(),
          modifiedon: createResult.response?.modifiedon || new Date().toISOString()
        };

        // CRITICAL: Update memory structures IMMEDIATELY after creation
        // This ensures subsequent rapid saves will find the response and update instead of creating duplicates
        this.updateMemoryStructuresForRating(questionId, responseData, true);
      }

      // Update memory structures for updates (for creates, already done above)
      if (!isNewResponse) {
        this.updateMemoryStructuresForRating(questionId, responseData, false);
      }

      // Update completion and navigation icons
      this.updateCompletionAndNavigation();

      // Trigger re-render (already called by updateCompletionAndNavigation, but keeping for clarity)
      this.requestUpdate();

      // Return the response data for use in questionnaire store
      return responseData;

    } catch (error) {
      logger.error({ message: `Failed to save rating response: ${String(error)}` });
      throw error;
    }
  }

  // Update memory structures for rating responses
  private async updateMemoryStructuresForRating(questionId: string, responseData: any, isNewResponse: boolean) {
    try {
      // Update new nested structure using helper function
      WorkbookResponseHelper.updateResponseInMemory(questionId, responseData);

      // Update old structure for backward compatibility
      POWERPOD.workbookResponses.responsesByQuestion.set(questionId, responseData);

      if (isNewResponse) {
        // Add to beginning of data array (most recent first)
        POWERPOD.workbookResponses.data.unshift(responseData);
      } else {
        // Update existing entry in data array
        const dataIndex = POWERPOD.workbookResponses.data.findIndex(
          (r: any) => r.quartech_workbookresponseid === responseData.quartech_workbookresponseid
        );
        if (dataIndex !== -1) {
          POWERPOD.workbookResponses.data[dataIndex] = responseData;
        }
      }

      // Update memory metadata for both structures
      POWERPOD.workbookResponses.lastUpdated = new Date().toISOString();
      POWERPOD.workbookQuestionsAndResponses.lastUpdated = new Date().toISOString();



    } catch (error) {
      logger.error({ message: `Failed to update memory structures for rating: ${String(error)}` });
      // Don't throw - this is a memory update issue, not a save issue
    }
  }

  // Navigation item click event handler
  private handleItemClick(item: EFPSectionItem) {
    EFPEventUtils.handleItemClick(
      item,
      this.flatSteps,
      (stepIndex: number, sectionIndex: number) => {
        this.currentStepIndex = stepIndex;
        this.currentSectionIndex = sectionIndex;
      },
      (label: string) => this.updateNavigationState(label)
    );
  }

  // Utility methods
  private updateNavigationState(currentLabel: string) {
    // Find all sl-details elements in the navigation
    const allDetails = this.shadowRoot?.querySelectorAll('sl-details');
    if (!allDetails) return;

    // First, close all details
    allDetails.forEach(detail => {
      detail.open = false;
    });

    // Find which containers should be open based on the current item
    const containersToOpen = EFPNavigationUtils.findContainersForItem(currentLabel, this.sections);

    // Open the relevant containers
    allDetails.forEach(detail => {
      // Check data attribute first (most reliable), then fallback to other methods
      const containerTitle = detail.getAttribute('data-container-title');
      const summary = detail.getAttribute('summary');
      const customSummarySpan = detail.querySelector('[slot="summary"] span');
      const summaryText = containerTitle || summary || (customSummarySpan ? customSummarySpan.textContent : null);

      if (summaryText && containersToOpen.includes(summaryText)) {
        detail.open = true;
      }
    });
  }

  private goToPrevious() {
    logger.info({ message: `goToPrevious called, current step: ${this.currentStepIndex}, ${this.flatSteps[this.currentStepIndex]?.label}` });

    // Handle case where currentStepIndex is -1 (step not found in flatSteps)
    if (this.currentStepIndex === -1) {
      logger.warn({ message: 'currentStepIndex is -1, trying to find current step by activeContent title' });
      const foundIndex = this.flatSteps.findIndex(step => step.label === this.activeContent.title);
      if (foundIndex !== -1) {
        logger.info({ message: `Found current step "${this.activeContent.title}" at index ${foundIndex}` });
        this.currentStepIndex = foundIndex;
      } else {
        logger.error({ message: `Could not find current step "${this.activeContent.title}" in flatSteps` });
        return; // Don't proceed with navigation if we can't find current position
      }
    }

    const prevIndex = EFPNavigationUtils.findPreviousSelectableStep(this.currentStepIndex, this.flatSteps, this.sections);
    if (prevIndex != null) {
      const prevStep = this.flatSteps[prevIndex];
      this.isNavigating = true;
      this.currentStepIndex = prevIndex;
      this.currentSectionIndex = prevStep.sectionIndex;
      this.activeContent = { title: prevStep.label, content: prevStep.content };
      this.updateNavigationState(prevStep.label);
      setTimeout(() => { this.isNavigating = false; }, 100);
      this.requestUpdate();
    }
  }

  private get flatSteps(): EFPStep[] {
    return EFPNavigationUtils.getFlatStepsFromSections(this.sections);
  }


  private initializeToFirstSelectableStep() {
    // Only initialize if we have sections and steps available
    if (!this.sections || this.sections.length === 0 || !this.flatSteps || this.flatSteps.length === 0) {

      return;
    }

    // Navigate to first selectable step in the first section via utils
    const target = EFPNavigationUtils.navigateToSection(0, this.flatSteps, this.sections);
    if (target) {
      const step = this.flatSteps[target.stepIndex];
      this.currentStepIndex = target.stepIndex;
      this.currentSectionIndex = target.sectionIndex;
      this.activeContent = { title: step.label, content: step.content };
      this.updateNavigationState(step.label);
    }
  }



  private handleBreadcrumbNavigation(event: CustomEvent) {
    const { type, data } = event.detail;

    switch (type) {
      case 'home':
        this.navigateToHome();
        break;
      case 'section':
        this.navigateToSection(data.sectionIndex);
        break;
      case 'hierarchy':
        this.navigateToHierarchyItem(data.targetLabel);
        break;
    }
  }

  private navigateToHome() {
    // Navigate to first selectable step in first section
    const target = EFPNavigationUtils.navigateToSection(0, this.flatSteps, this.sections);
    if (target) {
      const step = this.flatSteps[target.stepIndex];
      this.currentStepIndex = target.stepIndex;
      this.currentSectionIndex = target.sectionIndex;
      this.activeContent = { title: step.label, content: step.content };
      this.updateNavigationState(step.label);
      this.requestUpdate();
    } else {
      // Fallback to first step
      this.currentStepIndex = 0;
      this.currentSectionIndex = 0;
      this.requestUpdate();
    }
  }

  private navigateToSection(sectionIndex: number) {
    const target = EFPNavigationUtils.navigateToSection(sectionIndex, this.flatSteps, this.sections);
    if (target) {
      const step = this.flatSteps[target.stepIndex];
      this.currentStepIndex = target.stepIndex;
      this.currentSectionIndex = target.sectionIndex;
      this.activeContent = { title: step.label, content: step.content };
      this.updateNavigationState(step.label);
      this.requestUpdate();
    }
  }

  private navigateToHierarchyItem(targetLabel: string) {
    // Find and navigate to this hierarchy level
    const hierarchyStepIndex = this.flatSteps.findIndex(step => step.label === targetLabel);
    if (hierarchyStepIndex !== -1) {
      const hierarchyStep = this.flatSteps[hierarchyStepIndex];
      this.currentStepIndex = hierarchyStepIndex;
      this.currentSectionIndex = hierarchyStep.sectionIndex;

      // Update active content
      this.activeContent = {
        title: hierarchyStep.label,
        content: hierarchyStep.content,
      };

      // Update navigation state
      this.updateNavigationState(hierarchyStep.label);
      this.requestUpdate();
    }
  }

  private renderItems(items: EFPSectionItem[]): unknown {
    return EFPRenderUtils.renderItems(
      items,
      html,
      this.activeContent.title,
      (item: EFPSectionItem) => this.handleItemClick(item),
      (items: EFPSectionItem[]) => this.renderItems(items),
      (item: EFPSectionItem) => this.getCompletionFromStore(item)
    );
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('currentStepIndex')) {
      EFPLifecycleUtils.handleStepIndexChange(
        this.currentStepIndex,
        this.flatSteps,
        this.activeContent,
        (newContent: EFPActiveContent) => {
          this.activeContent = newContent;
        },
        (label: string) => this.updateNavigationState(label)
      );
    }

    if (changedProps.has('currentSectionIndex')) {
      EFPLifecycleUtils.handleSectionIndexChange(
        this.currentSectionIndex,
        this.tabGroupEl
      );
    }

    // Re-render rating questions when workbook responses are loaded/updated
    if (changedProps.has('workbookResponses')) {

      // Update completion and navigation icons when responses change
      this.updateCompletionAndNavigation();
    }

    // Update active content when questions and responses are loaded
    if (changedProps.has('questionsAndResponsesLoaded')) {
      // Refresh the active content to show updated renderResponsesSummary
      const currentStep = this.flatSteps[this.currentStepIndex];
      if (currentStep) {
        this.activeContent = { title: currentStep.label, content: currentStep.content };
      }
    }
  }

  // Lifecycle methods
  firstUpdated() {
    // Initialize to the first selectable step instead of potentially a section header
    this.initializeToFirstSelectableStep();

    // Load workbook responses
    this.loadWorkbookResponses();
  }

  willUpdate(changedProps: Map<string, unknown>) {
    if (changedProps.has('currentStepIndex')) {
      EFPLifecycleUtils.handleStepIndexChange(
        this.currentStepIndex,
        this.flatSteps,
        this.activeContent,
        (newContent: EFPActiveContent) => {
          this.activeContent = newContent;
        }
      );
    }
  }

  // Workbook response loading
  private async loadWorkbookResponses() {
    try {
      this.isLoadingResponses = true;
      POWERPOD.workbookQuestionsAndResponses.isLoading = true;
      POWERPOD.workbookQuestionsAndResponses.error = null;

      const workbookId = getWorkbookId();
      if (!workbookId) {
        logger.warn({ message: 'No workbook ID found, skipping response loading' });
        return;
      }

      // Check if we already have questions and responses for this workbook
      if (POWERPOD.workbookQuestionsAndResponses.isLoaded &&
          POWERPOD.workbookQuestionsAndResponses.workbookId === workbookId) {

        this.syncFromPOWERPOD();
        this.questionsAndResponsesLoaded = true;
        return;
      }

      logger.info({ message: `Loading workbook questions and responses for workbook: ${workbookId}` });

      // Load questions and responses into nested structure
      const result = await WorkbookResponseHelper.loadQuestionsAndResponses(workbookId) as QuestionsAndResponsesMemory;

      // Also maintain backward compatibility with old structure
      const responses = Array.from(result.questionsWithResponses.values())
        .map(entry => entry.response)
        .filter(response => response !== null);

      POWERPOD.workbookResponses.data = responses;
      POWERPOD.workbookResponses.workbookId = workbookId;
      POWERPOD.workbookResponses.isLoaded = true;
      POWERPOD.workbookResponses.lastUpdated = new Date().toISOString();

      // Build quick lookup map for backward compatibility
      POWERPOD.workbookResponses.responsesByQuestion.clear();
      responses.forEach(response => {
        const questionId = response._quartech_question_value;
        if (questionId) {
          if (!POWERPOD.workbookResponses.responsesByQuestion.has(questionId)) {
            POWERPOD.workbookResponses.responsesByQuestion.set(questionId, response);
          }
        }
      });

      // Sync to local component state for UI binding
      this.syncFromPOWERPOD();

      // Update the reactive property to trigger re-render
      this.questionsAndResponsesLoaded = true;

      logger.info({ message: `Loaded ${result.stats.totalQuestions} questions with ${result.stats.answeredQuestions} responses (${result.stats.completionPercentage}% complete)` });




      // Trigger a re-render to update the UI with loaded data
      this.requestUpdate();

    } catch (error) {
      logger.error({ message: 'Failed to load workbook questions and responses' });
      const errMsg = (error as any)?.message || 'Failed to load questions and responses';
      POWERPOD.workbookQuestionsAndResponses.error = errMsg;
      // Don't throw - we want the component to still work even if loading fails
    } finally {
      this.isLoadingResponses = false;
      POWERPOD.workbookQuestionsAndResponses.isLoading = false;
    }
  }

  // Sync local component state from POWERPOD memory
  private syncFromPOWERPOD() {
    this.workbookResponses = POWERPOD.workbookResponses.data;

    // Update completion and navigation icons
    this.updateCompletionAndNavigation();
  }

  // Update completion tracking and navigation icons based on current responses
  private updateCompletionAndNavigation() {


    // Update section completion status based on workbook responses
    this.updateSectionCompletionStatus();

    // Trigger re-render to update progress bar and navigation icons
    this.requestUpdate();

    // Log current completion status
    const completionPercent = this.completionPercent;
    logger.info({ message: `📊 Overall completion: ${completionPercent}%` });

    if (POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      const stats = POWERPOD.workbookQuestionsAndResponses.stats;

    }
  }

  // Update section completion status using questionnaire store
  private updateSectionCompletionStatus() {
    // Try to use questionnaire store first (preferred method)
    if (isQuestionnaireLoaded()) {

      try {
        // Import the completion function dynamically to avoid circular imports
        import('../common/questionnaire.js').then(({ updateQuestionnaireCompletion }) => {
          updateQuestionnaireCompletion();
          this.updateSectionItemsFromQuestionnaireStore();
          logger.info({ message: '✅ Updated completion using questionnaire store' });
        });
        return;
      } catch (error) {
        logger.warn({ message: '⚠️ Failed to use questionnaire store for completion, falling back to legacy method' });
      }
    }

    // Fallback to legacy method if questionnaire store is not available
    if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      logger.warn({ message: '⚠️ Neither questionnaire store nor workbook responses loaded, skipping completion update' });
      return;
    }


    const questionsWithResponses = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses;
    const questionsByChapter = POWERPOD.workbookQuestionsAndResponses.questionsByChapter;



    // Update section completion based on chapter completion
    this.sections.forEach(section => {
      this.updateSectionItemsCompletion(section.items, questionsWithResponses);
    });
  }

  // Update section items using questionnaire store data
  private updateSectionItemsFromQuestionnaireStore() {


    this.sections.forEach(section => {
      if (section.tab === 'Section B') {
        // Update Section B items using questionnaire store
        this.updateSectionItemsFromStore(section.items);
      }
    });
  }

  // Recursively update section items using questionnaire store
  private updateSectionItemsFromStore(items: any[]) {
    items.forEach(item => {
      if ('items' in item && Array.isArray(item.items)) {
        // Recursively update nested items
        this.updateSectionItemsFromStore(item.items);

        // Update parent completion based on children
        const allChildrenComplete = item.items.every((child: any) => {
          if ('items' in child && Array.isArray(child.items)) {
            return child.complete;
          } else if (child.questionId) {
            // Import questionnaire functions dynamically
            import('../common/questionnaire.js').then(({ getQuestionFromStore }) => {
              const question = getQuestionFromStore(child.questionId);
              child.complete = question?.complete || false;
            });
            return child.complete;
          }
          return child.complete;
        });

        item.complete = allChildrenComplete;

      } else if (item.chapterId) {
        // This is a chapter item - get completion from questionnaire store
        import('../common/questionnaire.js').then(({ getChapterFromStore }) => {
          const chapter = getChapterFromStore(item.chapterId);
          if (chapter) {
            item.complete = chapter.complete;
          }
        });
      } else if (item.questionId) {
        // This is a question item - get completion from questionnaire store
        import('../common/questionnaire.js').then(({ getQuestionFromStore }) => {
          const question = getQuestionFromStore(item.questionId);
          if (question) {
            item.complete = question.complete;
          }
        });
      }
    });
  }

  // Recursively update completion status for section items (legacy method)
  private updateSectionItemsCompletion(items: any[], questionsWithResponses: Map<string, any>) {
    items.forEach(item => {
      if ('items' in item && Array.isArray(item.items)) {
        // Recursively update nested items
        this.updateSectionItemsCompletion(item.items, questionsWithResponses);

        // Update parent item completion based on children
        const childItems = this.getAllLeafItems(item.items);
        const completedChildren = childItems.filter(child => child.complete).length;
        item.complete = completedChildren === childItems.length && childItems.length > 0;



      } else if (item.questionId) {
        // This is a question item - check if it has a response
        const questionResponse = questionsWithResponses.get(item.questionId);
        const wasComplete = item.complete;
        item.complete = questionResponse && questionResponse.response !== null;

        if (wasComplete !== item.complete) {

        }
      }
    });
  }

  // Helper method to get all leaf items from a nested structure
  private getAllLeafItems(items: any[]): any[] {
    const leafItems: any[] = [];

    const collect = (itemList: any[]) => {
      for (const item of itemList) {
        if ('items' in item && Array.isArray(item.items)) {
          collect(item.items);
        } else {
          leafItems.push(item);
        }
      }
    };

    collect(items);
    return leafItems;
  }

  // Helper method to get response for a specific question
  getResponseForQuestion(questionId: string): any | null {
    // Use new nested structure first, fall back to old structure
    const questionAndResponse = WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    if (questionAndResponse) {
      return questionAndResponse.response;
    }

    // Fallback to old structure for backward compatibility
    return POWERPOD.workbookResponses.responsesByQuestion.get(questionId) || null;
  }

  // Helper method to get question data for a specific question
  getQuestionForQuestion(questionId: string): any | null {
    const questionAndResponse = WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    return questionAndResponse?.question || null;
  }

  // Helper method to get both question and response data
  getQuestionAndResponse(questionId: string): { question: any | null, response: any | null } {
    const questionAndResponse = WorkbookResponseHelper.getQuestionAndResponseFromMemory(questionId);
    if (questionAndResponse) {
      return {
        question: questionAndResponse.question,
        response: questionAndResponse.response
      };
    }

    // Fallback to old structure
    return {
      question: null,
      response: this.getResponseForQuestion(questionId)
    };
  }

  // Helper method to render response information for a question
  renderResponseInfo(questionId: string): string {
    const response = this.getResponseForQuestion(questionId);
    if (!response) {
      return '<p style="color: var(--sl-color-neutral-600); font-style: italic;"><em>No response yet.</em></p>';
    }

    const createdDate = new Date(response.createdon).toLocaleDateString();
    const modifiedDate = new Date(response.modifiedon).toLocaleDateString();

    return `
      <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--sl-color-success-50); border-radius: var(--sl-border-radius-medium); border-left: 4px solid var(--sl-color-success-600);">
        <h4 style="margin: 0 0 0.75rem 0; color: var(--sl-color-success-800); font-size: 1.1rem;">Your Previous Response</h4>
        <div style="background-color: white; padding: 0.75rem; border-radius: var(--sl-border-radius-small); margin-bottom: 0.75rem;">
          <p style="margin: 0; line-height: 1.5; color: var(--sl-color-neutral-800);">${response.quartech_response || 'No response text available.'}</p>
        </div>
        <div style="font-size: 0.875rem; color: var(--sl-color-neutral-600);">
          <p style="margin: 0;"><strong>Created:</strong> ${createdDate}</p>
          ${createdDate !== modifiedDate ? `<p style="margin: 0;"><strong>Last Modified:</strong> ${modifiedDate}</p>` : ''}
        </div>
      </div>
    `;
  }

  // Helper method to render all responses summary (for debugging/admin)
  renderResponsesSummary(): string {
    const questionsAndResponses = POWERPOD.workbookQuestionsAndResponses;

    if (!questionsAndResponses.isLoaded) {
      return '<p><em>Questions and responses not loaded yet.</em></p>';
    }

    const stats = questionsAndResponses.stats;
    if (stats.totalQuestions === 0) {
      return '<p><em>No questions found for this workbook.</em></p>';
    }

    return `
      <div style="margin-top: 1rem;">
        <h4>Questions & Responses Summary</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <p><strong>Total Questions:</strong> ${POWERPOD.workbookQuestionsAndResponses.stats.totalQuestions}</p>
            <p><strong>Answered Questions:</strong> ${POWERPOD.workbookQuestionsAndResponses.stats.answeredQuestions}</p>
            <p><strong>Unanswered Questions:</strong> ${POWERPOD.workbookQuestionsAndResponses.stats.unansweredQuestions}</p>
          </div>
          <div>
            <p><strong>Completion:</strong> ${POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage}%</p>
            <p><strong>Chapters:</strong> ${POWERPOD.workbookQuestionsAndResponses.questionsByChapter.size}</p>
            <p><strong>Last Updated:</strong> ${POWERPOD.workbookQuestionsAndResponses.lastUpdated ? new Date(POWERPOD.workbookQuestionsAndResponses.lastUpdated).toLocaleString() : 'Unknown'}</p>
          </div>
        </div>

        <details style="margin-top: 1rem;">
          <summary style="cursor: pointer; font-weight: 500;">View Questions & Responses by Chapter</summary>
          <div style="margin-top: 0.5rem; max-height: 400px; overflow-y: auto;">
            ${Array.from(questionsAndResponses.questionsByChapter.entries()).map(([chapterId, chapterQuestions]) => `
              <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--sl-color-neutral-50); border-radius: var(--sl-border-radius-medium);">
                <h5 style="margin: 0 0 0.75rem 0; color: var(--sl-color-primary-600);">Chapter: ${chapterId}</h5>
                <p style="margin: 0 0 0.75rem 0; font-size: 0.875rem; color: var(--sl-color-neutral-600);">
                  ${chapterQuestions.length} questions, ${chapterQuestions.filter(q => q.response).length} answered
                </p>
                ${chapterQuestions.map(entry => `
                  <div style="padding: 0.5rem; margin: 0.5rem 0; background-color: white; border-radius: var(--sl-border-radius-small); border-left: 3px solid ${entry.response ? 'var(--sl-color-success-600)' : 'var(--sl-color-neutral-300)'};">
                    <p style="margin: 0 0 0.25rem 0; font-weight: 500; font-size: 0.875rem;">
                      ${entry.question ? entry.question.quartech_questiontext || 'Question text not available' : 'Question data not loaded'}
                    </p>
                    ${entry.response ? `
                      <p style="margin: 0 0 0.25rem 0; color: var(--sl-color-success-800);">
                        <strong>Response:</strong> ${entry.response.quartech_response || 'No response text'}
                      </p>
                      <p style="margin: 0; font-size: 0.75rem; color: var(--sl-color-neutral-600);">
                        Answered: ${new Date(entry.response.createdon).toLocaleString()}
                      </p>
                    ` : `
                      <p style="margin: 0; font-style: italic; color: var(--sl-color-neutral-500);">Not answered yet</p>
                    `}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </details>

        <details style="margin-top: 1rem;">
          <summary style="cursor: pointer; font-weight: 500;">View All Questions & Responses (Flat List)</summary>
          <div style="margin-top: 0.5rem; max-height: 300px; overflow-y: auto;">
            ${Array.from(questionsAndResponses.questionsWithResponses.entries()).map(([questionId, entry]) => `
              <div style="padding: 0.5rem; margin: 0.5rem 0; background-color: var(--sl-color-neutral-50); border-radius: var(--sl-border-radius-small); border-left: 3px solid ${entry.response ? 'var(--sl-color-success-600)' : 'var(--sl-color-neutral-300)'};">
                <p style="margin: 0 0 0.25rem 0; font-weight: 500; font-size: 0.875rem;">Question ID: ${questionId}</p>
                ${entry.question ? `
                  <p style="margin: 0 0 0.25rem 0; color: var(--sl-color-neutral-700);">
                    <strong>Question:</strong> ${entry.question.quartech_questiontext || 'No question text'}
                  </p>
                ` : ''}
                ${entry.response ? `
                  <p style="margin: 0 0 0.25rem 0; color: var(--sl-color-success-800);">
                    <strong>Response:</strong> ${entry.response.quartech_response || 'No response text'}
                  </p>
                  <p style="margin: 0; font-size: 0.75rem; color: var(--sl-color-neutral-600);">
                    Created: ${new Date(entry.response.createdon).toLocaleString()}
                    ${entry.response.modifiedon !== entry.response.createdon ? ` | Modified: ${new Date(entry.response.modifiedon).toLocaleString()}` : ''}
                  </p>
                ` : `
                  <p style="margin: 0; font-style: italic; color: var(--sl-color-neutral-500);">Not answered yet</p>
                `}
              </div>
            `).join('')}
          </div>
        </details>
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="card">
            <div><strong>EFP Workbook:</strong> Test</div>
            <div><strong>Status:</strong> In Progress</div>
            <div>
              <strong>Questions & Responses:</strong>
              ${POWERPOD.workbookQuestionsAndResponses.isLoading
                ? html`<span style="color: var(--sl-color-warning-600);">Loading...</span>`
                : POWERPOD.workbookQuestionsAndResponses.error
                  ? html`<span style="color: var(--sl-color-danger-600);">Error loading</span>`
                  : html`<span style="color: var(--sl-color-success-600);">Loaded</span>`
              }
            </div>
            ${POWERPOD.workbookQuestionsAndResponses.isLoaded
              ? html`
                <div><strong>Total Questions:</strong> ${POWERPOD.workbookQuestionsAndResponses.stats.totalQuestions}</div>
                <div><strong>Answered:</strong> ${POWERPOD.workbookQuestionsAndResponses.stats.answeredQuestions}</div>
                <div><strong>Completion:</strong> ${POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage}%</div>
                <div><strong>Chapters:</strong> ${POWERPOD.workbookQuestionsAndResponses.questionsByChapter.size}</div>
              `
              : ''
            }
          </div>

          <sl-tab-group
            .activeTab=${`section-${this.currentSectionIndex}`}
            @sl-tab-show=${(e: CustomEvent) => {
              const tabIndex = parseInt(e.detail.name.replace('section-', ''));
              this.handleSectionChange(tabIndex);
            }}
          >
            ${this.sections.map((section, index) => {
              const isActive = index === this.currentSectionIndex;
              const isComplete = this.getSectionCompletionFromStore(section);
              const icon = isComplete ? 'check-circle' : 'pencil';
              const color = isActive ? 'orange' : isComplete ? 'green' : 'gray';

              return html`
                <sl-tab slot="nav" panel="section-${index}">
                  <sl-icon
                    name=${icon}
                    style="color: ${color}; margin-right: 0.5rem;"
                  ></sl-icon>
                  <span style=${isActive ? 'font-weight: bold;' : ''}
                    >${section.tab}</span
                  >
                </sl-tab>
              `;
            })}
            ${this.sections.map(
              (section, index) => html`
                <sl-tab-panel name="section-${index}">
                  <div class="card">
                    <strong>${section.title}</strong>
                  </div>
                  ${this.renderItems(section.items)}
                </sl-tab-panel>
              `
            )}
          </sl-tab-group>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="card">
            <strong>${POWERPOD.workbookQuestionsAndResponses.isLoaded ? POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage : this.completionPercent}% Complete</strong>
            <div style="
              width: 100%;
              height: 0.75rem;
              background-color: #e5e7eb;
              border-radius: 0.375rem;
              margin-top: 0.5rem;
              overflow: hidden;
            ">
              <div style="
                height: 100%;
                background-color: #3b82f6;
                border-radius: 0.375rem;
                transition: width 0.3s ease;
                width: ${POWERPOD.workbookQuestionsAndResponses.isLoaded ? POWERPOD.workbookQuestionsAndResponses.stats.completionPercentage : this.completionPercent}%;
              "></div>
            </div>
          </div>

          <!-- Navigation buttons above content -->
          <navigation-buttons
            .isPreviousDisabled=${this.currentStepIndex === 0}
            .isContinueDisabled=${this.currentStepIndex >= this.flatSteps.length - 1}
            .sectionsLength=${this.sections.length}
            @previous-clicked=${this.handleNavigationPrevious}
            @skip-clicked=${this.handleNavigationSkip}
            @continue-clicked=${this.handleNavigationContinue}
          ></navigation-buttons>

          <div class="card">
            <efp-breadcrumbs
              .currentStep=${this.flatSteps[this.currentStepIndex]}
              .currentSection=${this.sections[this.currentSectionIndex]}
              .currentSectionIndex=${this.currentSectionIndex}
              .currentStepIndex=${this.currentStepIndex}
              .flatSteps=${this.flatSteps}
              .sections=${this.sections}
              @breadcrumb-navigate=${this.handleBreadcrumbNavigation}
            ></efp-breadcrumbs>
            <h2>${this.activeContent.title}</h2>
            ${this.renderMainContent()}
          </div>

          <!-- Navigation buttons below content -->
          <navigation-buttons
            .isPreviousDisabled=${this.currentStepIndex === 0}
            .isContinueDisabled=${this.currentStepIndex >= this.flatSteps.length - 1}
            .sectionsLength=${this.sections.length}
            @previous-clicked=${this.handleNavigationPrevious}
            @skip-clicked=${this.handleNavigationSkip}
            @continue-clicked=${this.handleNavigationContinue}
          ></navigation-buttons>
        </main>
      </div>
    `;
  }
}
