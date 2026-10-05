import { aiService, buildProjectContext } from './aiService';
import { Project, ProjectTask, EvidenceAttachment } from '../types/lyner';

export { aiService, buildProjectContext };

export const checkAIStatus = () => aiService.getStatus();
export const sendDiscoveryTurn = aiService.sendDiscoveryTurn;
export const synthesizeProjectFromDiscovery =
  aiService.synthesizeProjectFromDiscovery;
export const updateDnaWithLyner = aiService.updateProjectDNA;
export const verifyTaskSubmission = (params: {
  task: ProjectTask;
  submission: {
    submittedBy: string;
    role: string;
    whatDidYouDo: string;
    howDidYouImplement: string;
    whatWasResult: string;
    evidence: EvidenceAttachment[];
  };
  project: Project;
}) => aiService.analyzeSubmission(params);
export const generateTasksFromDNA = (params: { project: Project }) =>
  aiService.generateTasks(params.project);
export const sendChatToLyner = aiService.sendMessage;
