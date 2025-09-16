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

import { LitElement, css, html } from 'lit';
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

// Type definitions for better type safety
interface EFPStep {
  label: string;
  content: string;
  complete?: boolean;
  sectionIndex: number;
  chapterData?: any;
  subchapterData?: any;
  isContainer?: boolean;
}

interface EFPSection {
  tab: string;
  title: string;
  items: EFPSectionItem[];
}

interface EFPSectionItem {
  label: string;
  content?: string;
  complete?: boolean;
  items?: EFPSectionItem[];
  title?: string;
  isContainer?: boolean;
  chapterData?: any;
  subchapterData?: any;
}

interface EFPActiveContent {
  title: string;
  content: string;
}

// Create logger instance for EFP components
const logger = Logger('components/EFPEntryForm');

// Utility class for text formatting
class EFPTextUtils {
  static formatChapterTitle(chapterOrName: any): string {
    // Handle both chapter objects and string names
    // For parent chapters: prepend "Chapter"
    // For subchapters: prepend order number

    if (!chapterOrName) return '';

    // If it's a string (legacy usage), handle it the old way
    if (typeof chapterOrName === 'string') {
      const chapterName = chapterOrName;
      const titleCase = chapterName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

      // If it starts with "Chapter" and has a number, add a colon after the number
      const chapterMatch = titleCase.match(/^Chapter (\d+(?:\.\d+)?) (.+)$/);
      if (chapterMatch) {
        const [, chapterNum, chapterTitle] = chapterMatch;
        return `Chapter ${chapterNum}: ${chapterTitle}`;
      }

      return titleCase;
    }

    // Handle chapter/subchapter objects
    const chapter = chapterOrName;
    const name = chapter.name || chapter.label || '';
    const order = chapter.order || 0;

    if (!name) return '';

    // Clean the name - remove any existing "CHAPTER X" prefixes
    let cleanName = name.replace(/^CHAPTER\s+\d+(?:\.\d+)?\s+/i, '').trim();

    // Convert to title case
    const titleCase = cleanName.toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());

    // Determine if this is a parent chapter or subchapter based on order
    const orderStr = order.toString();
    const isParentChapter = !orderStr.includes('.') || orderStr.endsWith('.0');

    if (isParentChapter) {
      // Parent chapter: check if name already starts with the chapter number
      const chapterNumber = Math.floor(order);
      const startsWithNumber = titleCase.match(/^\d+\.\s/);

      if (startsWithNumber) {
        // Name already contains the number (e.g., "2. Farmstead"), just prepend "Chapter"
        return `Chapter ${titleCase}`;
      } else {
        // Name doesn't contain number, prepend "Chapter X:"
        return `Chapter ${chapterNumber}: ${titleCase}`;
      }
    } else {
      // Subchapter: prepend order number
      return `${order} ${titleCase}`;
    }
  }

  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Utility class for completion calculations
class EFPCompletionUtils {
  static calculateOverallCompletion(sections: EFPSection[]): number {
    const allItems: EFPSectionItem[] = [];

    const collect = (items: EFPSectionItem[]) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          collect(item.items);
        } else {
          allItems.push(item);
        }
      }
    };

    for (const section of sections) {
      collect(section.items);
    }

    const completed = allItems.filter((item) => item.complete).length;
    return allItems.length === 0
      ? 0
      : Math.round((completed / allItems.length) * 100);
  }

  static isSectionComplete(section: EFPSection): boolean {
    const leafItems: EFPSectionItem[] = [];

    const collect = (items: EFPSectionItem[]) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          collect(item.items);
        } else {
          leafItems.push(item);
        }
      }
    };

    collect(section.items);
    return leafItems.every((item) => item.complete);
  }
}

// Utility class for section generation
class EFPSectionGenerator {
  static renderSubchapterContent(subchapter: any): string {
    const subSubchaptersCount = subchapter.subchapters?.length || 0;
    const subSubchaptersInfo = subSubchaptersCount > 0
      ? `<p style="font-family: var(--body-font); font-weight: 500; color: var(--sl-color-neutral-600); margin: 0;"><strong>Sub-sections:</strong> ${subSubchaptersCount}</p>`
      : '';

    return `
      <div class="subchapter-content">
        <h3 style="font-family: var(--chapter-font); font-weight: 600; font-size: 1.5rem; color: var(--sl-color-neutral-800); margin-bottom: 1rem;">${subchapter.name || subchapter.label}</h3>
        <div style="font-family: var(--body-font); line-height: 1.6; color: var(--sl-color-neutral-700); margin-bottom: 1rem;">${subchapter.description || ''}</div>
        <div style="display: flex; gap: 2rem; margin-bottom: 1rem;">
          <p style="font-family: var(--body-font); font-weight: 500; color: var(--sl-color-neutral-600); margin: 0;"><strong>Questions:</strong> ${subchapter.questions?.length || 0}</p>
          ${subSubchaptersInfo}
        </div>
      </div>
    `;
  }

  static renderChapterContent(chapter: any): string {
    const formattedTitle = EFPTextUtils.formatChapterTitle(chapter);
    return `
      <div class="chapter-content">
        <h3 style="font-family: var(--chapter-font); font-weight: 700; font-size: 1.75rem; color: var(--sl-color-primary-900); margin-bottom: 1rem; letter-spacing: -0.025em;">${formattedTitle}</h3>
        <div style="font-family: var(--body-font); line-height: 1.6; color: var(--sl-color-neutral-700); margin-bottom: 1.5rem; font-size: 1.05rem;">${chapter.description || ''}</div>
        <div style="display: flex; gap: 2rem; margin-bottom: 1rem;">
          <p style="font-family: var(--body-font); font-weight: 500; color: var(--sl-color-neutral-600); margin: 0;"><strong>Questions:</strong> ${chapter.questions?.length || 0}</p>
          <p style="font-family: var(--body-font); font-weight: 500; color: var(--sl-color-neutral-600); margin: 0;"><strong>Subchapters:</strong> ${chapter.subchapters?.length || 0}</p>
        </div>
      </div>
    `;
  }
}

// Utility class for navigation helpers
class EFPNavigationUtils {
  static isStepContainer(step: EFPStep, sections: EFPSection[]): boolean {
    // Check if this step corresponds to a container item
    // Container items are those that have 'items' property in the original structure
    // and are marked as containers, or have empty/placeholder content

    // If the step has no actual content or is marked as container
    if (!step.content || step.content === '') {
      return true;
    }

    // Check if this step corresponds to a main chapter container
    for (const section of sections) {
      for (const item of section.items) {
        if ('items' in item && Array.isArray(item.items)) {
          for (const subItem of item.items) {
            if (subItem.label === step.label && subItem.isContainer) {
              return true;
            }
          }
        }
      }
    }

    // Check if the step label matches a chapter container pattern (e.g., "Chapter 6", "Chapter 7")
    if (/^Chapter \d+$/.test(step.label)) {
      return true;
    }

    // Check if the step label matches a subchapter container pattern (e.g., "Chapter 6: Nutrient Application")
    if (/^Chapter \d+: /.test(step.label)) {
      // Check if there's a next step that would be a child of this container
      // This is a heuristic to determine if this is a container
      const flatSteps = EFPNavigationUtils.getFlatStepsFromSections(sections);
      const currentIndex = flatSteps.findIndex(s => s.label === step.label);
      if (currentIndex >= 0 && currentIndex < flatSteps.length - 1) {
        const nextStep = flatSteps[currentIndex + 1];
        if (nextStep && nextStep.label.length > step.label.length &&
            !nextStep.label.startsWith('Chapter ') &&
            nextStep.content && nextStep.content.trim() !== '') {
          return true;
        }
      }
    }

    // Check if the content contains the container message
    if (step.content && step.content.includes('Please select a specific chapter section')) {
      return true;
    }

    return false;
  }

  static findLastSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): { step: EFPStep, index: number } | null {
    // Find all steps in the given section
    const stepsInSection: { step: EFPStep, index: number }[] = [];

    flatSteps.forEach((step, index) => {
      if (step.sectionIndex === sectionIndex) {
        stepsInSection.push({ step, index });
      }
    });

    // Go through the steps in reverse order to find the last selectable one
    for (let i = stepsInSection.length - 1; i >= 0; i--) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      if (!isContainer) {
        logger.info({ message: `Found last selectable step in section ${sectionIndex}: "${step.label}" at index ${index}` });
        return { step, index };
      }
    }

    logger.warn({ message: `No selectable steps found in section ${sectionIndex}` });
    return null;
  }

  static findFirstSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): { step: EFPStep, index: number } | null {
    // Find all steps in the given section
    const stepsInSection: { step: EFPStep, index: number }[] = [];

    flatSteps.forEach((step, index) => {
      if (step.sectionIndex === sectionIndex) {
        stepsInSection.push({ step, index });
      }
    });

    // Go through the steps in order to find the first selectable one (skip section headers)
    for (let i = 0; i < stepsInSection.length; i++) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      // Skip section headers like "Section A", "Section B", etc.
      if (!isContainer && !step.label.startsWith('Section ')) {
        logger.info({ message: `Found first selectable step in section ${sectionIndex}: "${step.label}" at index ${index}` });
        return { step, index };
      }
    }

    logger.warn({ message: `No selectable steps found in section ${sectionIndex}` });
    return null;
  }

  static findContainersForItem(itemLabel: string, sections: EFPSection[]): string[] {
    const containers: string[] = [];

    // Recursive function to search through the navigation structure
    const searchItems = (items: EFPSectionItem[], parentContainers: string[] = []) => {
      for (const item of items) {
        const currentPath = [...parentContainers];

        if ('items' in item && Array.isArray(item.items)) {
          // This is a container, add it to the current path
          if (item.title) {
            currentPath.push(item.title);
          }

          // Check if the target item exists in this container's children
          const foundInChildren = EFPNavigationUtils.itemExistsInChildren(item.items, itemLabel);
          if (foundInChildren) {
            containers.push(...currentPath);
          }

          // Recursively search children
          searchItems(item.items, currentPath);
        }
      }
    };

    // Search through all sections
    sections.forEach(section => {
      if (section.items) {
        searchItems(section.items);
      }
    });

    return containers;
  }

  static itemExistsInChildren(items: EFPSectionItem[], targetLabel: string): boolean {
    for (const item of items) {
      if (item.label === targetLabel) {
        return true;
      }
      if ('items' in item && Array.isArray(item.items)) {
        if (EFPNavigationUtils.itemExistsInChildren(item.items, targetLabel)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper method to get flat steps from sections (used internally)
  private static getFlatStepsFromSections(sections: EFPSection[]): EFPStep[] {
    const result: EFPStep[] = [];

    const collect = (items: EFPSectionItem[], sectionIndex: number) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          result.push({
            label: item.title || item.label,
            content: '', // Container items have no content
            sectionIndex,
            isContainer: true,
          });
          collect(item.items, sectionIndex);
        } else {
          const stepItem: EFPStep = {
            label: item.label,
            content: item.content ?? '',
            complete: item.complete ?? false,
            sectionIndex,
          };

          // Add chapter data if it exists (for chapters)
          if (item.chapterData) {
            stepItem.chapterData = item.chapterData;
          }

          // Add subchapter data if it exists (for subchapters)
          if (item.subchapterData) {
            stepItem.subchapterData = item.subchapterData;
          }

          // Mark as container if specified
          if (item.isContainer) {
            stepItem.isContainer = item.isContainer;
          }

          result.push(stepItem);
        }
      }
    };

    sections.forEach((section, index) => {
      result.push({
        label: section.tab,
        content: section.title,
        sectionIndex: index,
      });
      collect(section.items, index);
    });

    return result;
  }
}

// Utility class for rendering helpers
class EFPRenderUtils {
  static renderMainContent(
    currentSectionIndex: number,
    flatSteps: EFPStep[],
    currentStepIndex: number,
    activeContent: EFPActiveContent,
    html: any,
    unsafeHTML: any,
    renderSubchapter: (subchapterData: any) => any,
    renderChapter: (chapterData: any) => any
  ): any {
    // Check if we're in Section B and have a chapter to render
    if (currentSectionIndex === 1) { // Section B is index 1
      const currentStep = flatSteps[currentStepIndex];

      // Check if it's a container item (should not be selectable)
      if (currentStep && 'isContainer' in currentStep && currentStep.isContainer) {
        return html`
          <div class="container-message">
            <h3>Please select a specific chapter section from the navigation</h3>
            <p>This is a chapter container. Click on one of the specific sections in the navigation to view its content.</p>
          </div>
        `;
      }
      // Check if it's a subchapter
      else if (currentStep && 'subchapterData' in currentStep) {
        return renderSubchapter(currentStep.subchapterData);
      }
      // Check if it's a main chapter
      else if (currentStep && 'chapterData' in currentStep) {
        return renderChapter(currentStep.chapterData);
      }
    }

    // Default content rendering
    return html`<div>${unsafeHTML(activeContent.content)}</div>`;
  }

  static renderItems(
    items: EFPSectionItem[],
    html: any,
    activeContentTitle: string,
    onItemClick: (item: EFPSectionItem) => void,
    renderItems: (items: EFPSectionItem[]) => any,
    getCompletion?: (item: EFPSectionItem) => boolean
  ): any {
    return items.map((item) => {
      const isComplete = getCompletion ? getCompletion(item) : (item.complete || false);
      const iconName = isComplete ? 'check-circle' : 'pencil';
      const iconColor = isComplete ? 'var(--sl-color-success-600)' : 'var(--sl-color-warning-600)';

      // Determine item capabilities based on content
      const hasContent = item.content && item.content.trim() !== '';
      const hasSubitems = 'items' in item && Array.isArray(item.items) && item.items.length > 0;

      if (hasContent && hasSubitems) {
        // BOTH clickable AND expandable - render in one line with sl-details
        return html`
          <sl-details data-container-title="${item.title || item.label}">
            <div
              slot="summary"
              style="display: flex; align-items: center; gap: 8px; cursor: pointer; ${activeContentTitle === item.label
                ? 'font-weight: 600; background-color: var(--sl-color-primary-50); color: var(--sl-color-primary-800);'
                : 'font-weight: 500;'}"
              @click=${(e: Event) => {
                // Prevent expansion when clicking the title for navigation
                e.stopPropagation();
                onItemClick(item);
              }}
            >
              <sl-icon
                name=${iconName}
                style="color: ${iconColor}"
              ></sl-icon>
              <span>${item.title || item.label}</span>
            </div>
            ${EFPRenderUtils.renderItems(item.items || [], html, activeContentTitle, onItemClick, renderItems, getCompletion)}
          </sl-details>
        `;
      } else if (hasSubitems) {
        // Only expandable - pure container
        return html`
          <sl-details data-container-title="${item.title || item.label}">
            <div slot="summary" style="display: flex; align-items: center; gap: 8px;">
              <sl-icon
                name=${iconName}
                style="color: ${iconColor}"
              ></sl-icon>
              <span>${item.title || item.label}</span>
            </div>
            ${EFPRenderUtils.renderItems(item.items || [], html, activeContentTitle, onItemClick, renderItems, getCompletion)}
          </sl-details>
        `;
      } else {
        // Only clickable - simple item
        return html`
          <div
            class="nav-subchapter-title"
            style=${activeContentTitle === item.label
              ? 'font-weight: 600; background-color: var(--sl-color-primary-50); color: var(--sl-color-primary-800);'
              : 'font-weight: 500;'}
            @click=${() => onItemClick(item)}
          >
            <sl-icon
              name=${iconName}
              style="color: ${iconColor}"
            ></sl-icon>
            ${item.label}
          </div>
        `;
      }
    });
  }
}



// Utility class for lifecycle management
class EFPLifecycleUtils {
  static handleStepIndexChange(
    currentStepIndex: number,
    flatSteps: EFPStep[],
    activeContent: EFPActiveContent,
    onContentUpdate: (newContent: EFPActiveContent) => void,
    onNavigationUpdate?: (label: string) => void
  ): boolean {
    const step = flatSteps[currentStepIndex];

    if (step && (activeContent.title !== step.label || activeContent.content !== step.content)) {
      const newContent: EFPActiveContent = {
        title: step.label,
        content: step.content,
      };

      onContentUpdate(newContent);
      onNavigationUpdate?.(step.label);

      return true; // Content was updated
    }

    return false; // No update needed
  }

  static handleSectionIndexChange(
    currentSectionIndex: number,
    tabGroupEl: any,
    onTabUpdate?: () => void
  ): void {
    if (tabGroupEl) {
      const activeTab = `section-${currentSectionIndex}`;
      tabGroupEl.show?.(activeTab);
      onTabUpdate?.();
    }
  }

  static shouldRequestUpdate(changedProps: Map<string, unknown>, watchedProps: string[]): boolean {
    return watchedProps.some(prop => changedProps.has(prop));
  }
}

@customElement('efp-entry-form')
export class EFPEntryForm extends LitElement {
  @property({ type: Number }) currentSectionIndex = 0;
  @property({ type: Number }) currentStepIndex = 0;
  @property({ type: Array, attribute: false }) nestedChapterStructure: any[] = [];
  @property({ type: Array, attribute: false }) workbookResponses: any[] = [];
  @property({ type: Boolean, attribute: false }) isLoadingResponses = false;
  @property({ type: Boolean, attribute: false }) questionnaireStoreLoaded = false;
  private isNavigating = false; // Flag to prevent tab change interference
  @property({ type: Object }) activeContent: EFPActiveContent = {
    title: 'Introduction to the Environmental Farm Plan (EFP)',
    content:
      'The purpose of the EFP is to assess the features and management of your farm to identify environmental risks and develop an action plan.',
  };
  @query('sl-tab-group') tabGroupEl!: HTMLElement & {
    show: (tabName: string) => void;
  };

  connectedCallback() {
    super.connectedCallback();
    logger.info({ message: 'EFPEntryForm connected' });

    // Check if questionnaire store is already loaded
    this.updateQuestionnaireStoreStatus();

    // Set up periodic check for questionnaire store loading
    this.setupQuestionnaireStoreWatcher();
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

  static styles = css`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;600;700&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/@bcgov/bc-sans@2.0.0/css/BCSans.css');

    :host {
      font-family: 'BCSans', 'BC Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --chapter-font: 'Roboto Slab', Georgia, serif;
      --body-font: 'BCSans', 'BC Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Global font override for all content */
    :host *,
    :host *::before,
    :host *::after {
      font-family: var(--body-font) !important;
    }

    /* Specific overrides for headings */
    :host h1,
    :host h2,
    :host h3,
    :host h4,
    :host h5,
    :host h6 {
      font-family: var(--chapter-font) !important;
    }

    .container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      min-height: 100vh;
      height: auto;
      font-family: var(--body-font);
    }

    /* Custom spacing for navigation collapsible containers */
    sl-details {
      margin-bottom: 0.75rem !important;
    }

    sl-details::part(base) {
      padding: 0.25rem !important;
    }

    sl-details::part(header) {
      padding: 0.5rem 0.75rem !important;
    }

    sl-details::part(content) {
      padding: 0.25rem 0.75rem 0.5rem 0.75rem !important;
    }

    /* Spacing for standalone navigation items after collapsible containers */
    .nav-subchapter-title {
      margin-top: 0.5rem !important;
    }

    .sidebar {
      flex: 0 0 25%;
      padding: 1rem;
      border-right: 1px solid var(--sl-color-neutral-200);
      font-family: var(--body-font);
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      padding: 1rem;
      font-family: var(--body-font);
      min-height: 100vh;
    }

    @media (max-width: 992px) {
      .sidebar {
        order: 2;
        flex: 0 0 100%;
      }

      .main-content {
        order: 1;
        flex: 0 0 100%;
      }
    }

    .card {
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      padding: 1rem;
      margin-bottom: 1rem;
      background-color: var(--sl-color-neutral-0);
      font-family: var(--body-font);
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    sl-tab::part(base) {
      display: flex;
      align-items: center;
      font-family: var(--body-font);
      font-weight: 500;
    }

    .question-container {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      background-color: var(--sl-color-neutral-50);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      font-family: var(--body-font);
    }

    .question-label {
      font-family: var(--chapter-font);
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 0.75rem;
      line-height: 1.4;
      color: var(--sl-color-neutral-900);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .question-tooltip-icon {
      color: var(--sl-color-neutral-500);
      cursor: help;
      font-size: 1rem;
    }

    .question-tooltip-icon:hover {
      color: var(--sl-color-primary-600);
    }

    .question-text {
      margin-bottom: 1rem;
      color: var(--sl-color-neutral-700);
      font-size: 0.95rem;
      line-height: 1.6;
      font-family: var(--body-font);
    }

    .chapter-header {
      background: linear-gradient(135deg, var(--sl-color-primary-50) 0%, var(--sl-color-primary-100) 100%);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border-radius: var(--sl-border-radius-medium);
      border-left: 4px solid var(--sl-color-primary-600);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .chapter-header h3 {
      font-family: var(--chapter-font);
      font-weight: 700;
      font-size: 1.75rem;
      color: var(--sl-color-primary-900);
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.025em;
    }

    .subchapter-header {
      background: linear-gradient(135deg, var(--sl-color-neutral-100) 0%, var(--sl-color-neutral-150) 100%);
      padding: 1rem;
      margin: 1.5rem 0;
      border-radius: var(--sl-border-radius-small);
      border-left: 3px solid var(--sl-color-neutral-500);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .subchapter-header h4 {
      font-family: var(--chapter-font);
      font-weight: 600;
      font-size: 1.35rem;
      color: var(--sl-color-neutral-800);
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.015em;
    }

    .sub-subchapter-header {
      background: linear-gradient(135deg, var(--sl-color-neutral-50) 0%, var(--sl-color-neutral-100) 100%);
      padding: 0.75rem;
      margin: 1rem 0 1rem 1rem;
      border-radius: var(--sl-border-radius-small);
      border-left: 2px solid var(--sl-color-neutral-400);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .sub-subchapter-header h5 {
      font-family: var(--chapter-font);
      font-weight: 500;
      font-size: 1.15rem;
      color: var(--sl-color-neutral-700);
      margin: 0 0 0.5rem 0;
    }

    .container-message {
      background: linear-gradient(135deg, var(--sl-color-neutral-50) 0%, var(--sl-color-neutral-100) 100%);
      padding: 2rem;
      margin: 2rem 0;
      border-radius: var(--sl-border-radius-medium);
      border: 1px solid var(--sl-color-neutral-200);
      text-align: center;
    }

    .container-message h3 {
      font-family: var(--chapter-font);
      font-weight: 600;
      font-size: 1.25rem;
      color: var(--sl-color-neutral-700);
      margin: 0 0 1rem 0;
    }

    .container-message p {
      font-family: var(--body-font);
      color: var(--sl-color-neutral-600);
      margin: 0;
      line-height: 1.5;
    }

    .question-response {
      margin-top: 1rem;
      font-family: var(--body-font);
    }

    /* Navigation styling */
    .nav-chapter-title {
      font-family: var(--chapter-font);
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--sl-color-neutral-800);
    }

    .nav-subchapter-title {
      font-family: var(--body-font);
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--sl-color-neutral-700);
    }

    /* Content area typography */
    .chapter-content h3,
    .subchapter-content h3 {
      font-family: var(--chapter-font) !important;
      font-weight: 600;
      color: var(--sl-color-neutral-800);
      margin-bottom: 0.75rem;
    }

    .chapter-content p,
    .subchapter-content p {
      font-family: var(--body-font) !important;
      line-height: 1.6;
      color: var(--sl-color-neutral-700);
    }

    /* Question content styling - override any inherited fonts */
    .main-content,
    .main-content *,
    .main-content p,
    .main-content div,
    .main-content span,
    .main-content label,
    .main-content input,
    .main-content textarea,
    .main-content select {
      font-family: var(--body-font) !important;
    }

    /* Ensure question text uses BC Sans */
    .main-content h1,
    .main-content h2,
    .main-content h3,
    .main-content h4,
    .main-content h5,
    .main-content h6 {
      font-family: var(--chapter-font) !important;
    }

    /* Radio buttons and form elements */
    .main-content input[type="radio"],
    .main-content input[type="checkbox"],
    .main-content input[type="text"],
    .main-content textarea,
    .main-content select {
      font-family: var(--body-font) !important;
    }

    /* Question labels and text */
    .main-content .question-label,
    .main-content .question-text {
      font-family: var(--body-font) !important;
    }

    /* Override any external stylesheets for question content */
    .main-content [data-question-content],
    .main-content [data-question-content] *,
    .main-content .question-container,
    .main-content .question-container * {
      font-family: var(--body-font) !important;
    }

    /* Specific overrides for common question elements */
    .main-content strong,
    .main-content b,
    .main-content em,
    .main-content i,
    .main-content span,
    .main-content div {
      font-family: inherit !important;
    }


  `;

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
      case 'Yes/No/NA':
      case 'Point Rating':
        // Get existing response value for this question
        const existingResponse = this.getResponseForQuestion(question.id);
        const selectedValue = existingResponse?.quartech_response || '';




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





  private renderMainContent() {
    return EFPRenderUtils.renderMainContent(
      this.currentSectionIndex,
      this.flatSteps,
      this.currentStepIndex,
      this.activeContent,
      html,
      unsafeHTML,
      (subchapterData: any) => this.renderSubchapter(subchapterData),
      (chapterData: any) => this.renderChapter(chapterData)
    );
  }



  // Generate Section B items directly from questionnaire store
  private getSectionBItemsFromStore(): EFPSectionItem[] {
    const questionnaire = getQuestionnaireFromStore();

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
        content: '', // No content for the parent container
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
    return this.isSectionComplete(section);
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

    if (this.currentStepIndex < this.flatSteps.length - 1) {
      let nextIndex = this.currentStepIndex + 1;

      // Skip over container items and find the next selectable item
      while (nextIndex < this.flatSteps.length) {
        const nextStep = this.flatSteps[nextIndex];

        // Check if this step is a container (non-selectable)
        const isContainer = EFPNavigationUtils.isStepContainer(nextStep, this.sections);

        if (!isContainer) {
          // Found a selectable step
          logger.info({ message: `Found selectable step: ${nextStep.label} at index ${nextIndex}` });

          const currentStep = this.flatSteps[this.currentStepIndex];
          const currentSectionIndex = currentStep.sectionIndex;

          // Check if this is cross-section navigation (going to next section)
          if (nextStep.sectionIndex > currentSectionIndex) {


            // Find the FIRST selectable step in the next section
            const firstStepInNextSection = EFPNavigationUtils.findFirstSelectableStepInSection(nextStep.sectionIndex, this.flatSteps, this.sections);
            if (firstStepInNextSection) {


              // Set navigation flag to prevent tab change interference
              this.isNavigating = true;

              this.currentStepIndex = firstStepInNextSection.index;
              this.currentSectionIndex = firstStepInNextSection.step.sectionIndex;

              // Update the active content
              this.activeContent = {
                title: firstStepInNextSection.step.label,
                content: firstStepInNextSection.step.content,
              };

              // Update navigation state to expand relevant containers
              this.updateNavigationState(firstStepInNextSection.step.label);

              // Clear navigation flag after a brief delay
              setTimeout(() => {
                this.isNavigating = false;
              }, 100);

              // Force a re-render
              this.requestUpdate();
              return;
            }
          }

          // Regular same-section navigation
          this.isNavigating = true;

          this.currentStepIndex = nextIndex;
          this.currentSectionIndex = nextStep.sectionIndex;

          // Immediately update the active content
          this.activeContent = {
            title: nextStep.label,
            content: nextStep.content,
          };

          // Update navigation state to expand relevant containers
          this.updateNavigationState(nextStep.label);

          // Clear navigation flag after a brief delay
          setTimeout(() => {
            this.isNavigating = false;
          }, 100);

          // Force a re-render
          this.requestUpdate();
          return;
        }

        nextIndex++;
      }

      // If we didn't find any selectable steps, just go to the last step
      if (nextIndex >= this.flatSteps.length && this.currentStepIndex < this.flatSteps.length - 1) {
        logger.info({ message: 'No more selectable steps found, going to last step' });
        this.currentStepIndex = this.flatSteps.length - 1;
        this.currentSectionIndex = this.flatSteps[this.currentStepIndex].sectionIndex;
      }
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
  private async handleRatingChanged(event: CustomEvent) {

    const { questionId, value } = event.detail;

    try {

      logger.info({ message: `Rating changed for question ${questionId}: ${value}` });

      // Save the rating as a workbook response and get the response data
      const responseData = await this.saveRatingResponse(questionId, value);

      // Update the questionnaire store with the full response data
      updateQuestionResponse(questionId, value, true, responseData);


      logger.info({ message: `Successfully saved rating response for question ${questionId}` });

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

  // Helper method to save rating responses
  private async saveRatingResponse(questionId: string, ratingValue: any): Promise<any> {

    try {
      const responseText = String(ratingValue);
      const notes = `Rating: ${ratingValue}`;



      // Check if response already exists
      const existingResponse = this.getResponseForQuestion(questionId);


      let result;
      let responseData;

      if (existingResponse) {
        // Update existing response

        result = await WorkbookResponseHelper.updateResponse(
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
        // Create new response

        result = await WorkbookResponseHelper.createResponse(questionId, responseText, { notes });

        const workbookId = getWorkbookId();

        // Create new response data
        responseData = {
          quartech_workbookresponseid: result.response?.quartech_workbookresponseid,
          quartech_response: responseText,
          quartech_notes: notes,
          _quartech_question_value: questionId,
          _quartech_workbook_value: workbookId,
          createdon: new Date().toISOString(),
          modifiedon: new Date().toISOString(),
          ...result.response
        };


      }

      // Update memory structures
      await this.updateMemoryStructuresForRating(questionId, responseData, !existingResponse);

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

    if (this.currentStepIndex > 0) {
      const currentStep = this.flatSteps[this.currentStepIndex];
      const currentSectionIndex = currentStep.sectionIndex;

      // Check if we need to do cross-section navigation
      // Look for the immediate previous step to see if it's in a different section
      let prevIndex = this.currentStepIndex - 1;

      // Skip over container items to find the actual previous selectable step
      while (prevIndex >= 0) {
        const prevStep = this.flatSteps[prevIndex];
        const isContainer = EFPNavigationUtils.isStepContainer(prevStep, this.sections);

        if (!isContainer) {
          // Found a selectable previous step


          // Check if this step is in a different section (cross-section navigation)
          if (prevStep.sectionIndex < currentSectionIndex) {


            // Find the LAST selectable step in the previous section
            const lastStepInPrevSection = EFPNavigationUtils.findLastSelectableStepInSection(prevStep.sectionIndex, this.flatSteps, this.sections);
            if (lastStepInPrevSection) {


              // Set navigation flag to prevent tab change interference
              this.isNavigating = true;

              this.currentStepIndex = lastStepInPrevSection.index;
              this.currentSectionIndex = lastStepInPrevSection.step.sectionIndex;

              // Update the active content
              this.activeContent = {
                title: lastStepInPrevSection.step.label,
                content: lastStepInPrevSection.step.content,
              };

              // Update navigation state to expand relevant containers
              this.updateNavigationState(lastStepInPrevSection.step.label);

              // Clear navigation flag after a brief delay
              setTimeout(() => {
                this.isNavigating = false;
              }, 100);

              // Force a re-render
              this.requestUpdate();
              return;
            }
          }

          // Regular same-section navigation
          this.isNavigating = true;

          this.currentStepIndex = prevIndex;
          this.currentSectionIndex = prevStep.sectionIndex;

          // Update the active content
          this.activeContent = {
            title: prevStep.label,
            content: prevStep.content,
          };

          // Update navigation state to expand relevant containers
          this.updateNavigationState(prevStep.label);

          // Clear navigation flag after a brief delay
          setTimeout(() => {
            this.isNavigating = false;
          }, 100);

          // Force a re-render
          this.requestUpdate();
          return;
        }

        prevIndex--;
      }

      // If we didn't find any selectable steps, just go to the first step
      if (prevIndex < 0 && this.currentStepIndex > 0) {
        this.currentStepIndex = 0;
        this.currentSectionIndex = this.flatSteps[0].sectionIndex;
      }
    }
  }

  private get flatSteps(): EFPStep[] {
    const result: EFPStep[] = [];

    const collect = (items: any[], sectionIndex: number) => {
      for (const item of items) {
        if ('items' in item) {
          // This is a parent item with nested items (like a chapter with subchapters)
          result.push({
            label: item.label, // Use item.label which contains the chapter name
            content: item.content || '',
            sectionIndex,
            chapterData: item.chapterData, // Preserve chapter data
          });
          collect(item.items, sectionIndex);
        } else {
          const stepItem: any = {
            label: item.label,
            content: item.content ?? '',
            complete: item.complete ?? false,
            sectionIndex,
          };

          // Add chapter data if it exists (for main chapters)
          if (item.chapterData) {
            stepItem.chapterData = item.chapterData;
          }

          // Add subchapter data if it exists (for subchapters)
          if (item.subchapterData) {
            stepItem.subchapterData = item.subchapterData;
          }

          result.push(stepItem);
        }
      }
    };

    this.sections.forEach((section, index) => {
      result.push({
        label: section.tab,
        content: section.title,
        sectionIndex: index,
      });
      collect(section.items, index);
    });

    return result;
  }

  private isSectionComplete(section: EFPSection): boolean {
    return EFPCompletionUtils.isSectionComplete(section);
  }

  private initializeToFirstSelectableStep() {
    // Only initialize if we have sections and steps available
    if (!this.sections || this.sections.length === 0 || !this.flatSteps || this.flatSteps.length === 0) {

      return;
    }

    // Find the first selectable step in the first section
    const firstSelectableStep = EFPNavigationUtils.findFirstSelectableStepInSection(
      0, // First section
      this.flatSteps,
      this.sections
    );

    if (firstSelectableStep) {

      this.currentStepIndex = firstSelectableStep.index;
      this.currentSectionIndex = 0;

      // Update active content
      this.activeContent = {
        title: firstSelectableStep.step.label,
        content: firstSelectableStep.step.content,
      };

      // Update navigation state
      this.updateNavigationState(firstSelectableStep.step.label);
    } else {

      // Keep the default initialization (currentStepIndex = 0, currentSectionIndex = 0)
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
    const firstSelectableStep = EFPNavigationUtils.findFirstSelectableStepInSection(
      0, // First section
      this.flatSteps,
      this.sections
    );

    if (firstSelectableStep) {
      this.currentStepIndex = firstSelectableStep.index;
      this.currentSectionIndex = 0;

      // Update active content
      this.activeContent = {
        title: firstSelectableStep.step.label,
        content: firstSelectableStep.step.content,
      };

      // Update navigation state
      this.updateNavigationState(firstSelectableStep.step.label);
      this.requestUpdate();
    } else {
      // Fallback to first step
      this.currentStepIndex = 0;
      this.currentSectionIndex = 0;
      this.requestUpdate();
    }
  }

  private navigateToSection(sectionIndex: number) {


    // Navigate to first selectable step in section using the navigation utility
    const firstSelectableStep = EFPNavigationUtils.findFirstSelectableStepInSection(
      sectionIndex,
      this.flatSteps,
      this.sections
    );

    if (firstSelectableStep) {

      this.currentStepIndex = firstSelectableStep.index;
      this.currentSectionIndex = sectionIndex;

      // Update active content
      this.activeContent = {
        title: firstSelectableStep.step.label,
        content: firstSelectableStep.step.content,
      };

      // Update navigation state
      this.updateNavigationState(firstSelectableStep.step.label);
      this.requestUpdate();
    } else {

      // Fallback: navigate to first step in section even if it's a container
      const firstStepInSection = this.flatSteps.find(step => step.sectionIndex === sectionIndex);
      if (firstStepInSection) {
        const stepIndex = this.flatSteps.indexOf(firstStepInSection);

        this.currentStepIndex = stepIndex;
        this.currentSectionIndex = sectionIndex;
        this.activeContent = {
          title: firstStepInSection.label,
          content: firstStepInSection.content,
        };
        this.requestUpdate();
      }
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
        return;
      }

      logger.info({ message: `Loading workbook questions and responses for workbook: ${workbookId}` });

      // Load questions and responses into nested structure
      const result = await WorkbookResponseHelper.loadQuestionsAndResponses(workbookId);

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
