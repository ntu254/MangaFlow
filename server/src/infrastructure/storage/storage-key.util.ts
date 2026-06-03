/**
 * Generates standardized keys (paths) for files in storage.
 */
export const storageKeyUtil = {
  generateSeriesCoverKey(seriesId: string, fileName: string): string {
    return `series/${seriesId}/cover/${fileName}`;
  },

  generateManuscriptKey(seriesId: string, version: number, fileName: string): string {
    return `series/${seriesId}/manuscripts/v${version}/${fileName}`;
  },

  generateChapterPageKey(chapterId: string, version: number, fileName: string): string {
    return `chapters/${chapterId}/pages/v${version}/${fileName}`;
  },

  generateTaskSubmissionKey(taskId: string, version: number, fileName: string): string {
    return `tasks/${taskId}/submissions/v${version}/${fileName}`;
  },

  generateAiOutputPageKey(pageId: string, fileName: string): string {
    return `ai-output/pages/${pageId}/${fileName}`;
  }
};
