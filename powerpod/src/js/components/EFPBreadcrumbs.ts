import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Types
interface BreadcrumbItem {
  label: string;
  isActive: boolean;
  onClick: (() => void) | null;
}

interface EFPStep {
  label: string;
  content: string;
  sectionIndex: number;
}

interface EFPSection {
  tab: string;
  title: string;
  items: EFPSectionItem[];
}

interface EFPSectionItem {
  label: string;
  title?: string;
  content?: string;
  complete?: boolean;
  items?: EFPSectionItem[];
}

// Utility class for text operations
class EFPTextUtils {
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Utility class for navigation operations
class EFPNavigationUtils {
  static findFirstSelectableStepInSection(
    sectionIndex: number,
    flatSteps: EFPStep[],
    sections: EFPSection[]
  ): { step: EFPStep; index: number } | null {
    // Implementation would be provided by the parent component
    return null;
  }

  static findContainersForItem(itemLabel: string, sections: EFPSection[]): string[] {
    // Implementation would be provided by the parent component
    return [];
  }
}

@customElement('efp-breadcrumbs')
export class EFPBreadcrumbs extends LitElement {
  @property({ type: Object }) currentStep: EFPStep | null = null;
  @property({ type: Object }) currentSection: EFPSection | null = null;
  @property({ type: Number }) currentSectionIndex = 0;
  @property({ type: Number }) currentStepIndex = 0;
  @property({ type: Array }) flatSteps: EFPStep[] = [];
  @property({ type: Array }) sections: EFPSection[] = [];

  static styles = css`
    /* Breadcrumbs styling */
    .breadcrumbs {
      margin-bottom: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--sl-color-neutral-200);
      background: linear-gradient(135deg, var(--sl-color-neutral-25) 0%, var(--sl-color-neutral-50) 100%);
      border-radius: var(--sl-border-radius-small) var(--sl-border-radius-small) 0 0;
      margin: -1rem -1rem 1rem -1rem;
      padding: 0.75rem 1rem;
    }

    .breadcrumb-list {
      display: flex;
      align-items: center;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 0.875rem;
      color: var(--sl-color-neutral-600);
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
    }

    .breadcrumb-link {
      background: none;
      border: none;
      color: var(--sl-color-primary-600);
      text-decoration: none;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--sl-border-radius-small);
      font-family: var(--body-font);
      font-size: inherit;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .breadcrumb-link:hover {
      background-color: var(--sl-color-primary-50);
      color: var(--sl-color-primary-700);
    }

    .breadcrumb-link:focus {
      outline: 2px solid var(--sl-color-primary-600);
      outline-offset: 2px;
    }

    .breadcrumb-current {
      color: var(--sl-color-neutral-800);
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      font-family: var(--body-font);
    }

    .breadcrumb-item.active .breadcrumb-current {
      color: var(--sl-color-neutral-900);
      font-weight: 600;
    }

    .breadcrumb-separator {
      margin: 0 0.5rem;
      color: var(--sl-color-neutral-400);
      font-size: 0.75rem;
    }

    /* Responsive breadcrumbs */
    @media (max-width: 768px) {
      .breadcrumb-list {
        font-size: 0.8rem;
      }
      
      .breadcrumb-link,
      .breadcrumb-current {
        padding: 0.2rem 0.4rem;
      }
      
      .breadcrumb-separator {
        margin: 0 0.3rem;
      }
    }
  `;

  private buildStepHierarchy(currentStep: EFPStep): Array<{label: string, level: number}> {
    const hierarchy: Array<{label: string, level: number}> = [];
    
    // Method 1: Check if this is a numbered step (e.g., "7.11 Plant Biodiversity")
    const stepMatch = currentStep.label.match(/^(\d+)\.(\d+)\s+(.+)$/);
    if (stepMatch) {
      const [, chapterNum, subNum] = stepMatch;
      
      // Add main chapter (e.g., "Chapter 7")
      hierarchy.push({
        label: `Chapter ${chapterNum}`,
        level: 1
      });
      
      // For sub-subchapters (7.11), also add the subchapter level
      if (subNum.length > 1) {
        // This is a sub-subchapter like 7.11, so add the parent subchapter (7.1)
        const parentSubNum = `${chapterNum}.${subNum.charAt(0)}`;
        
        // Find the parent subchapter in the navigation structure
        const parentSubchapter = this.findStepByPattern(new RegExp(`^${parentSubNum}\\s+`));
        if (parentSubchapter) {
          hierarchy.push({
            label: parentSubchapter.label,
            level: 2
          });
        }
      }
      
      return hierarchy;
    }
    
    // Method 2: Find parent containers by searching the section structure
    const currentSection = this.sections[this.currentSectionIndex];
    if (currentSection) {
      const parentContainer = this.findParentContainer(currentStep.label, currentSection.items);
      if (parentContainer) {
        hierarchy.push({
          label: parentContainer,
          level: 1
        });
      }
    }
    
    // Method 3: Fallback - try to find parent containers using existing navigation utility
    if (hierarchy.length === 0) {
      const parentContainers = EFPNavigationUtils.findContainersForItem(currentStep.label, this.sections);
      parentContainers.forEach((container, index) => {
        hierarchy.push({
          label: container,
          level: index + 1
        });
      });
    }
    
    return hierarchy;
  }

  private findParentContainer(targetLabel: string, items: EFPSectionItem[]): string | null {
    for (const item of items) {
      // Check if this item has nested items
      if ('items' in item && Array.isArray(item.items)) {
        // Check if the target is directly in this container's items
        const foundInContainer = item.items.some(subItem => subItem.label === targetLabel);
        if (foundInContainer) {
          console.log(`Found parent container for "${targetLabel}": "${item.title || item.label}"`);
          return item.title || item.label;
        }
        
        // Recursively search in nested containers
        const foundInNested = this.findParentContainer(targetLabel, item.items);
        if (foundInNested) {
          return foundInNested;
        }
      }
    }
    return null;
  }

  private findStepByPattern(pattern: RegExp): EFPStep | undefined {
    return this.flatSteps.find(step => pattern.test(step.label));
  }

  private isItemInNestedContainer(targetLabel: string): boolean {
    const currentSection = this.sections[this.currentSectionIndex];
    if (!currentSection) return false;
    
    return this.findParentContainer(targetLabel, currentSection.items) !== null;
  }

  private generateBreadcrumbs(): BreadcrumbItem[] {
    const currentStep = this.currentStep;
    if (!currentStep) return [];

    const currentSection = this.currentSection;
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Check if current step is a section header (like "Section A", "Section B")
    const isSectionHeader = currentStep.label === currentSection?.tab || 
                           currentStep.label.startsWith('Section ') ||
                           currentStep.content === currentSection?.title;

    // Add section breadcrumb (only if current step is not the section header itself)
    if (currentSection && !isSectionHeader) {
      breadcrumbs.push({
        label: currentSection.tab,
        isActive: false,
        onClick: () => {
          this.dispatchNavigationEvent('section', { 
            sectionIndex: this.currentSectionIndex 
          });
        }
      });
    }

    // For nested items, build the complete hierarchy breadcrumb
    const isNestedItem = currentStep.label.includes(':') || 
                        currentStep.label.startsWith('Chapter ') || 
                        /^\d+\.\d+/.test(currentStep.label) ||
                        this.isItemInNestedContainer(currentStep.label);
    
    if (isNestedItem) {
      // Build the complete hierarchy for this step
      const hierarchy = this.buildStepHierarchy(currentStep);
      
      console.log('Breadcrumb hierarchy for', currentStep.label, ':', hierarchy);
      
      // Add each level of the hierarchy (excluding the current step itself)
      hierarchy.forEach((hierarchyItem: {label: string, level: number}) => {
        if (hierarchyItem.label !== currentStep.label) {
          breadcrumbs.push({
            label: hierarchyItem.label,
            isActive: false,
            onClick: () => {
              this.dispatchNavigationEvent('hierarchy', { 
                targetLabel: hierarchyItem.label 
              });
            }
          });
        }
      });
    }

    // Add current step breadcrumb (always last)
    let currentStepLabel = isSectionHeader ? 
      (currentSection?.tab || currentStep.label) : 
      currentStep.label;
    
    // Format numbered steps to use colon (e.g., "7.11 Plant Biodiversity" -> "7.11: Plant Biodiversity")
    const numberedStepMatch = currentStepLabel.match(/^(\d+\.\d+)\s+(.+)$/);
    if (numberedStepMatch) {
      const [, number, title] = numberedStepMatch;
      currentStepLabel = `${number}: ${title}`;
    }
      
    breadcrumbs.push({
      label: EFPTextUtils.truncateText(currentStepLabel, 50),
      isActive: true,
      onClick: null
    });

    return breadcrumbs;
  }

  private dispatchNavigationEvent(type: string, data: any) {
    this.dispatchEvent(new CustomEvent('breadcrumb-navigate', {
      detail: { type, data },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.currentStep) {
      // Fallback: show basic breadcrumb even if no current step
      return html`
        <nav class="breadcrumbs" aria-label="Breadcrumb navigation" role="navigation">
          <ol class="breadcrumb-list">
          </ol>
        </nav>
      `;
    }

    const breadcrumbs = this.generateBreadcrumbs();

    return html`
      <nav class="breadcrumbs" aria-label="Breadcrumb navigation" role="navigation">
        <ol class="breadcrumb-list">
          ${breadcrumbs.map((crumb, index) => html`
            <li class="breadcrumb-item ${crumb.isActive ? 'active' : ''}">
              ${crumb.isActive ? 
                html`<span 
                  class="breadcrumb-current" 
                  title="${this.currentStep?.label || crumb.label}"
                  aria-current="page"
                >${crumb.label}</span>` :
                html`<button 
                  class="breadcrumb-link" 
                  @click=${crumb.onClick}
                  type="button"
                  title="Navigate to ${crumb.label}"
                  aria-label="Navigate to ${crumb.label}"
                >${crumb.label}</button>`
              }
              ${index < breadcrumbs.length - 1 ? html`<sl-icon name="chevron-right" class="breadcrumb-separator" aria-hidden="true"></sl-icon>` : ''}
            </li>
          `)}
        </ol>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'efp-breadcrumbs': EFPBreadcrumbs;
  }
}
