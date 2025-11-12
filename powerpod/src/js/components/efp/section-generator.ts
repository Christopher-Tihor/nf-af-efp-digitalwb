import { EFPTextUtils } from './text-utils.js';

export class EFPSectionGenerator {
  static renderSubchapterContent(subchapter: any): string {
    const subSubchaptersCount = subchapter.subchapters?.length || 0;
    const subSubchaptersInfo = subSubchaptersCount > 0
      ? `<p style="font-family: var(--body-font); font-weight: 500; color: var(--sl-color-neutral-600); margin: 0;"><strong>Sub-sections:</strong> ${subSubchaptersCount}</p>`
      : '';

    return `
      <div class="subchapter-content">
        <div style="font-family: var(--body-font); line-height: 1.6; color: var(--sl-color-neutral-700); margin-bottom: 1rem;">${subchapter.description || ''}</div>
      </div>
    `;
  }

  static renderSubchapterContainerContent(subchapter: any): string {
    return `
      <div class="subchapter-content">
        <div style="font-family: var(--body-font); line-height: 1.6; color: var(--sl-color-neutral-700); margin-bottom: 1rem;">${subchapter.description || ''}</div>
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

  static renderChapterContainerContent(chapter: any): string {
    return `
      <div class="chapter-content">
        <div style="font-family: var(--body-font); line-height: 1.6; color: var(--sl-color-neutral-700); margin-bottom: 1.5rem; font-size: 1.05rem;">${chapter.description || ''}</div>
      </div>
    `;
  }

  static renderTermsAndConditionsContent(termsAndConditions: any): string {
    return `
      <div class="chapter-content">
        ${termsAndConditions}
      </div>
    `;
  }

  static renderAgreementAndConsentContent(agreementAndConsent: any): string {
    return `
      <div class="chapter-content">
        ${agreementAndConsent.content}
      </div>
    `;    
  }

}

