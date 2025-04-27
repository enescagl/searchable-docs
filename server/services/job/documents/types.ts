export interface ProcessDocumentJobData {
  filePath: string;
  content: string;
  repositoryId: number;
}

export interface RepoJobReturnValue {
  success: boolean;
  fileCount: number;
  documentsToProcess: ProcessDocumentJobData[];
}
