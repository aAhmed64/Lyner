import {
  AIProviderStatus,
  DiscoveryMessage,
  DiscoveryTurnResponse,
  ProjectUnderstanding,
  Project,
  ProjectTask,
  EvidenceAttachment,
  MascotState,
  DNASection,
  VerificationStatus,
  PulseEventType,
  ProjectViewTab,
  TaskDiscipline,
  StructuredProjectContext,
  ProposedDNAChange,
} from '../types/lyner';

/**
 * Intelligent Project Context Builder (Section 6 & 15)
 * Extracts essential project understanding, DNA, team roles, tasks,
 * recent Pulse, and recent conversation without sending bloated history.
 */
export function buildProjectContext(
  project: Project,
  currentUserName = 'Ahmed'
): StructuredProjectContext {
  const findDnaSection = (keyword: string) =>
    project.dna.find((s) => s.heading.toUpperCase().includes(keyword));

  const problemSec = findDnaSection('PROBLEM');
  const goalSec = findDnaSection('GOAL');
  const usersSec = findDnaSection('USER');
  const solutionSec = findDnaSection('SOLUTION');
  const areasSec = findDnaSection('AREA') || findDnaSection('FEATURE');
  const decisionsSec = findDnaSection('DECISION');
  const deliverablesSec = findDnaSection('DELIVERABLE');
  const openSec = findDnaSection('OPEN') || findDnaSection('QUESTION');

  const currentMember = project.members.find(
    (m) => m.name.toLowerCase() === currentUserName.toLowerCase()
  ) || {
    name: currentUserName,
    role: 'Team Member',
  };

  return {
    project: {
      name: project.name,
      description: project.summary,
      type: 'School Group Project / Collaborative Project',
    },
    dna: {
      problem: problemSec?.body || project.understanding.problem || '',
      goal: goalSec?.body || project.understanding.desired_outcome || '',
      targetUsers: usersSec?.body || project.understanding.users || '',
      solution:
        solutionSec?.body || project.understanding.proposed_solution || '',
      features:
        areasSec?.bullets || project.understanding.important_features || [],
      currentDirection: project.currentDirection,
      decisions:
        decisionsSec?.bullets || project.understanding.decisions || [],
      deliverables: deliverablesSec?.bullets || [],
      openQuestions:
        openSec?.bullets || project.understanding.uncertainties || [],
      constraints: project.understanding.constraints || [],
      allSections: project.dna.map((s) => ({
        heading: s.heading,
        body: s.body,
        bullets: s.bullets,
      })),
    },
    team: project.members
      .filter((m) => !m.isAI)
      .map((m) => ({
        name: m.name,
        role: m.role,
        focus: m.focus,
      })),
    tasks: project.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      goal: t.goal,
      assigneeName: t.assigneeName,
      assigneeRole: t.assigneeRole,
      status: t.status,
      dnaOutcomeSummary: t.dnaOutcomeSummary,
    })),
    recentPulse: project.pulse.slice(0, 6).map((p) => ({
      headline: p.headline,
      whatChanged: p.whatChanged,
      whyItMatters: p.whyItMatters,
      whenItHappened: p.whenItHappened,
    })),
    recentConversation: project.chat.slice(-10).map((c) => ({
      senderName: c.senderName,
      senderRole: c.senderRole,
      content: c.content,
      timestamp: c.timestamp,
    })),
    currentUser: {
      name: currentMember.name,
      role: currentMember.role,
    },
  };
}

async function handleApiResponse<T>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error || "Lyner couldn't respond right now. Try again in a moment."
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Centralized Lyner AI Service (Section 3)
 * All AI interactions flow through this service layer to the secure server-side Featherless proxy.
 */
export const aiService = {
  /**
   * Check Featherless AI connection & model configuration status
   */
  async getStatus(): Promise<AIProviderStatus> {
    const res = await fetch('/api/lyner/ai-status');
    return handleApiResponse<AIProviderStatus>(
      res,
      'Unable to check AI provider status.'
    );
  },

  /**
   * Switch active Featherless model (e.g. DeepSeek, Kimi, GLM)
   */
  async setActiveModel(modelId: string): Promise<AIProviderStatus> {
    const res = await fetch('/api/lyner/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId }),
    });
    return handleApiResponse<AIProviderStatus>(
      res,
      'Unable to update active Featherless model.'
    );
  },

  /**
   * 1. sendMessage() — Context-aware Team Chat & New Project Discovery Turns
   */
  async sendMessage(params: {
    message: string;
    senderName: string;
    project: Project;
    forceLyner?: boolean;
  }): Promise<{
    shouldRespond: boolean;
    reply?: string;
    mascotState?: MascotState;
    nextAction?:
      | 'none'
      | 'ask_question'
      | 'suggest_decision'
      | 'update_dna'
      | 'create_task';
    understanding?: string;
    openQuestions?: string[];
    confidence?: 'high' | 'medium' | 'low';
    proposedDnaChange?: ProposedDNAChange;
    teammateReply?: {
      senderName: string;
      senderRole: string;
      avatarColor: string;
      content: string;
    };
    contradictionDetected?: {
      earlierStatement: string;
      conflictingStatement: string;
      question: string;
      resolutionOptions: string[];
    };
    tradeoffComparison?: {
      topic: string;
      optionA: { name: string; summary: string; bestWhen: string };
      optionB: { name: string; summary: string; bestWhen: string };
    };
    knowledgeImpact?: {
      target: 'Project DNA' | 'Tasks' | 'Pulse';
      summary: string;
      linkedTab?: ProjectViewTab;
    };
  }> {
    const projectContext = buildProjectContext(
      params.project,
      params.senderName
    );
    const res = await fetch('/api/lyner/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        senderName: params.senderName,
        projectContext,
        forceLyner: params.forceLyner,
      }),
    });
    return handleApiResponse(
      res,
      "Lyner couldn't respond right now. Try again in a moment."
    );
  },

  /**
   * Discovery conversation turn for New Project flow
   */
  async sendDiscoveryTurn(params: {
    userMessage: string;
    understanding: ProjectUnderstanding;
    history: DiscoveryMessage[];
    forceReflection?: boolean;
  }): Promise<DiscoveryTurnResponse> {
    const res = await fetch('/api/lyner/discovery-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: params.userMessage,
        understanding: params.understanding,
        history: params.history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        forceReflection: params.forceReflection,
      }),
    });
    return handleApiResponse<DiscoveryTurnResponse>(
      res,
      "Lyner couldn't respond right now. Try again in a moment."
    );
  },

  /**
   * 2. analyzeProject() — Dynamic Overview Insights & Contextual Mascot Guidance
   */
  async analyzeProject(project: Project, currentUserName = 'Ahmed'): Promise<{
    mascotMessage: string;
    mascotState: MascotState;
    currentStageSummary: string;
    whatNeedsAttention: string;
    nextRecommendedAction: string;
    currentDirectionSummary: string;
  }> {
    const projectContext = buildProjectContext(project, currentUserName);
    const res = await fetch('/api/lyner/analyze-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectContext }),
    });
    return handleApiResponse(
      res,
      "Lyner couldn't analyze the project overview right now. Try again in a moment."
    );
  },

  /**
   * 3. updateProjectDNA() — Update or Synthesize Project DNA
   */
  async updateProjectDNA(params: {
    project: Project;
    instruction: string;
    forceApplyDespiteContradiction?: boolean;
  }): Promise<{
    hasContradiction: boolean;
    lynerMessage: string;
    mascotState: MascotState;
    contradictionDetails?: {
      earlierStatement: string;
      newStatement: string;
      question: string;
    };
    updatedSummary?: string;
    updatedDirection?: string;
    updatedDna?: DNASection[];
    pulseEvent?: {
      type: PulseEventType;
      symbol: '✓' | '→' | '!' | '◆' | '↗';
      headline: string;
      whatChanged: string;
      whyItMatters: string;
    };
  }> {
    const projectContext = buildProjectContext(params.project);
    const res = await fetch('/api/lyner/update-dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectContext,
        currentDna: params.project.dna,
        instruction: params.instruction,
        forceApplyDespiteContradiction: params.forceApplyDespiteContradiction,
      }),
    });
    return handleApiResponse(
      res,
      "Lyner couldn't update the Project DNA right now. Try again in a moment."
    );
  },

  /**
   * Synthesize initial Project DNA from New Project discovery
   */
  async synthesizeProjectFromDiscovery(params: {
    understanding: ProjectUnderstanding;
    history: DiscoveryMessage[];
    customProjectName?: string;
  }): Promise<{
    name: string;
    summary: string;
    currentDirection: string;
    rightNowFocus: string;
    nextActionPrompt: string;
    dna: DNASection[];
    tasks: {
      title: string;
      goal: string;
      discipline: TaskDiscipline;
      assigneeName: string;
      assigneeRole: string;
    }[];
  }> {
    const res = await fetch('/api/lyner/synthesize-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        understanding: params.understanding,
        history: params.history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        customProjectName: params.customProjectName,
      }),
    });
    return handleApiResponse(
      res,
      "Lyner couldn't synthesize the Project DNA right now. Try again in a moment."
    );
  },

  /**
   * 4. generateTasks() — Generate meaningful tasks from Project DNA
   */
  async generateTasks(project: Project): Promise<{
    generatedTasks: {
      title: string;
      goal: string;
      discipline: TaskDiscipline;
      assigneeName: string;
      assigneeRole: string;
    }[];
  }> {
    const projectContext = buildProjectContext(project);
    const res = await fetch('/api/lyner/generate-tasks-from-dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectContext }),
    });
    return handleApiResponse(
      res,
      "Lyner couldn't generate tasks right now. Try again in a moment."
    );
  },

  /**
   * 5. analyzeSubmission() — Evaluate & verify task submissions with real AI
   */
  async analyzeSubmission(params: {
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
  }): Promise<{
    status: 'verified' | 'needs_evidence' | 'unable_to_verify';
    evaluationStatus: VerificationStatus;
    reason: string;
    lynerFeedback: string;
    missingEvidence: string[];
    projectImpact: string;
    dnaUpdateSuggested: boolean;
    verifiedDecisionBullet?: string;
    pulseEvent?: {
      type: PulseEventType;
      symbol: '✓' | '→' | '!' | '◆' | '↗';
      headline: string;
      whatChanged: string;
      whyItMatters: string;
      whereItCameFrom: string;
    };
  }> {
    const projectContext = buildProjectContext(
      params.project,
      params.submission.submittedBy
    );
    const res = await fetch('/api/lyner/verify-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: {
          title: params.task.title,
          goal: params.task.goal,
          discipline: params.task.discipline,
          assigneeName: params.task.assigneeName,
          assigneeRole: params.task.assigneeRole,
        },
        submission: params.submission,
        projectContext,
      }),
    });
    return handleApiResponse(
      res,
      "Lyner couldn't verify this submission right now. Try again in a moment."
    );
  },

  /**
   * 6. generatePulse() — Generate meaningful Pulse entry when project understanding shifts
   */
  async generatePulse(params: {
    eventDescription: string;
    source: string;
    project: Project;
  }): Promise<{
    isMeaningful: boolean;
    type: PulseEventType;
    symbol: '✓' | '→' | '!' | '◆' | '↗';
    title: string;
    whatChanged: string;
    whyItMatters: string;
    source: string;
    timestamp: string;
  }> {
    const projectContext = buildProjectContext(params.project);
    const res = await fetch('/api/lyner/generate-pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventDescription: params.eventDescription,
        source: params.source,
        projectContext,
      }),
    });
    return handleApiResponse(
      res,
      "Lyner couldn't generate a Pulse update right now. Try again in a moment."
    );
  },
};
