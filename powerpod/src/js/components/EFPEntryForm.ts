import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import shoelace from '../../assets/css/shoelace.css';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';

import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('efp-entry-form')
class EFPEntryForm extends LitElement {
  @property({ type: Number }) currentSectionIndex = 0;
  @property({ type: Number }) currentStepIndex = 0;
  @property({ type: Object }) activeContent: {
    title: string;
    content: string;
  } = {
    title: 'Introduction to the Environmental Farm Plan (EFP)',
    content:
      'The purpose of the EFP is to assess the features and management of your farm to identify environmental risks and develop an action plan.',
  };
  @query('sl-tab-group') tabGroupEl!: HTMLElement & {
    show: (tabName: string) => void;
  };

  static styles = css`
    .container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      height: 100vh;
    }

    .sidebar {
      flex: 0 0 25%;
      padding: 1rem;
      border-right: 1px solid var(--sl-color-neutral-200);
    }

    .main-content {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
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
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    sl-tab::part(base) {
      display: flex;
      align-items: center;
    }
  `;

  private sections = [
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
      title: 'Yard Site Review',
      items: [
        {
          label: 'Infrastructure',
          content: `
          <h3>Farm Infrastructure Overview</h3>
          <p>List and describe key structures on your farm such as barns, workshops, storage sheds, greenhouses, and fuel storage areas.</p>
          <p>Include the age, condition, and primary use of each structure. Note any recent renovations or upgrades relevant to environmental management.</p>
        `,
          complete: false,
        },
        {
          label: 'Drainage',
          content: `
          <h3>Drainage and Runoff</h3>
          <p>Assess how water drains from your yard site:</p>
          <ul>
            <li>Are there any areas with standing water or poor drainage?</li>
            <li>Is runoff directed away from wells, manure storage, and watercourses?</li>
            <li>Describe any ditches, berms, or engineered drainage solutions in place.</li>
          </ul>
        `,
          complete: true,
        },
      ],
    },
    {
      tab: 'Section C',
      title: 'Field Review',
      items: [
        {
          label: 'Soil Type',
          content: `
          <h3>Soil Type and Characteristics</h3>
          <p>Identify the dominant soil types across your fields.</p>
          <ul>
            <li>Include texture (e.g., loam, clay, sandy loam)</li>
            <li>Note any known drainage or compaction issues</li>
            <li>Attach soil maps or reports if available</li>
          </ul>
        `,
          complete: false,
        },
        {
          label: 'Erosion Risk',
          content: `
          <h3>Erosion Risk Assessment</h3>
          <p>Evaluate your fields for signs and risk of soil erosion.</p>
          <p>Factors to consider:</p>
          <ul>
            <li>Slope and topography</li>
            <li>Crop residue or cover crop practices</li>
            <li>History of water or wind erosion</li>
          </ul>
          <p>List any mitigation strategies currently in use, such as grassed waterways or windbreaks.</p>
        `,
          complete: false,
        },
      ],
    },
  ];

  private get completionPercent(): number {
    const allItems: any[] = [];

    const collect = (items: any[]) => {
      for (const item of items) {
        if ('items' in item) {
          collect(item.items);
        } else {
          allItems.push(item);
        }
      }
    };

    for (const section of this.sections) {
      collect(section.items);
    }

    const completed = allItems.filter((item) => item.complete).length;
    return allItems.length === 0
      ? 0
      : Math.round((completed / allItems.length) * 100);
  }

  private goToNext() {
    if (this.currentStepIndex < this.flatSteps.length - 1) {
      this.currentStepIndex++;
      this.currentSectionIndex =
        this.flatSteps[this.currentStepIndex].sectionIndex;
    }
  }

  private goToPrevious() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.currentSectionIndex =
        this.flatSteps[this.currentStepIndex].sectionIndex;
    }
  }

  private get flatSteps(): Array<{
    label: string;
    content: string;
    complete?: boolean;
    sectionIndex: number;
  }> {
    const result: any[] = [];

    const collect = (items: any[], sectionIndex: number) => {
      for (const item of items) {
        if ('items' in item) {
          result.push({
            label: item.title,
            content: '', // or item.description if needed
            sectionIndex,
          });
          collect(item.items, sectionIndex);
        } else {
          result.push({
            label: item.label,
            content: item.content ?? '',
            complete: item.complete ?? false,
            sectionIndex,
          });
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

  private isSectionComplete(section: { items: any[] }): boolean {
    const leafItems: any[] = [];

    const collect = (items: any[]) => {
      for (const item of items) {
        if ('items' in item) {
          collect(item.items);
        } else {
          leafItems.push(item);
        }
      }
    };

    collect(section.items);
    return leafItems.every((item) => item.complete);
  }

  private renderItems(items: any[]): unknown {
    return items.map((item) => {
      if ('items' in item && Array.isArray(item.items)) {
        return html`
          <sl-details summary=${item.title} open>
            <div
              style=${`padding-left: 8px; cursor: pointer; font-weight: ${
                this.activeContent.title === item.label ? 'bold' : '500'
              };`}
              @click=${() => {
                const index = this.flatSteps.findIndex(
                  (i) => i.label === item.label
                );
                if (index !== -1) {
                  this.currentStepIndex = index;
                  this.currentSectionIndex = this.flatSteps[index].sectionIndex;
                }
              }}
            >
              <sl-icon name="folder" style="margin-right: 6px;"></sl-icon>
              ${item.title}
            </div>
            ${this.renderItems(item.items)}
          </sl-details>
        `;
      } else {
        return html`
          <div
            style="padding-left: 16px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;"
            style=${this.activeContent.title === item.label
              ? 'font-weight: bold;'
              : ''}
            @click=${() => {
              const index = this.flatSteps.findIndex(
                (i) => i.label === item.label
              );
              if (index !== -1) {
                this.currentStepIndex = index;
                this.currentSectionIndex = this.flatSteps[index].sectionIndex;
              }
            }}
          >
            <sl-icon
              name=${item.complete ? 'check-circle' : 'pencil'}
              style="color: ${item.complete ? 'green' : 'orange'}"
            ></sl-icon>
            ${item.label}
          </div>
        `;
      }
    });
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('currentStepIndex')) {
      const step = this.flatSteps[this.currentStepIndex];
      if (
        step &&
        (this.activeContent.title !== step.label ||
          this.activeContent.content !== step.content)
      ) {
        this.activeContent = {
          title: step.label,
          content: step.content,
        };
      }
    }

    if (changedProps.has('currentSectionIndex') && this.tabGroupEl) {
      const activeTab = `section-${this.currentSectionIndex}`;
      this.tabGroupEl.show?.(activeTab); // <- force the tab to show
    }
  }

  willUpdate(changedProps: Map<string, unknown>) {
    if (changedProps.has('currentStepIndex')) {
      const step = this.flatSteps[this.currentStepIndex];
      if (
        step &&
        (this.activeContent.title !== step.label ||
          this.activeContent.content !== step.content)
      ) {
        this.activeContent = {
          title: step.label,
          content: step.content,
        };
      }
    }
  }

  render() {
    return html`
      <div class="container">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="card">
            <div><strong>EFP Workbook:</strong> Test</div>
            <div><strong>Status:</strong> In Progress</div>
          </div>

          <sl-tab-group
            .activeTab=${`section-${this.currentSectionIndex}`}
            @sl-tab-show=${(e: CustomEvent) => {
              const tabIndex = parseInt(e.detail.name.replace('section-', ''));
              this.currentSectionIndex = tabIndex;
            }}
          >
            ${this.sections.map((section, index) => {
              const isActive = index === this.currentSectionIndex;
              const isComplete = this.isSectionComplete(section);
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
            <strong>${this.completionPercent}% Complete</strong>
            <sl-progress
              .value=${this.completionPercent}
              max="100"
            ></sl-progress>
          </div>

          <div class="card">
            <h2>${this.activeContent.title}</h2>
            <div>${unsafeHTML(this.activeContent.content)}</div>
          </div>

          <div
            class="card"
            style="display: flex; gap: 1rem; align-items: center;"
          >
            <sl-button
              variant="default"
              size="large"
              ?disabled=${this.currentStepIndex === 0}
              @click=${this.goToPrevious}
            >
              <sl-icon name="chevron-left"></sl-icon>
              Previous
            </sl-button>

            <sl-button
              variant="text"
              @click=${() =>
                (this.currentSectionIndex = this.sections.length - 1)}
            >
              Skip to Next Required Step
            </sl-button>

            <sl-button
              variant="primary"
              size="large"
              ?disabled=${this.currentStepIndex >= this.flatSteps.length - 1}
              @click=${this.goToNext}
            >
              Continue
            </sl-button>
          </div>
        </main>
      </div>
    `;
  }
}
