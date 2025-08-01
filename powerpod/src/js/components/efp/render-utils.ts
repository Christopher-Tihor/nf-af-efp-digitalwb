import { html, TemplateResult } from 'lit';
import { EFPStep, EFPActiveContent, EFPSectionItem } from './types';

// Utility class for rendering helpers
export class EFPRenderUtils {
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
    renderItems: (items: EFPSectionItem[]) => any
  ): any {
    return items.map((item) => {
      if ('items' in item && Array.isArray(item.items)) {
        return html`
          <sl-details summary=${item.title}>
            ${renderItems(item.items)}
          </sl-details>
        `;
      } else {
        return html`
          <div
            class="nav-subchapter-title"
            style=${activeContentTitle === item.label
              ? 'font-weight: 600; background-color: var(--sl-color-primary-50); color: var(--sl-color-primary-800);'
              : 'font-weight: 500;'}
            @click=${() => onItemClick(item)}
          >
            <sl-icon
              name=${item.complete ? 'check-circle' : 'pencil'}
              style="color: ${item.complete ? 'var(--sl-color-success-600)' : 'var(--sl-color-warning-600)'}"
            ></sl-icon>
            ${item.label}
          </div>
        `;
      }
    });
  }

  static renderProgressBar(completionPercent: number, html: any): TemplateResult {
    return html`
      <div class="card">
        <strong>${completionPercent}% Complete</strong>
        <sl-progress
          .value=${completionPercent}
          max="100"
        ></sl-progress>
      </div>
    `;
  }

  static renderSectionTabs(
    sections: any[],
    currentSectionIndex: number,
    isSectionComplete: (section: any) => boolean,
    onTabShow: (e: CustomEvent) => void,
    html: any
  ): TemplateResult {
    return html`
      <sl-tab-group
        .activeTab=${`section-${currentSectionIndex}`}
        @sl-tab-show=${onTabShow}
      >
        ${sections.map((section, index) => {
          const isActive = index === currentSectionIndex;
          const isComplete = isSectionComplete(section);
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
        ${sections.map(
          (section, index) => html`
            <sl-tab-panel name="section-${index}">
              <div class="card">
                <strong>${section.title}</strong>
              </div>
              ${EFPRenderUtils.renderItems(section.items, html, '', () => {}, (items: EFPSectionItem[]) => EFPRenderUtils.renderItems(items, html, '', () => {}, () => {}))}
            </sl-tab-panel>
          `
        )}
      </sl-tab-group>
    `;
  }

  static renderContainerMessage(html: any): TemplateResult {
    return html`
      <div class="container-message">
        <h3>Please select a specific chapter section from the navigation</h3>
        <p>This is a chapter container. Click on one of the specific sections in the navigation to view its content.</p>
      </div>
    `;
  }
}
