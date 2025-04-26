export interface ProcessDocumentJobData {
  filePath: string;
  content: string;
  repositoryId: number;
}

// Define the return type of the repository job
export interface RepoJobReturnValue {
  success: boolean;
  fileCount: number;
  documentsToProcess: ProcessDocumentJobData[];
}
