import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Logger } from '../common/logger.js';
import { EFPStep, EFPSection, EFPSectionItem } from './efp/types.js';
import { getQuestionnaireFromStore } from '../common/questionnaire.js';
import { EFPTextUtils } from './efp/text-utils.js';

const logger = Logger('components/WorkbookSearchDialog');

export interface SearchResult {
  type: 'chapter' | 'subchapter' | 'question';
  id: string;
  title: string;
  parentTitle?: string;
  chapterId?: string;
  questionText?: string;
  stepIndex: number;
}

@customElement('workbook-search-dialog')
export class WorkbookSearchDialog extends LitElement {
  @property({ type: Array }) flatSteps: EFPStep[] = [];
  @property({ type: Array }) sections: EFPSection[] = [];
  
  @state() private searchQuery = '';
  @state() private searchResults: SearchResult[] = [];
  @state() private selectedIndex = 0;
  @state() private isOpen = false;

  @query('sl-dialog') dialogEl!: HTMLElement & { show: () => void; hide: () => void };
  @query('sl-input') inputEl!: HTMLElement & { focus: () => void };

  static styles = css`
    sl-dialog::part(panel) {
      max-width: 600px;
      width: 90vw;
    }

    sl-dialog::part(body) {
      padding: 0;
    }

    sl-dialog::part(header) {
      display: none;
    }

    .search-container {
      padding: 0.75rem;
      border-bottom: 1px solid var(--sl-color-neutral-200);
    }

    sl-input::part(base) {
      border: none;
      box-shadow: none;
    }

    sl-input::part(input) {
      font-size: 1.1rem;
    }

    .results-container {
      max-height: 400px;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .result-item {
      display: flex;
      flex-direction: column;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .result-item:hover,
    .result-item.selected {
      background-color: var(--sl-color-primary-50);
    }

    .result-item.selected {
      background-color: var(--sl-color-primary-100);
    }

    .result-title {
      font-weight: 500;
      color: var(--sl-color-neutral-900);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .result-parent {
      font-size: 0.85rem;
      color: var(--sl-color-neutral-500);
      margin-top: 0.25rem;
    }

    .result-type {
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .no-results {
      padding: 2rem;
      text-align: center;
      color: var(--sl-color-neutral-500);
    }

    .shortcut-hint {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      border-top: 1px solid var(--sl-color-neutral-200);
      background-color: var(--sl-color-neutral-50);
      font-size: 0.8rem;
      color: var(--sl-color-neutral-600);
    }

    .shortcut-hint kbd {
      background-color: var(--sl-color-neutral-200);
      border-radius: 3px;
      padding: 0.1rem 0.4rem;
      font-family: monospace;
      font-size: 0.75rem;
    }

    .highlight {
      background-color: var(--sl-color-warning-200);
      border-radius: 2px;
    }
  `;

  public show() {
    this.isOpen = true;
    this.searchQuery = '';
    this.searchResults = [];
    this.selectedIndex = 0;
    this.updateComplete.then(() => {
      this.dialogEl?.show();
      setTimeout(() => this.inputEl?.focus(), 100);
    });
  }

  public hide() {
    this.isOpen = false;
    this.dialogEl?.hide();
  }

  private handleSearchInput(e: CustomEvent) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    this.performSearch();
    this.selectedIndex = 0;
  }

  private performSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    const questionnaire = getQuestionnaireFromStore();

    if (!questionnaire?.chapters?.length) {
      this.searchResults = [];
      return;
    }

    const chapters = questionnaire.chapters[0] || [];

    // Search through chapters, subchapters, and questions
    chapters.forEach((chapter: any) => {
      const chapterTitle = EFPTextUtils.formatChapterTitle(chapter);
      const chapterStepIndex = this.findStepIndexByLabel(chapterTitle);

      // Search chapter title
      if (chapterTitle.toLowerCase().includes(query)) {
        results.push({
          type: 'chapter',
          id: chapter.id,
          title: chapterTitle,
          chapterId: chapter.id,
          stepIndex: chapterStepIndex,
        });
      }

      // Search subchapters
      if (chapter.subchapters) {
        chapter.subchapters.forEach((subchapter: any) => {
          const subchapterTitle = EFPTextUtils.formatChapterTitle(subchapter);
          const subchapterStepIndex = this.findStepIndexByLabel(subchapterTitle);

          if (subchapterTitle.toLowerCase().includes(query)) {
            results.push({
              type: 'subchapter',
              id: subchapter.id,
              title: subchapterTitle,
              parentTitle: chapterTitle,
              chapterId: subchapter.id,
              stepIndex: subchapterStepIndex,
            });
          }

          // Search questions in subchapter
          if (subchapter.questions) {
            subchapter.questions.forEach((question: any) => {
              const questionLabel = question.label || question.name || '';
              const questionText = question.textBelowQuestion || '';
              const searchText = `${questionLabel} ${questionText}`.toLowerCase();

              if (searchText.includes(query)) {
                results.push({
                  type: 'question',
                  id: question.id,
                  title: this.stripHtml(questionLabel) || `Question ${question.order}`,
                  parentTitle: subchapterTitle,
                  chapterId: subchapter.id,
                  questionText: this.stripHtml(questionText).substring(0, 100),
                  stepIndex: subchapterStepIndex,
                });
              }
            });
          }
        });
      }

      // Search questions in chapter (if no subchapters)
      if (chapter.questions) {
        chapter.questions.forEach((question: any) => {
          const questionLabel = question.label || question.name || '';
          const questionText = question.textBelowQuestion || '';
          const searchText = `${questionLabel} ${questionText}`.toLowerCase();

          if (searchText.includes(query)) {
            results.push({
              type: 'question',
              id: question.id,
              title: this.stripHtml(questionLabel) || `Question ${question.order}`,
              parentTitle: chapterTitle,
              chapterId: chapter.id,
              questionText: this.stripHtml(questionText).substring(0, 100),
              stepIndex: chapterStepIndex,
            });
          }
        });
      }
    });

    // Limit results
    this.searchResults = results.slice(0, 20);
  }

  private findStepIndexByLabel(label: string): number {
    return this.flatSteps.findIndex(step => step.label === label);
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.searchResults.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && this.searchResults.length > 0) {
      e.preventDefault();
      this.selectResult(this.searchResults[this.selectedIndex]);
    } else if (e.key === 'Escape') {
      this.hide();
    }
  }

  private selectResult(result: SearchResult) {
    logger.info({
      message: 'Search result selected',
      data: { result },
    });

    this.dispatchEvent(new CustomEvent('search-navigate', {
      detail: {
        stepIndex: result.stepIndex,
        chapterId: result.chapterId,
        questionId: result.type === 'question' ? result.id : null,
      },
      bubbles: true,
      composed: true,
    }));

    this.hide();
  }

  private getTypeVariant(type: string): 'primary' | 'success' | 'neutral' {
    switch (type) {
      case 'chapter': return 'primary';
      case 'subchapter': return 'success';
      case 'question': return 'neutral';
      default: return 'neutral';
    }
  }

  render() {
    return html`
      <sl-dialog
        @sl-after-hide=${() => this.isOpen = false}
      >
        <div class="search-container">
          <sl-input
            placeholder="Search chapters, questions..."
            size="large"
            .value=${this.searchQuery}
            @sl-input=${this.handleSearchInput}
            @keydown=${this.handleKeyDown}
          >
            <sl-icon name="search" slot="prefix"></sl-icon>
          </sl-input>
        </div>

        <div class="results-container">
          ${this.searchResults.length === 0 && this.searchQuery
            ? html`<div class="no-results">No results found for "${this.searchQuery}"</div>`
            : this.searchResults.map((result, index) => html`
                <div
                  class="result-item ${index === this.selectedIndex ? 'selected' : ''}"
                  @click=${() => this.selectResult(result)}
                  @mouseenter=${() => this.selectedIndex = index}
                >
                  <div class="result-title">
                    <sl-badge variant=${this.getTypeVariant(result.type)} class="result-type">
                      ${result.type}
                    </sl-badge>
                    ${result.title}
                  </div>
                  ${result.parentTitle ? html`
                    <div class="result-parent">
                      <sl-icon name="folder"></sl-icon>
                      ${result.parentTitle}
                    </div>
                  ` : ''}
                  ${result.questionText ? html`
                    <div class="result-parent">${result.questionText}...</div>
                  ` : ''}
                </div>
              `)
          }
          ${!this.searchQuery ? html`
            <div class="no-results">
              <sl-icon name="search" style="font-size: 2rem; margin-bottom: 0.5rem;"></sl-icon>
              <p>Type to search chapters and questions</p>
            </div>
          ` : ''}
        </div>

        <div class="shortcut-hint">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>Enter</kbd> to select</span>
          <span><kbd>Esc</kbd> to close</span>
        </div>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workbook-search-dialog': WorkbookSearchDialog;
  }
}
