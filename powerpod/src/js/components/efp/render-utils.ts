// Minimal type definitions for module independence
export interface EFPStep {
  label: string;
  content: string;
  complete?: boolean;
  sectionIndex: number;
  chapterData?: any;
  subchapterData?: any;
  isContainer?: boolean;
  hideSkipChapterCheckbox?: boolean; // If true, the "This section does not apply" checkbox will be hidden
}

export interface EFPActiveContent {
  title: string;
  content: string;
}

export interface EFPSectionItem {
  label: string;
  content?: string;
  complete?: boolean;
  items?: EFPSectionItem[];
  title?: string;
  disableExpand?: boolean; // If true, item will not be expandable even if it has items
}

export class EFPRenderUtils {
  static renderMainContent(
    currentSectionIndex: number,
    flatSteps: EFPStep[],
    currentStepIndex: number,
    activeContent: EFPActiveContent,
    html: any,
    unsafeHTML: any,
    renderSubchapter: (subchapterData: any) => any,
    renderChapter: (chapterData: any) => any,
    renderContainerSubchapter: (subchapterData: any) => any,
    renderContainerChapter: (chapterData: any) => any
  ): any {
    // Check if we're in My Workbook (first section) and have a chapter to render
    if (currentSectionIndex === 0) {
      // My Workbook is index 0
      const currentStep = flatSteps[currentStepIndex];

      // Check if it's a container item (should not be selectable)
      if (currentStep && 'isContainer' in currentStep && currentStep.isContainer) {
/*         return html`
          <div class="container-message">
            <h3>Please select a specific chapter section from the navigation</h3>
            <p>This is a chapter container. Click on one of the specific sections in the navigation to view its content.</p>
          </div>
        `; */
        if (currentStep && 'subchapterData' in currentStep) {
          return renderContainerSubchapter(currentStep.subchapterData);
        }
        // Check if it's a main chapter
        else if (currentStep && 'chapterData' in currentStep) {
          return renderContainerChapter(currentStep.chapterData);
        }
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
    getCompletion?: (item: EFPSectionItem) => boolean,
    getSkipped?: (item: EFPSectionItem) => boolean
  ): any {
    return items.map((item) => {
      const isComplete = getCompletion ? getCompletion(item) : (item.complete || false);
      const isSkipped = getSkipped ? getSkipped(item) : false;

      // Determine icon based on state: skipped > complete > incomplete
      let iconName: string;
      let iconColor: string;

      if (isSkipped) {
        iconName = 'dash-circle-fill';
        iconColor = 'var(--sl-color-neutral-500)';
      } else if (isComplete) {
        iconName = 'check-circle';
        iconColor = 'var(--sl-color-success-600)';
      } else {
        iconName = 'pencil';
        iconColor = 'var(--sl-color-warning-600)';
      }

      // Determine item capabilities based on content
      const hasContent = item.content && item.content.trim() !== '';
      const hasSubitems = 'items' in item && Array.isArray(item.items) && item.items.length > 0;

      // Check if expansion is disabled
      const isExpandDisabled = item.disableExpand === true;

      // If disableExpand is true, render as non-expandable container that clicks first item
      if (isExpandDisabled && hasSubitems) {
        // Get the first item to click when the container is clicked
        const firstItem = item.items![0];
        return html`
          <div
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 0.75rem 1rem;
              cursor: pointer;
              border: 1px solid var(--sl-color-neutral-200);
              border-radius: var(--sl-border-radius-medium);
              background-color: var(--sl-color-neutral-0);
              margin-bottom: 0.75rem;
              ${activeContentTitle === firstItem.label
                ? 'font-weight: 600; background-color: var(--sl-color-primary-50); color: var(--sl-color-primary-800);'
                : 'font-weight: 500;'}
            "
            @click=${() => onItemClick(firstItem)}
          >
            <sl-icon
              name=${iconName}
              style="color: ${iconColor}"
            ></sl-icon>
            <span>${item.title || item.label}</span>
          </div>
        `;
      }

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
            ${EFPRenderUtils.renderItems(item.items || [], html, activeContentTitle, onItemClick, renderItems, getCompletion, getSkipped)}
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
            ${EFPRenderUtils.renderItems(item.items || [], html, activeContentTitle, onItemClick, renderItems, getCompletion, getSkipped)}
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

