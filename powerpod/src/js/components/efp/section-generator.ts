import { EFPTextUtils } from './text-utils.js';
import { EFPSectionItem } from './types.js';
import { getQuestionnaireFromStore } from '../../common/questionnaire.js';
import { POWERPOD } from '../../common/constants.js';
import { Logger } from '../../common/logger.js';

const logger = Logger('efp/section-generator');

export class EFPSectionGenerator {
  // ============================================
  // Content Rendering Methods (existing)
  // ============================================

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

  // ============================================
  // Section B: Workbook Items from Store
  // ============================================

  static getSectionBItemsFromStore(): EFPSectionItem[] {
    const questionnaire: any = getQuestionnaireFromStore();

    // If questionnaire store is not loaded, show loading state
    if (!questionnaire?.chapters?.length) {
      logger.info({
        message: '📋 Questionnaire store not loaded, showing loading state',
      });
      return [
        {
          label: 'Loading Environmental Farm Plan...',
          content: `
            <h3>Loading Environmental Farm Plan Questionnaire</h3>
            <p>Please wait while we load the questionnaire chapters and questions from the store...</p>
            <p><em>The questionnaire store is being initialized...</em></p>
          `,
          complete: false,
        },
      ];
    }

    const chapters = questionnaire.chapters[0] || [];
    const items: EFPSectionItem[] = [];

    chapters.forEach((chapter: any) => {
      // Create the main chapter container (collapsible parent)
      const chapterItem: EFPSectionItem = {
        label: EFPTextUtils.formatChapterTitle(chapter),
        title: EFPTextUtils.formatChapterTitle(chapter),
        content: EFPSectionGenerator.renderChapterContainerContent(chapter),
        complete: chapter.complete || false,
        isContainer: true,
        chapterId: chapter.id,
        chapterData: chapter,
        items: [],
      };

      // Add all subchapters as direct clickable items under the main chapter
      if (chapter.subchapters && chapter.subchapters.length > 0) {
        chapter.subchapters.forEach((subchapter: any) => {
          const formattedSubchapterTitle = EFPTextUtils.formatChapterTitle(subchapter);
          const subchapterItem: EFPSectionItem = {
            label: formattedSubchapterTitle,
            content: EFPSectionGenerator.renderSubchapterContent(subchapter),
            complete: subchapter.complete || false,
            chapterId: subchapter.id,
            subchapterData: subchapter,
          };

          // If subchapter has sub-subchapters, add them as nested items
          if (subchapter.subchapters && subchapter.subchapters.length > 0) {
            subchapterItem.items = subchapter.subchapters.map((subSubchapter: any) => {
              const formattedSubSubTitle = EFPTextUtils.formatChapterTitle(subSubchapter);
              return {
                label: formattedSubSubTitle,
                content: EFPSectionGenerator.renderSubchapterContent(subSubchapter),
                complete: subSubchapter.complete || false,
                chapterId: subSubchapter.id,
                subchapterData: subSubchapter,
              };
            });
            subchapterItem.title = subchapterItem.label;
          }

          chapterItem.items!.push(subchapterItem);
        });
      } else {
        // If no subchapters, add the main chapter itself as a clickable item
        const formattedTitle = EFPTextUtils.formatChapterTitle(chapter);
        chapterItem.items!.push({
          label: formattedTitle,
          content: EFPSectionGenerator.renderChapterContent(chapter),
          complete: chapter.complete || false,
          chapterId: chapter.id,
          chapterData: chapter,
        });
      }

      items.push(chapterItem);
    });

    // Add "My Action Plan" chapter from portal page data
    const myActionPlanItem = EFPSectionGenerator.getMyActionPlanItemsFromPortalPage();
    items.push(myActionPlanItem);

    return items;
  }

  // ============================================
  // My Action Plan Items from Portal Page
  // ============================================

  static getMyActionPlanItemsFromPortalPage(): EFPSectionItem {
    const portalPageName = 'My Action Plan';
    const portalPageData = POWERPOD.state?.portalPages?.[portalPageName];

    // If portal page data is not loaded yet, return loading state
    if (!portalPageData) {
      logger.info({
        message: '📄 My Action Plan portal page data not loaded yet, showing loading state',
      });
      return {
        label: 'My Action Plan',
        title: 'My Action Plan',
        content: `
          <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
            <div id="spinner"></div>
          </div>
        `,
        complete: false,
        isContainer: true,
        disableExpand: true,
        hideSkipChapterCheckbox: true,
        items: [
          {
            label: 'My Action Plan',
            content: `
              <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
                <div id="spinner"></div>
              </div>
            `,
            complete: false,
            hideSkipChapterCheckbox: true,
          }
        ],
      };
    }

    // Build the content from sections 1-6
    const sections = [
      portalPageData.quartech_section1,
      portalPageData.quartech_section2,
      portalPageData.quartech_section3,
      portalPageData.quartech_section4,
      portalPageData.quartech_section5,
      portalPageData.quartech_section6,
    ].filter((section) => section);

    // Clean up the HTML content to remove problematic font-family styles
    const cleanedSections = sections.map((section) => {
      if (!section) return section;
      let cleaned = section.replace(
        /font-family:\s*&quot;Roboto Slab&quot;[^;]*;/gi,
        ''
      );
      cleaned = cleaned.replace(/font-family:\s*"Roboto Slab"[^;]*;/gi, '');
      cleaned = cleaned.replace(/font-family:\s*'Roboto Slab'[^;]*;/gi, '');
      cleaned = cleaned.replace(
        /list-style-position:\s*inside/gi,
        'list-style-position: outside'
      );
      return cleaned;
    });

    const actionPlanContent = `
      <div style="font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;">
        <style>
          .action-plan-content * {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .action-plan-content ul {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .action-plan-content ol {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .action-plan-content li {
            display: list-item !important;
            padding-left: 0.5em !important;
            line-height: 1.6 !important;
          }
          .action-plan-content h1, .action-plan-content h2, .action-plan-content h3,
          .action-plan-content h4, .action-plan-content h5, .action-plan-content h6 {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .action-plan-content p {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
        </style>
        <div class="action-plan-content">
          ${cleanedSections.join('\n')}
        </div>
        <action-plan-table></action-plan-table>
      </div>
    `;

    return {
      label: 'My Action Plan',
      title: 'My Action Plan',
      content: actionPlanContent,
      complete: false,
      isContainer: true,
      disableExpand: true,
      hideSkipChapterCheckbox: true,
      items: [
        {
          label: 'My Action Plan',
          content: actionPlanContent,
          complete: false,
          hideSkipChapterCheckbox: true,
        }
      ],
    };
  }

  // ============================================
  // Section C: Terms & Conditions from Portal Page
  // ============================================

  static getSectionCItemsFromPortalPage(): EFPSectionItem[] {
    const portalPageName = 'Workbook Terms and Conditions Sign-off';
    const portalPageData = POWERPOD.state?.portalPages?.[portalPageName];

    // If portal page data is not loaded yet, return loading state
    if (!portalPageData) {
      logger.info({
        message: '📄 Portal page data not loaded yet, showing loading state',
      });
      return [
        {
          label: '',
          content: `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
              <div id="spinner"></div>
            </div>
          `,
          complete: false,
        },
      ];
    }

    // Build the terms and conditions content from sections 1-6
    const sections = [
      portalPageData.quartech_section1,
      portalPageData.quartech_section2,
      portalPageData.quartech_section3,
      portalPageData.quartech_section4,
      portalPageData.quartech_section5,
      portalPageData.quartech_section6,
    ].filter((section) => section);

    // Clean up the HTML content to remove problematic font-family styles
    const cleanedSections = sections.map((section) => {
      if (!section) return section;
      let cleaned = section.replace(
        /font-family:\s*&quot;Roboto Slab&quot;[^;]*;/gi,
        ''
      );
      cleaned = cleaned.replace(/font-family:\s*"Roboto Slab"[^;]*;/gi, '');
      cleaned = cleaned.replace(/font-family:\s*'Roboto Slab'[^;]*;/gi, '');
      cleaned = cleaned.replace(
        /list-style-position:\s*inside/gi,
        'list-style-position: outside'
      );
      return cleaned;
    });

    const termsContent = `
      <div style="font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;">
        <style>
          .terms-content * {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .terms-content ul {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .terms-content ol {
            list-style-position: outside !important;
            padding-left: 2em !important;
            margin: 1em 0 !important;
          }
          .terms-content li {
            display: list-item !important;
            padding-left: 0.5em !important;
            line-height: 1.6 !important;
          }
          .terms-content h1, .terms-content h2, .terms-content h3,
          .terms-content h4, .terms-content h5, .terms-content h6 {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
          .terms-content p {
            font-family: 'BC Sans', 'Noto Sans', Verdana, sans-serif !important;
          }
        </style>
        <div class="terms-content">
          ${cleanedSections.join('\n')}
        </div>
      </div>
    `;

    return [
      {
        label: 'Complete',
        content: termsContent,
        complete: false,
        renderSignOffButtons: true,
      },
    ];
  }

  // ============================================
  // Utility: Get All Leaf Items (flatten nested structure)
  // ============================================

  static getAllLeafItems(items: EFPSectionItem[]): EFPSectionItem[] {
    const leafItems: EFPSectionItem[] = [];

    const collect = (itemList: EFPSectionItem[]) => {
      for (const item of itemList) {
        if ('items' in item && Array.isArray(item.items) && item.items.length > 0) {
          collect(item.items);
        } else {
          leafItems.push(item);
        }
      }
    };

    collect(items);
    return leafItems;
  }
}
