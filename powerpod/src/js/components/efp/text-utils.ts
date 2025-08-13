// Utility class for text formatting
export class EFPTextUtils {
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
    const titleCase = cleanName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

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

  static capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
