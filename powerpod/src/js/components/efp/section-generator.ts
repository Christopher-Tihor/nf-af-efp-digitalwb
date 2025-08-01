import { EFPSectionItem } from './types';
import { EFPTextUtils } from './text-utils';
import { EFPLogger } from './logger';

// Utility class for section generation
export class EFPSectionGenerator {
  static generateSectionBItems(nestedChapterStructure: any[]): EFPSectionItem[] {
    if (!nestedChapterStructure || nestedChapterStructure.length === 0) {
      EFPLogger.log('SectionGenerator: No nested chapter structure available, showing loading message');
      return [
        {
          label: 'Loading Chapters...',
          content: `
            <h3>Loading Environmental Farm Plan Chapters</h3>
            <p>Please wait while we load the questionnaire chapters and questions...</p>
          `,
          complete: false,
        }
      ];
    }

    const items: EFPSectionItem[] = [];

    nestedChapterStructure.forEach((chapter: any) => {
      // Extract chapter number from the main chapter
      const chapterNumber = Math.floor(chapter.order || 0);

      // Create the main chapter container (collapsible parent)
      const chapterItem: EFPSectionItem = {
        label: `Chapter ${chapterNumber}`,
        title: `Chapter ${chapterNumber}`,
        content: '', // No content for the parent container
        complete: false,
        isContainer: true, // Mark as container only
        items: []
      };

      // Add all subchapters as direct clickable items under the main chapter
      if (chapter.subchapters && chapter.subchapters.length > 0) {
        chapter.subchapters.forEach((subchapter: any) => {
          // Add the subchapter as a clickable item
          const formattedSubchapterTitle = EFPTextUtils.formatChapterTitle(subchapter.name || subchapter.label);
          const subchapterItem: EFPSectionItem = {
            label: formattedSubchapterTitle,
            content: EFPSectionGenerator.renderSubchapterContent(subchapter),
            complete: false,
            subchapterData: subchapter,
          };

          // If subchapter has sub-subchapters, add them as nested items
          if (subchapter.subchapters && subchapter.subchapters.length > 0) {
            subchapterItem.items = subchapter.subchapters.map((subSubchapter: any) => {
              // Format sub-subchapter title (remove "CHAPTER X.Y" prefix, keep just the descriptive part)
              let subSubLabel = subSubchapter.name || subSubchapter.label;
              // Remove chapter prefix if it exists (e.g., "CHAPTER 7.11 Plant Biodiversity" -> "Plant Biodiversity")
              subSubLabel = subSubLabel.replace(/^CHAPTER\s+\d+\.\d+\s+/i, '');
              const formattedSubSubTitle = EFPTextUtils.formatChapterTitle(subSubLabel);

              return {
                label: formattedSubSubTitle,
                content: EFPSectionGenerator.renderSubchapterContent(subSubchapter),
                complete: false,
                subchapterData: subSubchapter,
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
        const formattedTitle = EFPTextUtils.formatChapterTitle(chapter.name || chapter.label);
        chapterItem.items!.push({
          label: formattedTitle,
          content: EFPSectionGenerator.renderChapterContent(chapter),
          complete: false,
          chapterData: chapter
        });
      }

      items.push(chapterItem);
    });

    return items;
  }

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
    const formattedTitle = EFPTextUtils.formatChapterTitle(chapter.name);
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
