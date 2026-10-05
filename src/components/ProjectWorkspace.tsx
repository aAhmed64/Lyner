import React, { useState } from 'react';
import {
  Project,
  DNASection,
  MascotState,
  ProjectTask,
  EvidenceAttachment,
  PulseEventItem,
  ProjectViewTab,
  ChatMessageItem,
} from '../types/lyner';
import {
  Mascot,
  VerificationState,
  ChatMessage,
  BackButton,
} from './ui/LynerUI';
import {
  updateDnaWithLyner,
  verifyTaskSubmission,
  generateTasksFromDNA,
  sendChatToLyner,
  aiService,
} from '../services/lynerApi';
import {
  ArrowRight,
  Send,
  Sparkles,
  Check,
  FileText,
  Code2,
  Dna,
  CheckSquare,
  ChevronRight,
  Link2,
  Image as ImageIcon,
  AtSign,
  X,
  AlertTriangle,
  Edit3,
  Loader2,
  HelpCircle,
  MessageSquare,
  Activity,
  Eye,
} from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  activeTab: ProjectViewTab;
  onSelectTab: (tab: ProjectViewTab) => void;
  onUpdateProject: (updated: Project) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  activeTab,
  onSelectTab,
  onUpdateProject,
}) => {
  // Deep-link state for Tasks
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Overview Interactive Journey Stage Selection
  const [activeJourneyStageIdx, setActiveJourneyStageIdx] = useState<number>(2);

  // Project DNA interaction states (Read-Only by default!)
  const [isEditingDnaManually, setIsEditingDnaManually] = useState(false);
  const [showAskLynerDnaBar, setShowAskLynerDnaBar] = useState(false);
  const [dnaInstruction, setDnaInstruction] = useState('');
  const [isUpdatingDna, setIsUpdatingDna] = useState(false);
  const [highlightedDnaSectionId, setHighlightedDnaSectionId] = useState<
    string | null
  >(null);
  const [dnaFeedback, setDnaFeedback] = useState<{
    message: string;
    mascotState: MascotState;
    hasContradiction?: boolean;
    contradictionDetails?: {
      earlierStatement: string;
      newStatement: string;
      question: string;
    };
    pendingInstruction?: string;
  } | null>(null);
  const [manualDnaDraft, setManualDnaDraft] = useState<DNASection[]>(
    project.dna
  );

  // Tasks Filter & Submission Form State
  const [memberFilter, setMemberFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'OPEN' | 'VERIFIED'
  >('ALL');
  const [subWhatDidYouDo, setSubWhatDidYouDo] = useState('');
  const [subHowImplemented, setSubHowImplemented] = useState('');
  const [subWhatResult, setSubWhatResult] = useState('');
  const [subEvidence, setSubEvidence] = useState<EvidenceAttachment[]>([]);
  const [evidenceDraftType, setEvidenceDraftType] = useState<
    'file' | 'link' | 'image' | 'code' | null
  >(null);
  const [evidenceDraftLabel, setEvidenceDraftLabel] = useState('');
  const [evidenceDraftDetail, setEvidenceDraftDetail] = useState('');
  const [isVerifyingSubmission, setIsVerifyingSubmission] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  // Pulse Filter State
  const [pulseFilter, setPulseFilter] = useState<
    'ALL' | 'VERIFIED' | 'DECISIONS' | 'OPEN'
  >('ALL');

  // Files Interactive Preview State
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    project.files[0]?.id || null
  );

  // Chat State
  const humanMembers = project.members.filter((m) => !m.isAI);
  const [chatInput, setChatInput] = useState('');
  const [activeChatSender, setActiveChatSender] = useState<string>(
    humanMembers[0]?.name || 'Ahmed'
  );
  const [replyingToMessage, setReplyingToMessage] =
    useState<ChatMessageItem | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{
    type: 'file' | 'link' | 'task';
    label: string;
    targetId?: string;
  } | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Error banner for API calls
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isAnalyzingOverview, setIsAnalyzingOverview] = useState(false);
  const [liveOverviewInsight, setLiveOverviewInsight] = useState<{
    mascotMessage: string;
    mascotState: MascotState;
    currentStageSummary: string;
    whatNeedsAttention: string;
    nextRecommendedAction: string;
    currentDirectionSummary: string;
  } | null>(null);

  const handleRefreshOverviewWithAI = async () => {
    if (isAnalyzingOverview) return;
    setWorkspaceError(null);
    setIsAnalyzingOverview(true);
    try {
      const insight = await aiService.analyzeProject(project, activeChatSender);
      setLiveOverviewInsight(insight);
    } catch (err: any) {
      setWorkspaceError(
        err?.message || "Lyner couldn't respond right now. Try again in a moment."
      );
    } finally {
      setIsAnalyzingOverview(false);
    }
  };

  const navigateToSurface = (tab: ProjectViewTab, targetId?: string) => {
    if (tab === 'tasks' && targetId) {
      setSelectedTaskId(targetId);
    }
    onSelectTab(tab);
  };

  /* ==================================================================
     DNA UPDATE HANDLERS ("Ask Lyner to change this" & "Edit DNA")
     ================================================================== */
  const handleAskLynerToUpdateDna = async (
    overrideInstruction?: string,
    forceApplyDespiteContradiction = false
  ) => {
    const instructionToRun = (overrideInstruction ?? dnaInstruction).trim();
    if (!instructionToRun || isUpdatingDna) return;

    setWorkspaceError(null);
    setIsUpdatingDna(true);

    try {
      const result = await updateDnaWithLyner({
        project,
        instruction: instructionToRun,
        forceApplyDespiteContradiction,
      });

      if (result.hasContradiction && !forceApplyDespiteContradiction) {
        setDnaFeedback({
          message: result.lynerMessage,
          mascotState: 'CONCERNED',
          hasContradiction: true,
          contradictionDetails: result.contradictionDetails,
          pendingInstruction: instructionToRun,
        });
        return;
      }

      const newPulse: PulseEventItem | null = result.pulseEvent
        ? {
            id: `pulse-${Date.now()}`,
            type: result.pulseEvent.type,
            symbol: result.pulseEvent.symbol,
            headline: result.pulseEvent.headline,
            whatChanged: result.pulseEvent.whatChanged,
            whyItMatters: result.pulseEvent.whyItMatters,
            whenItHappened: 'Just now',
            whereItCameFrom: 'Updated via Project DNA with Lyner',
            actor: 'Team & Lyner',
            linkedSource: {
              tab: 'dna',
              label: 'Read Project DNA',
            },
          }
        : null;

      onUpdateProject({
        ...project,
        summary: result.updatedSummary || project.summary,
        currentDirection:
          result.updatedDirection || project.currentDirection,
        dna: result.updatedDna || project.dna,
        pulse: newPulse ? [newPulse, ...project.pulse] : project.pulse,
      });

      setDnaFeedback({
        message: result.lynerMessage,
        mascotState: result.mascotState || 'CELEBRATING',
        hasContradiction: false,
      });
      setDnaInstruction('');
    } catch (err: any) {
      setWorkspaceError(
        err?.message ||
          "Lyner couldn't respond right now. Try again in a moment."
      );
    } finally {
      setIsUpdatingDna(false);
    }
  };

  const handleSaveManualDnaEdit = () => {
    const cleaned = manualDnaDraft.filter(
      (sec) => sec.heading.trim() && sec.body.trim()
    );
    const pulseEntry: PulseEventItem = {
      id: `pulse-${Date.now()}`,
      type: 'decision_confirmed',
      symbol: '◆',
      headline: '◆ Project DNA edited directly',
      whatChanged: 'Updated sections in the Project DNA brief.',
      whyItMatters:
        'Keeps the shared project brief accurate for the entire team.',
      whenItHappened: 'Just now',
      whereItCameFrom: 'Direct DNA Edit',
      actor: 'Team',
      linkedSource: {
        tab: 'dna',
        label: 'Read Project DNA',
      },
    };

    onUpdateProject({
      ...project,
      dna: cleaned,
      pulse: [pulseEntry, ...project.pulse],
    });
    setIsEditingDnaManually(false);
  };

  /* ==================================================================
     TASK SUBMISSION & VERIFICATION HANDLERS
     ================================================================== */
  const activeTask: ProjectTask | undefined = project.tasks.find(
    (t) => t.id === selectedTaskId
  );

  const handleAddEvidenceChip = () => {
    if (!evidenceDraftType || !evidenceDraftLabel.trim()) return;
    const item: EvidenceAttachment = {
      id: `ev-${Date.now()}`,
      type: evidenceDraftType,
      label: evidenceDraftLabel.trim(),
      detail:
        evidenceDraftDetail.trim() ||
        `Attached ${evidenceDraftType} verification artifact`,
    };
    setSubEvidence((prev) => [...prev, item]);
    setEvidenceDraftType(null);
    setEvidenceDraftLabel('');
    setEvidenceDraftDetail('');
  };

  const handlePrefillVerifiedSubmissionExample = () => {
    if (!activeTask) return;
    const lowerTitle = activeTask.title.toLowerCase();

    if (lowerTitle.includes('label')) {
      setSubWhatDidYouDo(
        'Created two versions of the Paper, Plastic, and General Waste labels — Version A with simple icons and Version B showing real school items (water bottles, juice cups, notebook paper).'
      );
      setSubHowImplemented(
        'Designed high-contrast color-coded signs (Blue for Paper, Green for Plastic, Gray for General Waste) with large item illustrations at the top.'
      );
      setSubWhatResult(
        'Showed both versions to 10 students in the hallway: 9 out of 10 identified the right bin faster with Version B (example items).'
      );
      setSubEvidence([
        {
          id: 'ev-demo-img',
          type: 'image',
          label: 'recycling_labels_vA_vs_vB.png',
          detail:
            'Side-by-side comparison of Version A (icons) and Version B (real school item examples)',
        },
        {
          id: 'ev-demo-file',
          type: 'file',
          label: 'printable_station_signs.pdf',
          detail:
            'Print-ready signs for the 3-section recycling station prototype',
        },
      ]);
      return;
    }

    if (lowerTitle.includes('where') || lowerTitle.includes('decide')) {
      setSubWhatDidYouDo(
        'Mapped out the station locations: two full 3-section stations in the cafeteria and smaller paper + plastic stations outside the 1st and 2nd floor classrooms.'
      );
      setSubHowImplemented(
        'Walked through the school with Mariam’s survey results and checked where trash bins overflow the most after lunch and 3rd period.'
      );
      setSubWhatResult(
        'Location map finalized and approved by the school custodian for our 1-week prototype test.'
      );
      setSubEvidence([
        {
          id: 'ev-demo-map',
          type: 'image',
          label: 'school_hallway_bin_map.png',
          detail:
            'Floor plan showing cafeteria stations and classroom hallway bins',
        },
      ]);
      return;
    }

    if (lowerTitle.includes('test')) {
      setSubWhatDidYouDo(
        'Tested our first 3-section recycling station prototype during lunch and between classes with Salma’s example-item labels attached.'
      );
      setSubHowImplemented(
        'Checked the contents of the Paper, Plastic, and General Waste sections at the end of lunch and compared them against an old bin on the other side of the cafeteria.'
      );
      setSubWhatResult(
        'In our prototype station, 84% of plastic bottles and paper were sorted into the right section, compared to less than 25% in the old unlabeled bins.'
      );
      setSubEvidence([
        {
          id: 'ev-demo-photo',
          type: 'image',
          label: 'lunch_test_station_photo.jpg',
          detail:
            'Photo of students using the 3-section prototype station during lunch',
        },
        {
          id: 'ev-demo-notes',
          type: 'file',
          label: 'day1_sorting_count_sheet.pdf',
          detail:
            'Item count comparing separated recyclables vs. mixed trash',
        },
      ]);
      return;
    }

    setSubWhatDidYouDo(
      `Completed ${activeTask.title.toLowerCase()} with the team and documented our findings for GreenCycle.`
    );
    setSubHowImplemented(
      'Worked together after class to gather data, review the station setup, and organize the results.'
    );
    setSubWhatResult(
      'Everything is documented and ready for our final class presentation.'
    );
    setSubEvidence([
      {
        id: 'ev-demo-doc',
        type: 'file',
        label: 'greencycle_task_notes.pdf',
        detail: `Completed work and notes for: ${activeTask.title}`,
      },
      {
        id: 'ev-demo-img',
        type: 'image',
        label: 'project_progress_photo.jpg',
        detail: 'Photo documentation of the student team’s work',
      },
    ]);
  };

  const handlePrefillShallowExample = () => {
    setSubWhatDidYouDo('I finished it.');
    setSubHowImplemented('Did the work.');
    setSubWhatResult('It works.');
    setSubEvidence([]);
  };

  const handleSubmitTaskWork = async () => {
    if (!activeTask || !subWhatDidYouDo.trim() || isVerifyingSubmission) return;

    setWorkspaceError(null);
    setIsVerifyingSubmission(true);
    try {
      const result = await verifyTaskSubmission({
        task: activeTask,
        submission: {
          submittedBy: activeTask.assigneeName,
          role: activeTask.assigneeRole,
          whatDidYouDo: subWhatDidYouDo,
          howDidYouImplement: subHowImplemented,
          whatWasResult: subWhatResult,
          evidence: subEvidence,
        },
        project,
      });

      const newSubmission = {
        id: `sub-${Date.now()}`,
        submittedBy: activeTask.assigneeName,
        role: activeTask.assigneeRole,
        whatDidYouDo: subWhatDidYouDo,
        howDidYouImplement: subHowImplemented,
        whatWasResult: subWhatResult,
        evidence: subEvidence,
        submittedAt: 'Just now',
        evaluationStatus: result.evaluationStatus,
        lynerFeedback: result.lynerFeedback,
      };

      const updatedTasks: ProjectTask[] = project.tasks.map((t) =>
        t.id === activeTask.id
          ? {
              ...t,
              status: result.evaluationStatus,
              verificationEvaluation: result.lynerFeedback,
              dnaOutcomeSummary:
                result.verifiedDecisionBullet || t.dnaOutcomeSummary,
              submissions: [newSubmission, ...t.submissions],
            }
          : t
      );

      // If verified, append confirmed outcome to IMPORTANT DECISIONS in the Project DNA brief
      let updatedDna = [...project.dna];
      if (
        result.evaluationStatus === 'VERIFIED' &&
        result.verifiedDecisionBullet
      ) {
        const decisionsIdx = updatedDna.findIndex((s) =>
          s.heading.toUpperCase().includes('DECISION')
        );
        if (decisionsIdx >= 0) {
          const existing = updatedDna[decisionsIdx];
          updatedDna[decisionsIdx] = {
            ...existing,
            bullets: [
              result.verifiedDecisionBullet,
              ...(existing.bullets || []),
            ],
          };
        } else {
          updatedDna.push({
            id: `dna-decisions-${Date.now()}`,
            heading: 'IMPORTANT DECISIONS',
            questionSubtitle: 'Important decisions and verified milestones',
            body: 'Confirmed decisions and verified outcomes from team execution:',
            bullets: [result.verifiedDecisionBullet],
          });
        }
      }

      let updatedPulse = [...project.pulse];
      if (result.pulseEvent) {
        const newPulseItem: PulseEventItem = {
          id: `pulse-${Date.now()}`,
          type: result.pulseEvent.type,
          symbol: result.pulseEvent.symbol,
          headline: result.pulseEvent.headline,
          whatChanged: result.pulseEvent.whatChanged,
          whyItMatters: result.pulseEvent.whyItMatters,
          whenItHappened: 'Just now',
          whereItCameFrom: result.pulseEvent.whereItCameFrom,
          actor: `${activeTask.assigneeName} · Verified by Lyner`,
          linkedSource: {
            tab: 'dna',
            label: 'Read Updated Project DNA',
          },
        };
        updatedPulse = [newPulseItem, ...updatedPulse];
      }

      onUpdateProject({
        ...project,
        tasks: updatedTasks,
        dna: updatedDna,
        pulse: updatedPulse,
      });

      if (result.evaluationStatus === 'VERIFIED') {
        setSubWhatDidYouDo('');
        setSubHowImplemented('');
        setSubWhatResult('');
        setSubEvidence([]);
      }
    } catch (err: any) {
      setWorkspaceError(
        err?.message ||
          "Lyner couldn't respond right now. Try again in a moment."
      );
    } finally {
      setIsVerifyingSubmission(false);
    }
  };

  const handleGenerateMoreTasksFromDNA = async () => {
    if (isGeneratingTasks) return;
    setWorkspaceError(null);
    setIsGeneratingTasks(true);
    try {
      const result = await generateTasksFromDNA({ project });
      const created: ProjectTask[] = (result.generatedTasks || []).map(
        (gt, index) => ({
          id: `task-gen-${Date.now()}-${index}`,
          title: gt.title,
          goal: gt.goal,
          discipline: gt.discipline,
          assigneeName: gt.assigneeName,
          assigneeRole: gt.assigneeRole,
          status: 'AWAITING_SUBMISSION',
          verificationEvaluation:
            'Generated from Project DNA. Submit implementation details and evidence to verify.',
          submissions: [],
        })
      );

      if (created.length > 0) {
        const newPulse: PulseEventItem = {
          id: `pulse-${Date.now()}`,
          type: 'task_milestone',
          symbol: '↗',
          headline: `↗ ${created.length} new tasks generated from Project DNA`,
          whatChanged: created
            .map((c) => `${c.title} (${c.assigneeName})`)
            .join(' · '),
          whyItMatters:
            'Translates open questions and deliverables in Project DNA into clear student role responsibilities.',
          whenItHappened: 'Just now',
          whereItCameFrom: 'Generated from Project DNA by Lyner',
          actor: 'Lyner',
          linkedSource: {
            tab: 'tasks',
            label: 'View Tasks',
            targetId: created[0].id,
          },
        };

        onUpdateProject({
          ...project,
          tasks: [...project.tasks, ...created],
          pulse: [newPulse, ...project.pulse],
        });
      }
    } catch (err: any) {
      setWorkspaceError(
        err?.message ||
          "Lyner couldn't respond right now. Try again in a moment."
      );
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  /* ==================================================================
     CHAT HANDLERS (Context-Aware + Contradiction & Tradeoff Resolution)
     ================================================================== */
  const getSenderMeta = (name: string) => {
    const member = project.members.find((m) => m.name === name);
    if (member) {
      return { role: member.role, color: member.avatarColor };
    }
    return { role: 'Team Member', color: 'bg-indigo-600' };
  };

  const handleSendChat = async (
    overrideText?: string,
    forceLyner = false
  ) => {
    const content = (overrideText ?? chatInput).trim();
    if (!content || isChatLoading) return;

    setWorkspaceError(null);
    setChatInput('');
    setIsChatLoading(true);

    const senderMeta = getSenderMeta(activeChatSender);
    const newMsg: ChatMessageItem = {
      id: `chat-${Date.now()}`,
      senderType: 'teammate',
      senderName: activeChatSender,
      senderRole: senderMeta.role,
      avatarColor: senderMeta.color,
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      replyTo: replyingToMessage
        ? {
            id: replyingToMessage.id,
            senderName: replyingToMessage.senderName,
            preview: replyingToMessage.content.slice(0, 75),
          }
        : undefined,
      attachments: pendingAttachment ? [pendingAttachment] : undefined,
    };

    const updatedChatWithUser = [...project.chat, newMsg];
    setReplyingToMessage(null);
    setPendingAttachment(null);

    onUpdateProject({
      ...project,
      chat: updatedChatWithUser,
    });

    try {
      const response = await sendChatToLyner({
        message: content,
        senderName: activeChatSender,
        project: { ...project, chat: updatedChatWithUser },
        forceLyner,
      });

      if (!response.shouldRespond && response.teammateReply) {
        const replyMsg: ChatMessageItem = {
          id: `chat-${Date.now() + 1}`,
          senderType: 'teammate',
          senderName: response.teammateReply.senderName,
          senderRole: response.teammateReply.senderRole,
          avatarColor: response.teammateReply.avatarColor || 'bg-emerald-600',
          content: response.teammateReply.content,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        onUpdateProject({
          ...project,
          chat: [...updatedChatWithUser, replyMsg],
        });
      } else if (response.shouldRespond && response.reply) {
        const lynerMsg: ChatMessageItem = {
          id: `chat-${Date.now() + 2}`,
          senderType: 'lyner',
          senderName: 'Lyner',
          mascotState: response.mascotState || 'EXPLAINING',
          content: response.reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          proposedDnaChange: response.proposedDnaChange,
          nextAction: response.nextAction,
          confidence: response.confidence,
          contradictionDetected: response.contradictionDetected,
          tradeoffComparison: response.tradeoffComparison,
          knowledgeImpact: response.knowledgeImpact,
        };

        onUpdateProject({
          ...project,
          chat: [...updatedChatWithUser, lynerMsg],
        });
      }
    } catch (err: any) {
      setWorkspaceError(
        err?.message || "Lyner couldn't respond right now. Try again in a moment."
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAcceptChatDnaProposal = async (
    messageId: string,
    sectionHeading: string,
    updatedBody: string,
    updatedBullets?: string[],
    reason?: string
  ) => {
    const updatedChat = project.chat.map((m) =>
      m.id === messageId && m.proposedDnaChange
        ? {
            ...m,
            proposedDnaChange: {
              ...m.proposedDnaChange,
              proposedBody: updatedBody,
              status: 'accepted' as const,
            },
          }
        : m
    );

    const targetIndex = project.dna.findIndex(
      (sec) =>
        sec.heading.toUpperCase() === sectionHeading.toUpperCase() ||
        sec.heading.toUpperCase().includes(sectionHeading.toUpperCase())
    );

    let updatedDna = [...project.dna];
    if (targetIndex >= 0) {
      updatedDna[targetIndex] = {
        ...updatedDna[targetIndex],
        body: updatedBody,
        bullets:
          updatedBullets && updatedBullets.length > 0
            ? updatedBullets
            : updatedDna[targetIndex].bullets,
      };
    } else {
      updatedDna.push({
        id: `dna-${Date.now()}`,
        heading: sectionHeading.toUpperCase(),
        body: updatedBody,
        bullets: updatedBullets,
      });
    }

    let newPulse: PulseEventItem = {
      id: `pulse-${Date.now()}`,
      type: 'decision_confirmed',
      symbol: '◆',
      headline: `◆ Project DNA updated: ${sectionHeading}`,
      whatChanged: updatedBody,
      whyItMatters:
        reason ||
        'Refines the shared Project DNA based on team discussion and findings.',
      whenItHappened: 'Just now',
      whereItCameFrom: 'Confirmed in Team Chat with Lyner',
      actor: `${activeChatSender} & Lyner`,
      linkedSource: {
        tab: 'dna',
        label: 'Read Updated DNA',
      },
    };

    try {
      const aiPulse = await aiService.generatePulse({
        eventDescription: `Updated Project DNA section "${sectionHeading}": ${updatedBody}. Reason: ${reason || ''}`,
        source: 'Team Chat DNA Update',
        project,
      });
      if (aiPulse && aiPulse.title) {
        newPulse = {
          ...newPulse,
          type: aiPulse.type || 'decision_confirmed',
          symbol: aiPulse.symbol || '◆',
          headline: aiPulse.title,
          whatChanged: aiPulse.whatChanged || updatedBody,
          whyItMatters: aiPulse.whyItMatters || newPulse.whyItMatters,
        };
      }
    } catch {
      // Fallback to structured local pulse if AI pulse call fails
    }

    onUpdateProject({
      ...project,
      chat: updatedChat,
      dna: updatedDna,
      recentlySummary: newPulse.whatChanged,
      pulse: [newPulse, ...project.pulse],
    });
  };

  const handleRejectChatDnaProposal = (messageId: string) => {
    const updatedChat = project.chat.map((m) =>
      m.id === messageId && m.proposedDnaChange
        ? {
            ...m,
            proposedDnaChange: {
              ...m.proposedDnaChange,
              status: 'rejected' as const,
            },
          }
        : m
    );
    onUpdateProject({ ...project, chat: updatedChat });
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    const updatedChat = project.chat.map((msg) => {
      if (msg.id !== messageId) return msg;
      const existing = msg.reactions || [];
      const found = existing.find((r) => r.emoji === emoji);
      let nextReactions;
      if (found) {
        nextReactions = existing
          .map((r) =>
            r.emoji === emoji
              ? {
                  ...r,
                  count: r.userReacted ? r.count - 1 : r.count + 1,
                  userReacted: !r.userReacted,
                }
              : r
          )
          .filter((r) => r.count > 0);
      } else {
        nextReactions = [...existing, { emoji, count: 1, userReacted: true }];
      }
      return { ...msg, reactions: nextReactions };
    });

    onUpdateProject({ ...project, chat: updatedChat });
  };

  const handleSelectTradeoffOption = async (
    messageId: string,
    chosenOption: string
  ) => {
    const updatedChat = project.chat.map((m) =>
      m.id === messageId && m.tradeoffComparison
        ? {
            ...m,
            tradeoffComparison: {
              ...m.tradeoffComparison,
              resolvedOption: chosenOption,
            },
          }
        : m
    );

    const updatedDna = project.dna.map((sec) => {
      if (sec.heading.toUpperCase().includes('DECISION')) {
        return {
          ...sec,
          bullets: [
            `Confirmed in Team Chat: ${chosenOption}`,
            ...(sec.bullets || []),
          ],
        };
      }
      return sec;
    });

    const newPulse: PulseEventItem = {
      id: `pulse-${Date.now()}`,
      type: 'decision_confirmed',
      symbol: '✓',
      headline: `✓ Decision confirmed: ${chosenOption}`,
      whatChanged: `The team resolved the open design question by selecting "${chosenOption}".`,
      whyItMatters:
        'Clarifies how the feature works and updates the shared Project DNA.',
      whenItHappened: 'Just now',
      whereItCameFrom: 'Team Chat Discussion',
      actor: 'Team & Lyner',
      linkedSource: {
        tab: 'dna',
        label: 'Read Updated DNA',
      },
    };

    onUpdateProject({
      ...project,
      chat: updatedChat,
      dna: updatedDna,
      pulse: [newPulse, ...project.pulse],
    });
  };

  const handleResolveChatContradiction = (
    messageId: string,
    chosenResolution: string
  ) => {
    const updatedChat = project.chat.map((m) =>
      m.id === messageId && m.contradictionDetected
        ? {
            ...m,
            contradictionDetected: {
              ...m.contradictionDetected,
              resolvedWith: chosenResolution,
            },
          }
        : m
    );

    const updatedDna = project.dna.map((sec) => {
      if (sec.heading.toUpperCase().includes('DECISION')) {
        return {
          ...sec,
          bullets: [
            `Resolved Contradiction: ${chosenResolution}`,
            ...(sec.bullets || []),
          ],
        };
      }
      return sec;
    });

    const newPulse: PulseEventItem = {
      id: `pulse-${Date.now()}`,
      type: 'decision_confirmed',
      symbol: '◆',
      headline: '◆ Contradiction resolved in Project DNA',
      whatChanged: chosenResolution,
      whyItMatters:
        'Keeps requirements and project direction consistent for the whole group.',
      whenItHappened: 'Just now',
      whereItCameFrom: 'Team Chat Contradiction Check',
      actor: 'Team & Lyner',
      linkedSource: {
        tab: 'dna',
        label: 'Read Updated DNA',
      },
    };

    onUpdateProject({
      ...project,
      chat: updatedChat,
      dna: updatedDna,
      pulse: [newPulse, ...project.pulse],
    });
  };

  /* ==================================================================
     1. OVERVIEW ("Where are we right now?")
        - Interactive Project Journey Path (Duolingo-inspired progression)
        - Lyner Active Facilitator Hero Card (One obvious thing to do/understand)
        - Team Roles & Live Momentum
     ================================================================== */
  if (activeTab === 'overview') {
    const verifiedTasksCount = project.tasks.filter(
      (t) => t.status === 'VERIFIED'
    ).length;
    const nextOpenTask =
      project.tasks.find((t) => t.status !== 'VERIFIED') || project.tasks[0];

    const openQuestionsSection = project.dna.find((s) =>
      s.heading.toUpperCase().includes('OPEN')
    );
    const primaryOpenQuestion =
      project.openQuestionHighlight ||
      openQuestionsSection?.bullets?.[0] ||
      'What labels will students understand most easily, and how can we measure if recycling improves?';

    const recentSummaryText =
      project.recentlySummary ||
      project.pulse[0]?.whatChanged ||
      'Youssef built the first 3-section recycling station prototype and Mariam surveyed 86 students.';

    const journeyStages = [
      {
        step: '01',
        title: 'Problem & Survey',
        status: 'VERIFIED' as const,
        owner: 'Mariam · Research',
        summary:
          '86 students surveyed across school. Confirmed that unclear labels cause recyclable bottles and paper to end up in mixed trash.',
        actionLabel: 'Inspect Survey Task',
        onAction: () =>
          navigateToSurface('tasks', project.tasks[1]?.id || project.tasks[0]?.id),
      },
      {
        step: '02',
        title: 'Station Prototype',
        status: 'VERIFIED' as const,
        owner: 'Youssef · Prototype Design',
        summary:
          'Built the first 3-section recycling station (Paper, Plastic, General Waste) and tested it with 5 students.',
        actionLabel: 'Inspect Prototype Task',
        onAction: () =>
          navigateToSurface('tasks', project.tasks[3]?.id || project.tasks[0]?.id),
      },
      {
        step: '03',
        title: 'Labels & Placement',
        status: 'ACTIVE' as const,
        owner: 'Salma & Ahmed',
        summary:
          'Testing Salma’s two label designs (icons vs. real school items) and finalizing bin placement near classrooms and the cafeteria.',
        actionLabel: 'Continue Active Task',
        onAction: () =>
          navigateToSurface('tasks', nextOpenTask?.id),
      },
      {
        step: '04',
        title: 'Impact Measurement',
        status: 'UPCOMING' as const,
        owner: 'Full Team',
        summary:
          'Compare waste separation before and after placing the new stations, then prepare the final class presentation.',
        actionLabel: 'Read Deliverables in DNA',
        onAction: () => onSelectTab('dna'),
      },
    ];

    const selectedStage =
      journeyStages[activeJourneyStageIdx] || journeyStages[2];

    return (
      <div className="py-8 sm:py-12 px-6 sm:px-10 max-w-5xl mx-auto space-y-12">
        {/* ZONE 1: PROJECT HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-slate-200/80">
          <div className="space-y-2.5 max-w-2xl">
            <div className="text-xs font-extrabold tracking-wider uppercase text-[#4F46E5]">
              Overview · Where are we right now?
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {project.summary}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab('dna')}
              className="lyner-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer"
            >
              <Dna className="w-4 h-4 text-[#4F46E5]" />
              <span>Read Project DNA</span>
            </button>
            {nextOpenTask && (
              <button
                type="button"
                onClick={() => navigateToSurface('tasks', nextOpenTask.id)}
                className="lyner-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer"
              >
                <span>Continue Work</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ZONE 2: WHAT'S NEW & YOUR NEXT STEP (Lyner Focus Hero) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-wider uppercase text-slate-500">
              01 · Right Now & Your Next Step
            </h2>
            <button
              type="button"
              disabled={isAnalyzingOverview}
              onClick={handleRefreshOverviewWithAI}
              className="lyner-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#4F46E5] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isAnalyzingOverview ? 'Thinking...' : 'Refresh AI Insight'}
              </span>
            </button>
          </div>

          <div className="lyner-document-sheet rounded-3xl p-7 sm:p-9 space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <Mascot
                state={
                  isAnalyzingOverview
                    ? 'THINKING'
                    : liveOverviewInsight?.mascotState || 'HELPING'
                }
                size="md"
                className="shrink-0"
              />
              <div className="space-y-3 flex-1">
                <div className="text-xs font-bold text-[#4F46E5]">
                  What’s Moving Right Now
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug max-w-3xl">
                  {isAnalyzingOverview
                    ? 'Thinking... analyzing DNA, Tasks, and Pulse...'
                    : liveOverviewInsight?.mascotMessage ||
                      `Your team has verified ${verifiedTasksCount} of ${project.tasks.length} tasks and is now focused on: ${
                        nextOpenTask?.title || project.rightNowFocus
                      }`}
                </h3>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
                  <strong className="text-slate-900">Current Direction:</strong>{' '}
                  {liveOverviewInsight?.currentDirectionSummary ||
                    project.currentDirection}
                </p>
              </div>
            </div>

            {workspaceError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-3">
                <span>{workspaceError}</span>
                <button
                  type="button"
                  onClick={handleRefreshOverviewWithAI}
                  className="font-bold underline shrink-0 cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Distinct Inset Callout for Next Recommended Step */}
            <div className="p-5 rounded-2xl bg-[#F4F6FF] border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#4F46E5]">
                  Recommended Next Step
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {liveOverviewInsight?.nextRecommendedAction ||
                    (nextOpenTask
                      ? `${nextOpenTask.title} · Assigned to ${nextOpenTask.assigneeName}`
                      : project.nextActionPrompt)}
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectTab('chat')}
                  className="lyner-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Discuss in Chat
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('tasks')}
                  className="lyner-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Task</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ZONE 3: WHAT NEEDS ATTENTION & PROJECT PULSE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* What Needs Attention (Open Question) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl p-7 bg-amber-50/75 border border-amber-200/90 shadow-2xs space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  02 · What Needs Attention
                </span>
                <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                “{primaryOpenQuestion}”
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                Lyner keeps open questions explicit so your team tests assumptions before locking them into Project DNA.
              </p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-amber-200/60">
              <button
                type="button"
                onClick={() => onSelectTab('chat')}
                className="w-full lyner-btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
              >
                <span>Compare options in Team Chat</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#4F46E5]" />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('dna')}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-amber-900 hover:bg-amber-100/70 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>See Open Questions in DNA</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Project Pulse Summary */}
          <div className="lg:col-span-7 lyner-section-surface rounded-3xl p-7 space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                  03 · Project Pulse
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Recent Meaningful Changes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('pulse')}
                className="lyner-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold text-[#4F46E5] cursor-pointer"
              >
                Full Timeline →
              </button>
            </div>

            <div className="space-y-3">
              {project.pulse.slice(0, 3).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() =>
                    ev.linkedSource
                      ? navigateToSurface(
                          ev.linkedSource.tab,
                          ev.linkedSource.targetId
                        )
                      : onSelectTab('pulse')
                  }
                  className="w-full text-left p-4 rounded-2xl bg-white hover:bg-[#F8FAFF] border border-slate-200/85 hover:border-[#4F46E5] shadow-2xs transition-all space-y-1.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold text-slate-900 group-hover:text-[#4F46E5] transition-colors">
                      {ev.headline}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {ev.whenItHappened}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {ev.whatChanged}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ZONE 4: TEAM / PROJECT JOURNEY */}
        <section className="space-y-5 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                04 · Project Journey & Team Roles
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                From Unclear Idea to Verified School Impact
              </h2>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Click any stage to inspect ·{' '}
              <span className="font-mono tabular-nums font-bold text-emerald-700">
                {verifiedTasksCount}/{project.tasks.length} tasks verified
              </span>
            </div>
          </div>

          {/* 4-Node Interactive Path */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {journeyStages.map((stg, idx) => {
              const isSelected = activeJourneyStageIdx === idx;
              const isVerified = stg.status === 'VERIFIED';
              const isActive = stg.status === 'ACTIVE';

              return (
                <button
                  key={stg.step}
                  type="button"
                  onClick={() => setActiveJourneyStageIdx(idx)}
                  className={`text-left p-5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'lyner-card-selected -translate-y-0.5'
                      : 'lyner-card-interactive'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isVerified
                          ? 'bg-[#22C55E] text-white'
                          : isActive
                          ? 'bg-[#4F46E5] text-white ring-4 ring-indigo-100'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isVerified ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        stg.step
                      )}
                    </span>

                    <span
                      className={`text-[11px] font-bold ${
                        isVerified
                          ? 'text-emerald-700'
                          : isActive
                          ? 'text-[#4F46E5]'
                          : 'text-slate-400'
                      }`}
                    >
                      {isVerified
                        ? 'Verified'
                        : isActive
                        ? 'Active Now'
                        : 'Up Next'}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {stg.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stg.owner}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Inspector Drawer */}
          <div className="p-6 rounded-2xl lyner-document-sheet flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4F46E5]">
                <span>
                  Stage {selectedStage.step}: {selectedStage.title}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">{selectedStage.owner}</span>
              </div>
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                {selectedStage.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={selectedStage.onAction}
              className="lyner-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>{selectedStage.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Team Member Momentum Strip */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {humanMembers.map((member) => {
              const memberTasks = project.tasks.filter(
                (t) =>
                  t.assigneeName
                    .toLowerCase()
                    .includes(member.name.toLowerCase()) ||
                  t.assigneeName === 'Everyone'
              );
              const memberVerified = memberTasks.filter(
                (t) => t.status === 'VERIFIED'
              ).length;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setMemberFilter(member.name);
                    onSelectTab('tasks');
                  }}
                  className="lyner-card-interactive p-4 rounded-2xl text-left space-y-2.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${member.avatarColor}`}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-[#4F46E5] font-semibold truncate">
                          {member.role}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums font-bold text-emerald-700 shrink-0">
                      {memberVerified}/{memberTasks.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {member.focus}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  /* ==================================================================
     2. PROJECT DNA ("The clearest representation of what this project is")
        - Clear Document Hierarchy + Distinct Secondary Context Sidebar
        - Each section is a distinct, breathable editorial unit
     ================================================================== */
  if (activeTab === 'dna') {
    const verifiedTasksCount = project.tasks.filter(
      (t) => t.status === 'VERIFIED'
    ).length;

    return (
      <div className="min-h-screen py-8 sm:py-12 px-5 sm:px-10 max-w-6xl mx-auto space-y-10">
        {/* Top Document Header & Action Bar */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-slate-200/90">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
              <Dna className="w-4 h-4" />
              <span>Project DNA · Shared Project Brief</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono">
                {project.dna.length} Sections
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {project.summary}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowAskLynerDnaBar(!showAskLynerDnaBar);
                setIsEditingDnaManually(false);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                showAskLynerDnaBar
                  ? 'lyner-btn-primary'
                  : 'lyner-btn-secondary text-[#4F46E5]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Lyner to change this</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isEditingDnaManually) {
                  setManualDnaDraft(project.dna);
                  setShowAskLynerDnaBar(false);
                }
                setIsEditingDnaManually(!isEditingDnaManually);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isEditingDnaManually
                  ? 'bg-slate-900 text-white'
                  : 'lyner-btn-secondary'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditingDnaManually ? 'Cancel Edit' : 'Edit DNA'}</span>
            </button>
          </div>
        </header>

        {workspaceError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">AI Error</div>
              <p className="text-xs">{workspaceError}</p>
            </div>
          </div>
        )}

        {/* Conversational "Ask Lyner to change this" drawer */}
        {showAskLynerDnaBar && (
          <div className="lyner-document-sheet rounded-3xl p-6 sm:p-8 border-2 border-indigo-200/90 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <Mascot
                  state={
                    isUpdatingDna
                      ? 'THINKING'
                      : dnaFeedback?.mascotState || 'HELPING'
                  }
                  size="sm"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                    Evolve Project DNA with Lyner
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Tell Lyner what the group decided, or test whether a new idea contradicts your verified research.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAskLynerDnaBar(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={dnaInstruction}
                onChange={(e) => setDnaInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && dnaInstruction.trim()) {
                    handleAskLynerToUpdateDna();
                  }
                }}
                placeholder="e.g., We decided to place smaller bins near classrooms for paper and full 3-section stations in the cafeteria..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50/70 border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-[#4F46E5]"
              />
              <button
                type="button"
                disabled={!dnaInstruction.trim() || isUpdatingDna}
                onClick={() => handleAskLynerToUpdateDna()}
                className="lyner-btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isUpdatingDna ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating DNA...</span>
                  </>
                ) : (
                  <span>Apply to DNA</span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Quick test:</span>
              {[
                'We decided to use smaller bins near classrooms for paper and bigger 3-section stations in the cafeteria.',
                'Let’s remove all labels from the bins and expect students to memorize bin colors instead.',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setDnaInstruction(sample)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-[#4F46E5] font-semibold transition-colors cursor-pointer text-left truncate max-w-md"
                >
                  “{sample}”
                </button>
              ))}
            </div>

            {dnaFeedback && (
              <div
                className={`p-4 rounded-2xl border-2 text-sm space-y-2.5 ${
                  dnaFeedback.hasContradiction
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="font-bold flex items-center gap-2 text-xs">
                  {dnaFeedback.hasContradiction ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                      <span>Contradiction Detected by Lyner</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#22C55E] stroke-[3]" />
                      <span>Project DNA Updated</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {dnaFeedback.message}
                </p>
                {dnaFeedback.hasContradiction &&
                  dnaFeedback.pendingInstruction && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleAskLynerToUpdateDna(
                            dnaFeedback.pendingInstruction,
                            true
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-amber-900 text-white text-xs font-bold hover:bg-amber-800 cursor-pointer"
                      >
                        Override earlier decision & update DNA
                      </button>
                      <button
                        type="button"
                        onClick={() => setDnaFeedback(null)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                      >
                        Keep existing DNA decision
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Two-Column Layout: MAIN DOCUMENT vs SECONDARY CONTEXT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* MAIN DOCUMENT COLUMN: Each DNA section is a distinct, breathable editorial block */}
          <div className="lg:col-span-8 space-y-7">
            {isEditingDnaManually ? (
              <div className="lyner-document-sheet rounded-3xl p-7 sm:p-9 space-y-8">
                {manualDnaDraft.map((section, idx) => (
                  <div
                    key={section.id}
                    className="space-y-3 pb-6 border-b border-slate-100"
                  >
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => {
                        const next = [...manualDnaDraft];
                        next[idx] = { ...section, heading: e.target.value };
                        setManualDnaDraft(next);
                      }}
                      className="text-xs font-bold text-[#4F46E5] border-b border-indigo-200 focus:outline-none pb-1 w-full"
                    />
                    <textarea
                      value={section.body}
                      rows={3}
                      onChange={(e) => {
                        const next = [...manualDnaDraft];
                        next[idx] = { ...section, body: e.target.value };
                        setManualDnaDraft(next);
                      }}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-base text-slate-800 leading-relaxed focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDnaManually(false)}
                    className="lyner-btn-secondary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManualDnaEdit}
                    className="lyner-btn-primary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Save DNA Changes
                  </button>
                </div>
              </div>
            ) : (
              project.dna.map((section, index) => {
                const isOpenQuestions =
                  section.heading.toUpperCase().includes('OPEN') ||
                  section.heading.toUpperCase().includes('UNCERTAIN');
                const isHighlighted = highlightedDnaSectionId === section.id;

                return (
                  <section
                    key={section.id || index}
                    id={`dna-sec-${section.id}`}
                    className={`rounded-3xl p-7 sm:p-9 transition-all space-y-5 ${
                      isHighlighted
                        ? 'lyner-card-selected'
                        : isOpenQuestions
                        ? 'bg-amber-50/70 border border-amber-200/90 shadow-xs'
                        : 'lyner-document-sheet'
                    }`}
                  >
                    {/* Section Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#4F46E5] text-xs font-mono font-bold">
                            0{index + 1}
                          </span>
                          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                            {section.heading}
                          </h2>
                          {(section.epistemicNote || isOpenQuestions) && (
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                isOpenQuestions
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {section.epistemicNote || 'Open / Being tested'}
                            </span>
                          )}
                        </div>

                        {section.questionSubtitle && (
                          <div className="text-xs sm:text-sm font-medium text-slate-500">
                            {section.questionSubtitle}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAskLynerDnaBar(true);
                          setDnaInstruction(
                            `In ${section.heading}, let's update it so that `
                          );
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="lyner-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold text-[#4F46E5] cursor-pointer shrink-0"
                      >
                        Refine with Lyner →
                      </button>
                    </div>

                    {/* Section Prose Body (Comfortable width & line-height) */}
                    <div className="lyner-prose text-[16px] sm:text-[17px] text-slate-800 whitespace-pre-line">
                      {section.body}
                    </div>

                    {/* Section Structured Bullets */}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="pt-2 space-y-3">
                        {section.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/60 text-sm sm:text-[15px] text-slate-800 leading-relaxed max-w-[66ch]"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2 shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })
            )}
          </div>

          {/* SECONDARY CONTEXT SIDEBAR (Distinct recessed well so it never bleeds into the document) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-8 lyner-secondary-panel rounded-3xl p-5 sm:p-6 space-y-6">
            <div className="px-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Secondary Context & Outline
              </div>
            </div>

            {/* Outline Card inside Secondary Well */}
            <div className="lyner-card rounded-2xl p-5 space-y-3.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                Brief Sections
              </div>
              <div className="space-y-1.5">
                {project.dna.map((sec, idx) => {
                  const isActive = highlightedDnaSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setHighlightedDnaSectionId(sec.id);
                        const el = document.getElementById(`dna-sec-${sec.id}`);
                        el?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-[#4F46E5] text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate">
                        0{idx + 1}. {sec.heading}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Living DNA Connection Card */}
            <div className="lyner-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Mascot state="EXPLAINING" size="sm" />
                <div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Living DNA Connection
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700">
                    {verifiedTasksCount} verified tasks linked
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When teammates verify survey findings or prototype tests in{' '}
                <strong>Tasks</strong>, Lyner automatically records those discoveries in your Project DNA.
              </p>
              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectTab('tasks')}
                  className="lyner-btn-secondary w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>
                    Go to Team Tasks ({verifiedTasksCount}/{project.tasks.length})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#4F46E5]" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('pulse')}
                  className="w-full py-2 px-3.5 rounded-xl text-xs font-bold text-[#4F46E5] bg-indigo-50/70 hover:bg-indigo-100/80 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>View DNA Evolution in Pulse</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ==================================================================
     3. TASKS & WORK ("What needs to happen?")
        - Clear task groups, card separation, status hierarchy, and interactive studio
     ================================================================== */
  if (activeTab === 'tasks') {
    const filteredTasks = project.tasks.filter((t) => {
      const matchesMember =
        memberFilter === 'ALL' ||
        t.assigneeName.toLowerCase().includes(memberFilter.toLowerCase()) ||
        t.assigneeName === 'Everyone';
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'VERIFIED' && t.status === 'VERIFIED') ||
        (statusFilter === 'OPEN' && t.status !== 'VERIFIED');
      return matchesMember && matchesStatus;
    });

    const verifiedCount = project.tasks.filter(
      (t) => t.status === 'VERIFIED'
    ).length;

    const openFilteredTasks = filteredTasks.filter(
      (t) => t.status !== 'VERIFIED'
    );
    const verifiedFilteredTasks = filteredTasks.filter(
      (t) => t.status === 'VERIFIED'
    );

    // Focused Task Execution & Verification Studio View
    if (activeTask) {
      return (
        <div className="py-8 sm:py-12 px-5 sm:px-10 max-w-4xl mx-auto space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200/90">
            <BackButton
              label="Back to All Tasks"
              onClick={() => setSelectedTaskId(null)}
            />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-600">
              <span className="font-extrabold text-[#4F46E5]">
                {activeTask.discipline}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>
                Assigned to{' '}
                <strong className="text-slate-900">
                  {activeTask.assigneeName}
                </strong>{' '}
                ({activeTask.assigneeRole})
              </span>
            </div>
          </div>

          {/* Section 1: Task Brief Sheet */}
          <section className="lyner-document-sheet rounded-3xl p-7 sm:p-9 space-y-6">
            <div className="space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                01 · Task Brief & Verification State
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeTask.title}
              </h1>
              <p className="text-base text-slate-700 leading-relaxed max-w-[65ch]">
                <strong className="text-slate-900">Goal:</strong>{' '}
                {activeTask.goal}
              </p>
            </div>

            <div className="pt-2">
              <VerificationState
                status={activeTask.status}
                feedback={activeTask.verificationEvaluation}
              />
            </div>

            {activeTask.dnaOutcomeSummary && (
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="font-bold text-emerald-950">
                  ✓ Recorded in Project DNA: {activeTask.dnaOutcomeSummary}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectTab('dna')}
                  className="lyner-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 shrink-0 cursor-pointer"
                >
                  View in Project DNA →
                </button>
              </div>
            )}
          </section>

          {/* Section 2: Interactive Guided Submission Studio */}
          <section className="lyner-document-sheet rounded-3xl p-7 sm:p-9 space-y-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="flex items-center gap-3.5">
                <Mascot
                  state={isVerifyingSubmission ? 'THINKING' : 'HELPING'}
                  size="sm"
                />
                <div className="space-y-0.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#4F46E5]">
                    02 · Evidence & Work Submission
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Submit Work for Lyner Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Lyner checks your explanation and evidence before updating the team’s Project DNA.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrefillVerifiedSubmissionExample}
                  className="lyner-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold text-[#4F46E5] cursor-pointer"
                >
                  Fill Detailed Student Example
                </button>
                <button
                  type="button"
                  onClick={handlePrefillShallowExample}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-900 transition-colors cursor-pointer"
                >
                  Test Shallow Claim
                </button>
              </div>
            </div>

            {workspaceError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900">
                {workspaceError}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  01. What did you do?
                </label>
                <textarea
                  value={subWhatDidYouDo}
                  onChange={(e) => setSubWhatDidYouDo(e.target.value)}
                  rows={2}
                  placeholder="Describe what you built, researched, or tested for GreenCycle..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50/70 border-2 border-slate-200/90 text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  02. How did you do it?
                </label>
                <textarea
                  value={subHowImplemented}
                  onChange={(e) => setSubHowImplemented(e.target.value)}
                  rows={2}
                  placeholder="Explain the materials, survey questions, design choices, or testing setup..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50/70 border-2 border-slate-200/90 text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  03. What did you learn or find?
                </label>
                <textarea
                  value={subWhatResult}
                  onChange={(e) => setSubWhatResult(e.target.value)}
                  rows={2}
                  placeholder="Share the outcome or student feedback so Lyner can update Project DNA..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50/70 border-2 border-slate-200/90 text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              {/* Evidence Attachments Well */}
              <div className="lyner-section-surface rounded-2xl p-5 space-y-3.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  04. Attach Evidence (Photos, Survey Data, Label Designs, Notes)
                </label>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      {
                        type: 'image',
                        label: 'Photo / Design',
                        icon: <ImageIcon className="w-3.5 h-3.5" />,
                      },
                      {
                        type: 'file',
                        label: 'Survey / Notes PDF',
                        icon: <FileText className="w-3.5 h-3.5" />,
                      },
                      {
                        type: 'link',
                        label: 'Slides / Link',
                        icon: <Link2 className="w-3.5 h-3.5" />,
                      },
                      {
                        type: 'code',
                        label: 'Data / Chart',
                        icon: <Code2 className="w-3.5 h-3.5" />,
                      },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setEvidenceDraftType(btn.type)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        evidenceDraftType === btn.type
                          ? 'bg-[#4F46E5] border-[#4F46E5] text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-[#4F46E5]'
                      }`}
                    >
                      {btn.icon}
                      <span>+ {btn.label}</span>
                    </button>
                  ))}
                </div>

                {evidenceDraftType && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                    <input
                      type="text"
                      value={evidenceDraftLabel}
                      onChange={(e) => setEvidenceDraftLabel(e.target.value)}
                      placeholder="Filename or title (e.g. recycling_labels_vA_vs_vB.png)"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      value={evidenceDraftDetail}
                      onChange={(e) => setEvidenceDraftDetail(e.target.value)}
                      placeholder="Short description of what this evidence proves..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEvidenceDraftType(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddEvidenceChip}
                        className="lyner-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Attach Evidence
                      </button>
                    </div>
                  </div>
                )}

                {subEvidence.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {subEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-indigo-200 shadow-2xs text-xs text-slate-800"
                      >
                        <span className="font-bold text-[#4F46E5]">
                          {ev.type.toUpperCase()}:
                        </span>
                        <span className="font-semibold">{ev.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSubEvidence((prev) =>
                              prev.filter((item) => item.id !== ev.id)
                            )
                          }
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!subWhatDidYouDo.trim() || isVerifyingSubmission}
                  onClick={handleSubmitTaskWork}
                  className="lyner-btn-primary inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingSubmission ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Lyner is Verifying Submission...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Submit & Verify with Lyner</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: Past Submissions History */}
          {activeTask.submissions.length > 0 && (
            <section className="lyner-section-surface rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                03 · Verified & Past Submissions ({activeTask.submissions.length})
              </div>
              <div className="space-y-4">
                {activeTask.submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="lyner-card p-6 rounded-2xl space-y-3.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
                      <span className="font-extrabold text-slate-900">
                        {sub.submittedBy} · {sub.role}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {sub.submittedAt}
                      </span>
                    </div>
                    <div className="space-y-2 leading-relaxed">
                      <p className="text-slate-800">
                        <strong className="text-slate-900">
                          What was done:
                        </strong>{' '}
                        {sub.whatDidYouDo}
                      </p>
                      <p className="text-slate-700">
                        <strong className="text-slate-900">
                          How it was implemented:
                        </strong>{' '}
                        {sub.howDidYouImplement}
                      </p>
                      <p className="text-slate-700">
                        <strong className="text-slate-900">
                          Result & findings:
                        </strong>{' '}
                        {sub.whatWasResult}
                      </p>
                    </div>
                    {sub.evidence && sub.evidence.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {sub.evidence.map((ev) => (
                          <span
                            key={ev.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700"
                          >
                            {ev.label} — {ev.detail}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="pt-2">
                      <VerificationState
                        status={sub.evaluationStatus}
                        feedback={sub.lynerFeedback}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      );
    }

    const renderTaskCard = (task: ProjectTask, idx: number) => {
      const isVerified = task.status === 'VERIFIED';
      const needsEvidence = task.status === 'NEEDS_MORE_EVIDENCE';

      return (
        <div
          key={task.id}
          onClick={() => setSelectedTaskId(task.id)}
          className="lyner-card-interactive rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer group"
        >
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                isVerified
                  ? 'bg-[#22C55E] text-white'
                  : needsEvidence
                  ? 'bg-amber-500 text-white'
                  : 'bg-indigo-50 text-[#4F46E5] border border-indigo-200/80'
              }`}
            >
              {isVerified ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                String(idx + 1).padStart(2, '0')
              )}
            </div>

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 font-bold text-[#4F46E5]">
                  {task.discipline}
                </span>
                <span className="font-semibold text-slate-700">
                  {task.assigneeName} ({task.assigneeRole})
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span
                  className={`font-bold ${
                    isVerified
                      ? 'text-emerald-700'
                      : needsEvidence
                      ? 'text-amber-700'
                      : 'text-slate-500'
                  }`}
                >
                  {isVerified
                    ? '✓ Verified by Lyner'
                    : needsEvidence
                    ? '⚠ Needs Evidence'
                    : 'Ready to Submit'}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#4F46E5] transition-colors">
                {task.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                {task.goal}
              </p>

              {task.dnaOutcomeSummary && (
                <div className="pt-1 text-xs font-bold text-emerald-700">
                  ✓ DNA Impact: {task.dnaOutcomeSummary}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center">
            <span className="lyner-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#4F46E5] group-hover:border-[#4F46E5]">
              <span>{isVerified ? 'Inspect Evidence' : 'Open Workspace'}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      );
    };

    // All Tasks List View
    return (
      <div className="py-8 sm:py-12 px-5 sm:px-10 max-w-5xl mx-auto space-y-9">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-slate-200/90">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
              Tasks & Work · What needs to happen?
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Team Execution & Verification
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Click any task to open its workspace, attach evidence, and let Lyner verify outcomes into your Project DNA.
            </p>
          </div>

          <button
            type="button"
            disabled={isGeneratingTasks}
            onClick={handleGenerateMoreTasksFromDNA}
            className="lyner-btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-60 shrink-0"
          >
            {isGeneratingTasks ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating from DNA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Tasks from DNA</span>
              </>
            )}
          </button>
        </header>

        {/* Interactive Filter Controls Well */}
        <div className="lyner-section-surface p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Member Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMemberFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                memberFilter === 'ALL'
                  ? 'bg-[#4F46E5] text-white shadow-2xs'
                  : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              All Team ({project.tasks.length})
            </button>

            {humanMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setMemberFilter(member.name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  memberFilter === member.name
                    ? 'bg-[#4F46E5] text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>

          {/* Status Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200/80 self-start sm:self-auto">
            {(
              [
                { id: 'ALL', label: `All (${project.tasks.length})` },
                {
                  id: 'OPEN',
                  label: `Open (${project.tasks.length - verifiedCount})`,
                },
                { id: 'VERIFIED', label: `Verified (${verifiedCount})` },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distinct Task Groups: Active / Open vs Verified */}
        {statusFilter === 'ALL' ? (
          <div className="space-y-10">
            {openFilteredTasks.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                    Active & Ready for Evidence ({openFilteredTasks.length})
                  </h2>
                  <span className="text-xs text-slate-500">
                    Submit student evidence to verify
                  </span>
                </div>
                <div className="space-y-4">
                  {openFilteredTasks.map((task, idx) =>
                    renderTaskCard(task, idx)
                  )}
                </div>
              </section>
            )}

            {verifiedFilteredTasks.length > 0 && (
              <section className="space-y-4 pt-2 border-t border-slate-200/70">
                <div className="flex items-center justify-between px-1 pt-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                    Verified & Recorded in Project DNA (
                    {verifiedFilteredTasks.length})
                  </h2>
                  <span className="text-xs text-slate-500">
                    Linked to DNA & Pulse
                  </span>
                </div>
                <div className="space-y-4">
                  {verifiedFilteredTasks.map((task, idx) =>
                    renderTaskCard(task, idx)
                  )}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task, idx) => renderTaskCard(task, idx))}
          </div>
        )}
      </div>
    );
  }

  /* ==================================================================
     4. TEAM CHAT ("What are we talking about?")
        - Clear speaker separation, Lyner facilitator callouts, and elevated composer dock
     ================================================================== */
  if (activeTab === 'chat') {
    return (
      <div className="h-screen flex flex-col max-w-5xl mx-auto px-4 sm:px-8 py-6">
        {/* Rich Collaborative Header */}
        <header className="lyner-document-sheet px-5 py-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Team Chat · Collaborative Workspace</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {project.name} Group Discussion
            </h1>
          </div>

          {/* Dynamic Speaker Switcher across student team members */}
          <div className="flex flex-wrap items-center gap-1.5 lyner-section-surface p-1.5 rounded-xl text-xs">
            <span className="px-2 text-slate-500 font-bold">
              Speaking as:
            </span>
            {humanMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setActiveChatSender(member.name)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeChatSender === member.name
                    ? 'bg-[#4F46E5] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </header>

        {/* Active Open Question Context Strip */}
        <div className="mt-3 px-4 py-2.5 rounded-xl bg-[#EEF2FF] border border-indigo-200/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <span className="text-slate-700">
            <strong className="text-[#4F46E5]">Active Focus:</strong>{' '}
            {project.openQuestionHighlight ||
              'Deciding classroom vs. cafeteria bin placement and testing Salma’s label designs'}
          </span>
          <button
            type="button"
            onClick={() => onSelectTab('dna')}
            className="font-bold text-[#4F46E5] hover:underline cursor-pointer"
          >
            Check Project DNA →
          </button>
        </div>

        {/* Messages Scroll Area with Speaker Grouping Rhythm */}
        <div className="flex-1 overflow-y-auto py-6 pr-1">
          {project.chat.map((msg, idx) => {
            const prevMsg = idx > 0 ? project.chat[idx - 1] : null;
            const isSameSenderAsPrevious = Boolean(
              prevMsg &&
                prevMsg.senderName === msg.senderName &&
                prevMsg.senderType === msg.senderType
            );

            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isSameSenderAsPrevious={isSameSenderAsPrevious}
                onReplyClick={(m) => setReplyingToMessage(m)}
                onToggleReaction={handleToggleReaction}
                onSelectTradeoffOption={handleSelectTradeoffOption}
                onResolveContradiction={handleResolveChatContradiction}
                onAcceptDnaProposal={handleAcceptChatDnaProposal}
                onRejectDnaProposal={handleRejectChatDnaProposal}
                onNavigateTab={navigateToSurface}
              />
            );
          })}

          {isChatLoading && (
            <div className="mt-6 flex items-center gap-3.5 px-5 py-4 rounded-2xl lyner-document-sheet w-fit">
              <Mascot state="THINKING" size="sm" />
              <div className="space-y-0.5">
                <div className="text-xs font-extrabold text-[#4F46E5]">
                  Thinking...
                </div>
                <div className="text-xs text-slate-500">
                  Lyner is evaluating your message against Project DNA, Tasks, and Pulse
                </div>
              </div>
            </div>
          )}

          {workspaceError && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Mascot state="CONCERNED" size="sm" />
                <div>
                  <div className="font-bold">
                    Lyner couldn’t respond right now. Try again in a moment.
                  </div>
                  {workspaceError.toLowerCase() !==
                    "lyner couldn't respond right now. try again in a moment." && (
                    <div className="text-xs text-rose-700 mt-0.5">
                      {workspaceError}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceError(null)}
                className="lyner-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Elevated Interactive Composer Dock */}
        <div className="lyner-document-sheet rounded-2xl p-4 space-y-3 shrink-0">
          {replyingToMessage && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-50 text-xs text-slate-700">
              <span>
                Replying to <strong>{replyingToMessage.senderName}</strong>:{' '}
                “{replyingToMessage.content.slice(0, 60)}”
              </span>
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick prompts to test student team chat, DNA update proposals & next-step reasoning */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Try asking:</span>
            <button
              type="button"
              onClick={() =>
                handleSendChat(
                  "We realized students don't really know what belongs in each recycling bin.",
                  true
                )
              }
              className="lyner-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              “We realized students don’t really know what belongs in each bin”
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendChat('What should we work on next?', true)
              }
              className="lyner-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              “What should we work on next?”
            </button>
            <button
              type="button"
              onClick={() =>
                handleSendChat(
                  'We should probably put the recycling bins near the cafeteria.',
                  true
                )
              }
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold cursor-pointer transition-colors"
            >
              “We should probably put the recycling bins near the cafeteria”
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                setChatInput((prev) =>
                  prev.includes('@Lyner') ? prev : `@Lyner ${prev}`
                )
              }
              className="lyner-btn-secondary px-3.5 py-3 rounded-xl text-[#7C3AED] text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
              title="Mention @Lyner to invite AI facilitation"
            >
              <AtSign className="w-3.5 h-3.5" />
              <span>Lyner</span>
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  handleSendChat();
                }
              }}
              placeholder={`Message team as ${activeChatSender} (or tag @Lyner)...`}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50/80 border-2 border-slate-200/90 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#4F46E5]"
            />

            <button
              type="button"
              disabled={!chatInput.trim() || isChatLoading}
              onClick={() => handleSendChat()}
              className="lyner-btn-primary px-5 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==================================================================
     5. PULSE ("What meaningfully changed?")
        - Clear Timeline Event Separation, Category Badges, and Recessed Metadata
     ================================================================== */
  if (activeTab === 'pulse') {
    const filteredPulse = project.pulse.filter((item) => {
      if (pulseFilter === 'ALL') return true;
      if (pulseFilter === 'VERIFIED')
        return (
          item.type === 'verified_outcome' || item.type === 'task_milestone'
        );
      if (pulseFilter === 'DECISIONS')
        return (
          item.type === 'decision_confirmed' ||
          item.type === 'direction_changed'
        );
      if (pulseFilter === 'OPEN') return item.type === 'open_question';
      return true;
    });

    return (
      <div className="py-8 sm:py-12 px-5 sm:px-10 max-w-4xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-slate-200/90">
          <div className="space-y-2 max-w-xl">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
              Pulse · What meaningfully changed?
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Project Evolution Timeline
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              How {project.name} evolved from an initial classroom observation into a tested recycling station prototype.
            </p>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1.5 lyner-section-surface rounded-2xl self-start shrink-0">
            {(
              [
                { id: 'ALL', label: 'All Events' },
                { id: 'VERIFIED', label: 'Verified Work' },
                { id: 'DECISIONS', label: 'Decisions' },
                { id: 'OPEN', label: 'Open Questions' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPulseFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pulseFilter === tab.id
                    ? 'bg-[#4F46E5] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Connected Timeline Rail with Distinct Event Separation */}
        <div className="relative pl-7 sm:pl-10 border-l-2 border-indigo-200/90 space-y-7">
          {filteredPulse.map((item) => {
            const isVerified =
              item.type === 'verified_outcome' ||
              item.type === 'task_milestone';
            const isQuestion = item.type === 'open_question';

            const badgeLabel = isVerified
              ? 'Verified Outcome'
              : isQuestion
              ? 'Open Question'
              : 'Decision / Direction';

            return (
              <article
                key={item.id}
                className="relative lyner-document-sheet rounded-3xl p-6 sm:p-8 space-y-4"
              >
                {/* Timeline Node Marker */}
                <div
                  className={`absolute -left-[37px] sm:-left-[49px] top-8 w-4 h-4 rounded-full ring-4 ring-[#EEF2FF] ${
                    isVerified
                      ? 'bg-[#22C55E]'
                      : isQuestion
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#4F46E5]'
                  }`}
                />

                {/* Event Header & Category */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700'
                          : isQuestion
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-indigo-50 text-[#4F46E5]'
                      }`}
                    >
                      {badgeLabel}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {item.headline}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span className="font-bold text-slate-600">
                      {item.actor}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{item.whenItHappened}</span>
                  </div>
                </div>

                {/* What Changed Prose */}
                <p className="text-[15px] sm:text-base text-slate-800 leading-relaxed max-w-[65ch]">
                  {item.whatChanged}
                </p>

                {/* Recessed Why It Matters & Source Footer */}
                <div className="p-4 rounded-2xl lyner-section-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
                  <div className="space-y-1 max-w-xl">
                    <div>
                      <strong className="text-slate-900">
                        Why it matters:{' '}
                      </strong>
                      {item.whyItMatters}
                    </div>
                    <div>
                      <strong className="text-slate-900">Source: </strong>
                      {item.whereItCameFrom}
                    </div>
                  </div>

                  {item.linkedSource && (
                    <button
                      type="button"
                      onClick={() =>
                        navigateToSurface(
                          item.linkedSource!.tab,
                          item.linkedSource!.targetId
                        )
                      }
                      className="lyner-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold text-[#4F46E5] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>{item.linkedSource.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  /* ==================================================================
     6. FILES & EVIDENCE (Secondary List Well + Primary Artifact Sheet)
     ================================================================== */
  if (activeTab === 'files') {
    const selectedFile =
      project.files.find((f) => f.id === selectedFileId) || project.files[0];

    return (
      <div className="py-8 sm:py-12 px-5 sm:px-10 max-w-5xl mx-auto space-y-9">
        <header className="space-y-2 pb-8 border-b border-slate-200/90">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
            Files & Evidence · Student Project Artifacts
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Shared Files & Verification Evidence
          </h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Select any file to preview how student research, prototypes, and signage connect directly to the Project DNA.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Secondary Well for Artifact List */}
          <div className="lg:col-span-5 lyner-secondary-panel p-4 sm:p-5 rounded-3xl space-y-3">
            <div className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Project Artifacts ({project.files.length})
            </div>
            {project.files.map((f) => {
              const isSelected = selectedFile?.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFileId(f.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'lyner-card-selected'
                      : 'lyner-card-interactive'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#4F46E5]">
                      {f.type}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {f.updatedAt}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {f.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Linked to DNA: <strong>{f.linkedSectionHeading}</strong>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Primary Document Sheet for Artifact Inspector */}
          {selectedFile && (
            <div className="lg:col-span-7 lyner-document-sheet rounded-3xl p-7 sm:p-9 space-y-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                    Artifact Preview · {selectedFile.type}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {selectedFile.name}
                  </h2>
                </div>
                <Eye className="w-5 h-5 text-[#4F46E5] shrink-0" />
              </div>

              <p className="text-[15px] sm:text-base text-slate-700 leading-relaxed">
                {selectedFile.summary}
              </p>

              {/* Contextual Visual Preview of the Student Artifact */}
              <div className="p-5 rounded-2xl lyner-section-surface space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Key Verified Highlights from Artifact
                </div>
                {selectedFile.name.includes('survey') ? (
                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <div>
                      • <strong>Total student responses:</strong> 86 students across classrooms
                    </div>
                    <div>
                      • <strong>Main barrier:</strong> 78% said they want to recycle but hesitate over which bin to use
                    </div>
                    <div>
                      • <strong>Location insight:</strong> Students requested stations near both classrooms (paper) and the cafeteria (plastic bottles)
                    </div>
                  </div>
                ) : selectedFile.name.includes('prototype') ? (
                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <div>
                      • <strong>Structure:</strong> 3 clearly divided sections (Paper · Plastic · General Waste)
                    </div>
                    <div>
                      • <strong>Initial hallway test:</strong> Tested with 5 students; revealed that plastic labels need concrete item illustrations
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <div>
                      • <strong>Version A:</strong> Simple recycling symbols and category titles
                    </div>
                    <div>
                      • <strong>Version B:</strong> High-contrast signs showing real school items (water bottles, juice cups, notebook sheets)
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Connected DNA Section:{' '}
                  <strong className="text-slate-900">
                    {selectedFile.linkedSectionHeading}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectTab('dna')}
                  className="lyner-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Read in Project DNA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ==================================================================
     7. TEAM ROLES (Interactive Student Team Cards)
     ================================================================== */
  if (activeTab === 'members') {
    return (
      <div className="py-8 sm:py-12 px-5 sm:px-10 max-w-4xl mx-auto space-y-9">
        <header className="space-y-2 pb-8 border-b border-slate-200/90">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
            Team Roles & Responsibilities
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {project.name} Team Members
          </h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Click any team member to inspect their assigned tasks or collaborate with them in Team Chat.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {project.members.map((m) => {
            const assignedTasks = project.tasks.filter(
              (t) =>
                t.assigneeName.toLowerCase().includes(m.name.toLowerCase()) ||
                (!m.isAI && t.assigneeName === 'Everyone')
            );
            const verifiedCount = assignedTasks.filter(
              (t) => t.status === 'VERIFIED'
            ).length;

            return (
              <div
                key={m.id}
                className="lyner-document-sheet rounded-3xl p-7 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {m.isAI ? (
                        <Mascot state="HELPING" size="sm" />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-2xs ${m.avatarColor}`}
                        >
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-base font-extrabold text-slate-900">
                          {m.name}
                        </div>
                        <div className="text-xs font-bold text-[#4F46E5]">
                          {m.role}
                        </div>
                      </div>
                    </div>

                    {!m.isAI && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-mono tabular-nums font-bold text-emerald-700">
                        {verifiedCount}/{assignedTasks.length} verified
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {m.focus}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
                  {!m.isAI ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMemberFilter(m.name);
                          onSelectTab('tasks');
                        }}
                        className="lyner-btn-secondary flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        View {m.name}’s Tasks ({assignedTasks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatSender(m.name);
                          onSelectTab('chat');
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold cursor-pointer transition-colors"
                      >
                        Speak as {m.name}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectTab('dna')}
                      className="lyner-btn-secondary w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-[#4F46E5] cursor-pointer"
                    >
                      Ask Lyner to Refine Project DNA →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 px-5 sm:px-10 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2 pb-6 border-b border-slate-200/90">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
          Workspace Settings
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {project.name} Settings
        </h1>
      </header>
      <div className="lyner-document-sheet rounded-3xl p-7 sm:p-8 space-y-5">
        <div className="text-base font-extrabold text-slate-900">
          Living Project DNA Sections ({project.dna.length})
        </div>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Project DNA is read-only by default and adapts its structure to your project. As teammates submit work in Tasks or resolve tradeoffs in Team Chat, Lyner keeps the brief up to date.
        </p>
        <button
          type="button"
          onClick={() => onSelectTab('dna')}
          className="lyner-btn-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
        >
          Open Project DNA Brief
        </button>
      </div>
    </div>
  );
};
