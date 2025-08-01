// Utility class for text formatting
export class EFPTextUtils {
  static formatChapterTitle(chapterName: string): string {
    // Transform "CHAPTER 2 BUILDINGS AND ROADS" to "Chapter 2: Buildings and Roads"
    // Transform "PLANT BIODIVERSITY" to "Plant Biodiversity"
    if (!chapterName) return '';

    // Convert to title case and handle the chapter format
    const titleCase = chapterName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

    // If it starts with "Chapter" and has a number, add a colon after the number
    const chapterMatch = titleCase.match(/^Chapter (\d+(?:\.\d+)?) (.+)$/);
    if (chapterMatch) {
      const [, chapterNum, chapterTitle] = chapterMatch;
      return `Chapter ${chapterNum}: ${chapterTitle}`;
    }

    return titleCase;
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
