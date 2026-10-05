export type MascotState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'CURIOUS'
  | 'HELPING'
  | 'EXPLAINING'
  | 'CONCERNED'
  | 'CELEBRATING';

export type InteractionType =
  | 'TEXT'
  | 'CHOICES'
  | 'MULTI_CHOICE'
  | 'CONFIRMATION'
  | 'REFLECTION';

export type UnderstandingStage =
  | 'IDEA'
  | 'UNDERSTANDING'
  | 'DIRECTION'
  | 'DNA';

export type EpistemicState =
  | 'CONFIRMED'
  | 'LIKELY'
  | 'ASSUMPTION'
  | 'OPEN'
  | 'NEEDS_VERIFICATION';

export type VerificationStatus =
  | 'AWAITING_SUBMISSION'
  | 'VERIFIED'
  | 'NEEDS_MORE_EVIDENCE'
  | 'UNABLE_TO_VERIFY';

export type ProjectViewTab =
  | 'overview'
  | 'dna'
  | 'chat'
  | 'tasks'
  | 'pulse'
  | 'files'
  | 'members'
  | 'settings';

/**
 * Internal structured understanding maintained by Lyner during New Project discovery
 */
export interface ProjectUnderstanding {
  idea: string;
  motivation: string;
  problem: string;
  users: string;
  desired_outcome: string;
  proposed_solution: string;
  important_features: string[];
  constraints: string[];
  assumptions: string[];
  decisions: string[];
  uncertainties: string[];
  missing_information: string[];
}

export interface DiscoveryReflectionSummary {
  projectNameSuggested: string;
  tagline: string;
  summaryParagraphs: string[];
  undecidedItems: string[];
}

export interface DiscoveryMessage {
  id: string;
  role: 'lyner' | 'user';
  content: string;
  mascotState?: MascotState;
  intent?:
    | 'question'
    | 'clarification'
    | 'reflection'
    | 'contradiction'
    | 'synthesis_ready';
  contradictionAlert?: string;
  reflectionSummary?: DiscoveryReflectionSummary;
  timestamp: string;
}

export interface DiscoveryTurnResponse {
  message: string;
  intent:
    | 'question'
    | 'clarification'
    | 'reflection'
    | 'contradiction'
    | 'synthesis_ready';
  mascotState: MascotState;
  understandingStage: UnderstandingStage;
  interactionType: InteractionType;
  options?: string[];
  placeholder?: string;
  contradictionAlert?: string;
  readyForReflection: boolean;
  reflectionSummary?: DiscoveryReflectionSummary;
  understandingUpdate: ProjectUnderstanding;
  suggestedNextStep?: string;
}

/**
 * Simple, human-readable Project DNA section.
 * Designed to read like a clear project brief / project constitution,
 * adapting its headings to the nature of the project.
 */
export interface DNASection {
  id: string;
  heading: string;
  questionSubtitle?: string;
  body: string;
  bullets?: string[];
  epistemicNote?: string;
}

/**
 * Proposed DNA Change returned by Lyner when conversation or work suggests
 * a meaningful update to Project DNA (supports Accept / Reject / Edit).
 */
export interface ProposedDNAChange {
  id: string;
  sectionHeading: string;
  proposedBody: string;
  proposedBullets?: string[];
  reason: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'edited';
}

export type TaskDiscipline =
  | 'Hardware'
  | 'Software'
  | 'Validation'
  | 'Research'
  | 'Design'
  | 'General';

export interface EvidenceAttachment {
  id: string;
  type: 'file' | 'link' | 'image' | 'code';
  label: string;
  detail: string;
}

export interface TaskSubmission {
  id: string;
  submittedBy: string;
  role: string;
  whatDidYouDo: string;
  howDidYouImplement: string;
  whatWasResult: string;
  evidence: EvidenceAttachment[];
  submittedAt: string;
  evaluationStatus: VerificationStatus;
  lynerFeedback: string;
  missingEvidence?: string[];
  projectImpact?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  goal: string;
  discipline: TaskDiscipline;
  assigneeName: string;
  assigneeRole: string;
  status: VerificationStatus;
  verificationEvaluation: string;
  dnaOutcomeSummary?: string;
  submissions: TaskSubmission[];
}

export type PulseEventType =
  | 'verified_outcome'
  | 'direction_changed'
  | 'open_question'
  | 'decision_confirmed'
  | 'task_milestone';

export interface PulseEventItem {
  id: string;
  type: PulseEventType;
  symbol: '✓' | '→' | '!' | '◆' | '↗';
  headline: string;
  whatChanged: string;
  whyItMatters: string;
  whenItHappened: string;
  whereItCameFrom: string;
  actor?: string;
  linkedSource?: {
    tab: ProjectViewTab;
    label: string;
    targetId?: string;
  };
}

export interface ChatReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatThreadReply {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

export interface ChatMessageItem {
  id: string;
  senderType: 'user' | 'teammate' | 'lyner';
  senderName: string;
  senderRole?: string;
  avatarColor?: string;
  content: string;
  timestamp: string;
  mascotState?: MascotState;
  replyTo?: {
    id: string;
    senderName: string;
    preview: string;
  };
  reactions?: ChatReaction[];
  threadReplies?: ChatThreadReply[];
  attachments?: {
    type: 'file' | 'link' | 'task';
    label: string;
    targetId?: string;
  }[];
  contradictionDetected?: {
    earlierStatement: string;
    conflictingStatement: string;
    question: string;
    resolutionOptions: string[];
    resolvedWith?: string;
  };
  tradeoffComparison?: {
    topic: string;
    optionA: {
      name: string;
      summary: string;
      bestWhen: string;
    };
    optionB: {
      name: string;
      summary: string;
      bestWhen: string;
    };
    recommendation?: string;
    resolvedOption?: string;
  };
  proposedDnaChange?: ProposedDNAChange;
  nextAction?:
    | 'none'
    | 'ask_question'
    | 'suggest_decision'
    | 'update_dna'
    | 'create_task';
  confidence?: 'high' | 'medium' | 'low';
  knowledgeImpact?: {
    target?: 'DNA' | 'Project DNA' | 'Tasks' | 'Pulse';
    surface?: 'DNA' | 'Project DNA' | 'Tasks' | 'Pulse';
    summary: string;
    linkedTab?: ProjectViewTab;
  };
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  summary: string;
  linkedSectionHeading: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  focus: string;
  isAI?: boolean;
}

export interface ReEntryContext {
  greeting: string;
  lastTimeSummary: string;
  focusStatement: string;
  targetView: ProjectViewTab;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  currentDirection: string;
  rightNowFocus: string;
  recentlySummary?: string;
  openQuestionHighlight?: string;
  nextActionPrompt: string;
  reEntryContext: ReEntryContext;
  createdAt: string;
  understanding: ProjectUnderstanding;
  dna: DNASection[];
  tasks: ProjectTask[];
  pulse: PulseEventItem[];
  chat: ChatMessageItem[];
  files: ProjectFile[];
  members: ProjectMember[];
}

/**
 * Structured Project Context sent to Featherless AI via aiService
 */
export interface StructuredProjectContext {
  project: {
    name: string;
    description: string;
    type: string;
  };
  dna: {
    problem: string;
    goal: string;
    targetUsers: string;
    solution: string;
    features: string[];
    currentDirection: string;
    decisions: string[];
    deliverables: string[];
    openQuestions: string[];
    constraints: string[];
    allSections: { heading: string; body: string; bullets?: string[] }[];
  };
  team: {
    name: string;
    role: string;
    focus: string;
  }[];
  tasks: {
    id: string;
    title: string;
    goal: string;
    assigneeName: string;
    assigneeRole: string;
    status: VerificationStatus;
    dnaOutcomeSummary?: string;
  }[];
  recentPulse: {
    headline: string;
    whatChanged: string;
    whyItMatters: string;
    whenItHappened: string;
  }[];
  recentConversation: {
    senderName: string;
    senderRole?: string;
    content: string;
    timestamp: string;
  }[];
  currentUser: {
    name: string;
    role: string;
  };
}

export interface AIProviderStatus {
  provider: 'featherless';
  connected: boolean;
  activeModel: string | null;
  activeModelFamily: 'DeepSeek' | 'Kimi' | 'GLM' | 'Custom' | null;
  availableModels: {
    family: 'DeepSeek' | 'Kimi' | 'GLM' | 'Default';
    modelId: string;
    configured: boolean;
  }[];
  baseUrl: string;
  missingVariables: string[];
  message: string;
}
