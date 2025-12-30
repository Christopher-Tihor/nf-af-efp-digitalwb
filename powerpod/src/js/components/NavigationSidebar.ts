import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { Logger } from '../common/logger.js';
import type { EFPSection } from './efp/types.js';

const logger = Logger('components/NavigationSidebar');

/**
 * NavigationSidebar Component
 *
 * Displays workbook information and section navigation with completion status
 */
@customElement('navigation-sidebar')
export class NavigationSidebar extends LitElement {
  @property({ type: String }) workbookId = 'N/A';
  @property({ type: String }) workbookName = 'N/A';
  @property({ type: String }) workbookStatus = 'N/A';
  @property({ type: Array }) sections: EFPSection[] = [];
  @property({ type: Number }) currentSectionIndex = 0;
  @property({ type: Object }) sectionCompletion: Map<number, boolean> = new Map();
  @property({ type: Object }) sectionSkipped: Map<number, boolean> = new Map();

  @query('sl-tab-group') tabGroupEl!: HTMLElement & { show: (tabName: string) => void };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }

    .card {
      background: var(--sl-color-neutral-0);
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      padding: 1rem;
      margin-top: 0.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--sl-shadow-x-small);
    }

    .card div {
      margin-bottom: 0.5rem;
    }

    .card div:last-child {
      margin-bottom: 0;
    }

    .card strong {
      font-weight: 600;
      color: var(--sl-color-neutral-700);
    }

    sl-tab-group {
      --indicator-color: var(--sl-color-primary-600);
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }

    sl-tab-group::part(nav) {
      display: flex;
      justify-content: center;
    }

    sl-tab::part(base) {
      padding: 0.75rem 1rem;
    }

    sl-tab-panel {
      padding: 0;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }

    /* Ensure slotted content doesn't expand the sidebar */
    ::slotted(*) {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }
  `;

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    // Sync tab group with currentSectionIndex when it changes programmatically
    if (changedProps.has('currentSectionIndex') && this.tabGroupEl) {
      const activeTab = `section-${this.currentSectionIndex}`;
      this.tabGroupEl.show?.(activeTab);
      logger.info({
        message: `Tab group synced to section ${this.currentSectionIndex}`,
      });
    }
  }

  private handleSectionChange(tabIndex: number) {
    logger.info({
      message: `Section tab changed to index ${tabIndex}`,
    });

    this.dispatchEvent(
      new CustomEvent('section-change', {
        detail: { sectionIndex: tabIndex },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getSectionCompletion(_section: EFPSection, index: number): boolean {
    return this.sectionCompletion.get(index) || false;
  }

  private getSectionSkipped(_section: EFPSection, index: number): boolean {
    return this.sectionSkipped.get(index) || false;
  }

  render() {
    return html`
      <!-- Workbook Info Card -->
      <div class="card">
        <div><strong>Workbook ID:</strong> ${this.workbookId}</div>
        <div><strong>Workbook Name:</strong> ${this.workbookName}</div>
        <div><strong>Status:</strong> ${this.workbookStatus}</div>
      </div>

      <!-- Section Tabs -->
      <sl-tab-group
        no-scroll-controls
        @sl-tab-show=${(e: CustomEvent) => {
          const tabIndex = parseInt(e.detail.name.replace('section-', ''));
          this.handleSectionChange(tabIndex);
        }}
      >
        ${this.sections.map((section, index) => {
          const isActive = index === this.currentSectionIndex;
          const isComplete = this.getSectionCompletion(section, index);
          const isSkipped = this.getSectionSkipped(section, index);

          // Determine icon based on state: skipped > complete > incomplete
          let icon: string;
          let color: string;

          if (isSkipped) {
            icon = 'skip-forward-circle';
            color = isActive ? 'orange' : '#d97706'; // yellow color
          } else if (isComplete) {
            icon = 'check-circle';
            color = '#22c55e'; // green - always green when completed
          } else {
            icon = 'pencil';
            color = isActive ? 'orange' : 'gray';
          }

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
              <slot name="section-${index}-items"></slot>
            </sl-tab-panel>
          `
        )}
      </sl-tab-group>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'navigation-sidebar': NavigationSidebar;
  }
}

