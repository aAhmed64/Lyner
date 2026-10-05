import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  HelpCircle,
  Plus,
  Home,
  FolderKanban,
  Settings,
  Compass,
  Dna,
  MessageSquare,
  CheckSquare,
  Activity,
  FileText,
  Users,
  Sparkles,
  Loader2,
  ChevronRight,
  Reply,
  SmilePlus,
  GitCompare,
} from 'lucide-react';
import { LynerWordmark, LynerMark } from '../Brand';
import { Mascot } from '../Mascot';
import {
  MascotState,
  EpistemicState,
  ChatMessageItem,
  VerificationStatus,
  Project,
  ProjectViewTab,
  UnderstandingStage,
} from '../../types/lyner';

export { Mascot };
export type { ProjectViewTab };

/* ==========================================================================
   1. AppSidebar (Global level)
   ========================================================================== */
interface AppSidebarProps {
  activeGlobalTab: 'home' | 'projects' | 'new-project' | 'settings';
  onSelectGlobalTab: (
    tab: 'home' | 'projects' | 'new-project' | 'settings'
  ) => void;
  projects: Project[];
  onOpenProject: (projectId: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeGlobalTab,
  onSelectGlobalTab,
  projects,
  onOpenProject,
}) => {
  return (
    <aside className="w-68 shrink-0 bg-white/90 backdrop-blur-xl border-r border-indigo-100/90 flex flex-col justify-between h-screen sticky top-0 select-none z-10 shadow-xs">
      <div className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectGlobalTab('home')}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] rounded-lg cursor-pointer"
          >
            <LynerWordmark size="md" />
          </button>
        </div>

        <div>
          <button
            onClick={() => onSelectGlobalTab('new-project')}
            className="w-full lyner-btn-primary flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>Start New Project</span>
          </button>
        </div>

        <nav className="space-y-1.5">
          <button
            onClick={() => onSelectGlobalTab('home')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeGlobalTab === 'home'
                ? 'bg-indigo-50/90 text-[#4F46E5] border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Home className="w-4 h-4 shrink-0" />
              <span>Daily Focus</span>
            </span>
            {activeGlobalTab === 'home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
            )}
          </button>

          <button
            onClick={() => onSelectGlobalTab('projects')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeGlobalTab === 'projects'
                ? 'bg-indigo-50/90 text-[#4F46E5] border border-indigo-200/80 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <FolderKanban className="w-4 h-4 shrink-0" />
              <span>All Workspaces</span>
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {projects.length}
            </span>
          </button>
        </nav>

        {projects.length > 0 && (
          <div className="pt-4 border-t border-slate-200/60 space-y-2">
            <div className="px-3.5 text-xs font-semibold text-slate-400">
              Active Team Projects
            </div>
            {projects.map((proj) => {
              const verifiedCount = proj.tasks.filter(
                (t) => t.status === 'VERIFIED'
              ).length;
              const pct =
                proj.tasks.length > 0
                  ? Math.round((verifiedCount / proj.tasks.length) * 100)
                  : 0;

              return (
                <button
                  key={proj.id}
                  onClick={() => onOpenProject(proj.id)}
                  className="w-full text-left p-3 rounded-2xl bg-indigo-50/40 hover:bg-indigo-50/90 border border-indigo-100/80 hover:border-[#4F46E5]/40 transition-all group cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-[#4F46E5] truncate">
                      {proj.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#4F46E5] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Verified progress</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-700">
                        {verifiedCount}/{proj.tasks.length}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22C55E]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-200/60 space-y-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-cyan-50/60 border border-indigo-100/80 flex items-center gap-3">
          <Mascot state="IDLE" size="sm" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900">
              Lyner Facilitator
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              Idea → DNA → Verified Work
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectGlobalTab('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
            activeGlobalTab === 'settings'
              ? 'bg-indigo-50 text-[#4F46E5]'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings & Mascot</span>
        </button>
      </div>
    </aside>
  );
};

/* ==========================================================================
   2. ProjectSidebar (Overview | DNA | Chat | Tasks | Pulse | Files | Members)
   ========================================================================== */
interface ProjectSidebarProps {
  project: Project;
  activeTab: ProjectViewTab;
  onSelectTab: (tab: ProjectViewTab) => void;
  onExitToHome: () => void;
  onStartNewProject: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  project,
  activeTab,
  onSelectTab,
  onExitToHome,
  onStartNewProject,
}) => {
  const verifiedTasksCount = project.tasks.filter(
    (t) => t.status === 'VERIFIED'
  ).length;
  const totalTasksCount = project.tasks.length;
  const progressPercent =
    totalTasksCount > 0
      ? Math.round((verifiedTasksCount / totalTasksCount) * 100)
      : 0;

  const humanMembers = project.members.filter((m) => !m.isAI);

  const primaryItems: {
    id: ProjectViewTab;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    meta?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      subtitle: 'Where are we right now?',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'dna',
      label: 'Project DNA',
      subtitle: 'What is this project?',
      icon: <Dna className="w-4 h-4" />,
      meta: `${project.dna.length}`,
    },
    {
      id: 'chat',
      label: 'Team Chat',
      subtitle: 'What are we discussing?',
      icon: <MessageSquare className="w-4 h-4" />,
      meta: `${project.chat.length}`,
    },
    {
      id: 'tasks',
      label: 'Tasks & Work',
      subtitle: 'What needs to happen?',
      icon: <CheckSquare className="w-4 h-4" />,
      meta: `${verifiedTasksCount}/${totalTasksCount}`,
    },
    {
      id: 'pulse',
      label: 'Pulse',
      subtitle: 'What meaningfully changed?',
      icon: <Activity className="w-4 h-4" />,
      meta: `${project.pulse.length}`,
    },
  ];

  const secondaryItems: {
    id: ProjectViewTab;
    label: string;
    icon: React.ReactNode;
    meta?: string;
  }[] = [
    {
      id: 'files',
      label: 'Files & Evidence',
      icon: <FileText className="w-4 h-4" />,
      meta: `${project.files.length}`,
    },
    {
      id: 'members',
      label: 'Team Roles',
      icon: <Users className="w-4 h-4" />,
      meta: `${humanMembers.length}`,
    },
  ];

  return (
    <aside className="w-72 shrink-0 bg-white/92 backdrop-blur-xl border-r border-indigo-100/90 flex flex-col justify-between h-screen sticky top-0 select-none z-10 shadow-xs">
      <div className="p-5 space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={onExitToHome}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] rounded-lg cursor-pointer"
            title="Return to Lyner Home"
          >
            <LynerWordmark size="sm" />
          </button>
          <button
            onClick={onStartNewProject}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap cursor-pointer"
            title="Start a new project"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New</span>
          </button>
        </div>

        {/* Rich Interactive Project Identity & Momentum Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/70 border border-indigo-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#4F46E5]">
              Active Workspace
            </span>
            <span className="text-[11px] font-mono tabular-nums text-emerald-700 font-bold">
              {progressPercent}% verified
            </span>
          </div>

          <div>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {project.name}
            </div>
            <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {project.rightNowFocus}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-indigo-100/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#22C55E] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Team Avatar Stack */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex -space-x-1.5 overflow-hidden">
              {humanMembers.map((m) => (
                <div
                  key={m.id}
                  title={`${m.name} (${m.role})`}
                  className={`w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white ${m.avatarColor}`}
                >
                  {m.name.slice(0, 1)}
                </div>
              ))}
              <div
                title="Lyner AI Facilitator"
                className="w-6 h-6 rounded-full ring-2 ring-white bg-[#7C3AED] flex items-center justify-center text-[9px] font-extrabold text-white"
              >
                L
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('members')}
              className="text-[11px] font-semibold text-slate-500 hover:text-[#4F46E5] cursor-pointer"
            >
              {humanMembers.length} students + Lyner
            </button>
          </div>
        </div>

        {/* Core 5 Views with Guiding Question Subtitles */}
        <nav className="space-y-1.5">
          {primaryItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#4F46E5] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-indigo-50/70 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-3 font-bold text-sm">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.meta && (
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        isActive
                          ? 'text-indigo-100 font-bold'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {item.meta}
                    </span>
                  )}
                </div>
                <div
                  className={`pl-7 text-[11px] mt-0.5 truncate ${
                    isActive
                      ? 'text-indigo-100/90'
                      : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                >
                  {item.subtitle}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/70 pt-3.5 space-y-1">
          {secondaryItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-[#4F46E5] font-bold'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.meta && (
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {item.meta}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200/70 space-y-1">
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-indigo-50 text-[#4F46E5]'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Workspace Settings</span>
        </button>
        <button
          onClick={onExitToHome}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Back to Daily Home</span>
        </button>
      </div>
    </aside>
  );
};

/* ==========================================================================
   3. UnderstandingProgressionHeader (IDEA → UNDERSTANDING → DIRECTION → DNA)
   ========================================================================== */
const STAGES_ORDER: UnderstandingStage[] = [
  'IDEA',
  'UNDERSTANDING',
  'DIRECTION',
  'DNA',
];

const STAGE_LABELS: Record<UnderstandingStage, string> = {
  IDEA: 'Rough Idea',
  UNDERSTANDING: 'Understanding',
  DIRECTION: 'Clear Direction',
  DNA: 'Project DNA',
};

export const UnderstandingProgressionHeader: React.FC<{
  currentStage: UnderstandingStage;
  onSynthesizeEarly?: () => void;
  canSynthesizeEarly?: boolean;
}> = ({ currentStage, onSynthesizeEarly, canSynthesizeEarly = false }) => {
  const currentIdx = STAGES_ORDER.indexOf(currentStage);
  const progressBarPct = Math.max(
    18,
    Math.round(((currentIdx + 1) / STAGES_ORDER.length) * 100)
  );

  return (
    <header className="w-full max-w-3xl mx-auto pt-6 pb-3 px-4 space-y-3 select-none">
      <div className="bg-white/90 backdrop-blur-md border border-indigo-100 rounded-2xl p-3.5 sm:px-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          {STAGES_ORDER.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <React.Fragment key={stage}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-[#22C55E] text-white shadow-2xs'
                        : isCurrent
                        ? 'bg-[#4F46E5] text-white ring-4 ring-indigo-100'
                        : 'bg-slate-100 border border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isCurrent
                        ? 'text-[#4F46E5]'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </span>
                </div>

                {idx < STAGES_ORDER.length - 1 && (
                  <div
                    className={`w-4 sm:w-8 h-0.5 rounded-full transition-colors ${
                      idx < currentIdx ? 'bg-[#22C55E]' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {canSynthesizeEarly && onSynthesizeEarly && currentStage !== 'DNA' && (
          <button
            type="button"
            onClick={onSynthesizeEarly}
            className="lyner-btn-secondary text-xs font-bold px-3.5 py-1.5 rounded-xl cursor-pointer shrink-0"
          >
            Review & Create DNA →
          </button>
        )}
      </div>

      {/* Smooth Duolingo-inspired progress track */}
      <div className="w-full h-2 rounded-full bg-white/80 border border-indigo-100/70 overflow-hidden p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#22D3EE] transition-all duration-500"
          style={{ width: `${progressBarPct}%` }}
        />
      </div>
    </header>
  );
};

/* ==========================================================================
   4. TextInput (with Voice Microphone & Continue Trigger)
   ========================================================================== */
export const TextInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  voiceSamplePrompts?: string[];
}> = ({
  value,
  onChange,
  placeholder = "Tell Lyner what you're thinking...",
  multiline = true,
  onSubmit,
  submitLabel = 'Continue',
  isSubmitting = false,
  onListeningChange,
  voiceSamplePrompts = [],
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      onListeningChange?.(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    setIsListening(true);
    onListeningChange?.(true);
    setVoiceHint('Listening... speak your thought clearly');

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            onChange(value ? `${value} ${transcript}` : transcript);
          }
          setIsListening(false);
          onListeningChange?.(false);
          setVoiceHint(null);
        };

        recognition.onerror = () => {
          simulateVoiceCapture();
        };

        recognition.onend = () => {
          setIsListening(false);
          onListeningChange?.(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {
        simulateVoiceCapture();
        return;
      }
    }

    simulateVoiceCapture();
  };

  const simulateVoiceCapture = () => {
    setVoiceHint('Capturing voice note...');
    setTimeout(() => {
      const sample =
        voiceSamplePrompts[0] ||
        'We want to design a school recycling station with clear visual examples so students know where plastic and paper go.';
      onChange(value ? `${value} ${sample}` : sample);
      setIsListening(false);
      onListeningChange?.(false);
      setVoiceHint('Voice transcribed');
      setTimeout(() => setVoiceHint(null), 2000);
    }, 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        className={`relative rounded-2xl bg-white shadow-sm border-2 transition-all ${
          isListening
            ? 'border-[#7C3AED] ring-4 ring-violet-100'
            : 'border-indigo-100 focus-within:border-[#4F46E5] focus-within:ring-4 focus-within:ring-indigo-100/70'
        }`}
      >
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 pt-3.5 pb-2.5 bg-transparent text-slate-900 placeholder:text-slate-400 text-base leading-relaxed resize-none focus:outline-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3.5 bg-transparent text-slate-900 placeholder:text-slate-400 text-base focus:outline-none"
          />
        )}

        {voiceHint && (
          <div className="px-4 pb-2.5 text-xs font-semibold text-[#7C3AED] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
            <span>{voiceHint}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            isListening
              ? 'bg-[#7C3AED] text-white shadow-xs'
              : 'lyner-btn-secondary'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Stop Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-[#4F46E5]" />
              <span>Speak Idea</span>
            </>
          )}
        </button>

        {onSubmit && (
          <ContinueButton
            state={
              isSubmitting
                ? 'loading'
                : value.trim().length > 0
                ? 'ready'
                : 'disabled'
            }
            label={submitLabel}
            onClick={onSubmit}
          />
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   5. ChoiceButton, MultiChoice, ContinueButton, BackButton
   ========================================================================== */
export type ChoiceVisualState =
  | 'default'
  | 'hover'
  | 'selected'
  | 'disabled'
  | 'confirmed';

export const ChoiceButton: React.FC<{
  label: string;
  state?: ChoiceVisualState;
  onClick: () => void;
  indexBadge?: string;
}> = ({ label, state = 'default', onClick, indexBadge }) => {
  const stateClasses = {
    default: 'lyner-card-interactive text-slate-800',
    hover: 'lyner-card-interactive border-[#4F46E5] text-slate-900',
    selected:
      'bg-indigo-50/95 border-2 border-[#4F46E5] text-[#4F46E5] shadow-[0_3px_0_0_#4F46E5]',
    disabled:
      'bg-slate-50 border-2 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed',
    confirmed:
      'bg-emerald-50 border-2 border-[#22C55E] text-emerald-900 shadow-[0_3px_0_0_#22C55E]',
  }[state];

  return (
    <button
      type="button"
      disabled={state === 'disabled'}
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${stateClasses}`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {indexBadge && (
          <span
            className={`w-7 h-7 rounded-xl text-xs font-mono font-bold flex items-center justify-center shrink-0 border-2 transition-colors ${
              state === 'selected'
                ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                : state === 'confirmed'
                ? 'bg-[#22C55E] text-white border-[#22C55E]'
                : 'bg-indigo-50/60 text-slate-600 border-indigo-100'
            }`}
          >
            {indexBadge}
          </span>
        )}
        <span className="leading-snug">{label}</span>
      </div>

      <div className="shrink-0">
        {state === 'selected' && (
          <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
        {state === 'confirmed' && (
          <div className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </div>
    </button>
  );
};

export const MultiChoice: React.FC<{
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}> = ({ options, selected, onToggle }) => (
  <div className="space-y-2.5 w-full">
    <div className="text-xs font-semibold text-slate-500 text-center pb-1">
      Select one or more options that fit
    </div>
    {options.map((opt, idx) => (
      <ChoiceButton
        key={opt}
        label={opt}
        indexBadge={String(idx + 1)}
        state={selected.includes(opt) ? 'selected' : 'default'}
        onClick={() => onToggle(opt)}
      />
    ))}
  </div>
);

export type ContinueButtonState =
  | 'disabled'
  | 'ready'
  | 'loading'
  | 'completed';

export const ContinueButton: React.FC<{
  state: ContinueButtonState;
  onClick: () => void;
  label?: string;
  className?: string;
}> = ({ state, onClick, label = 'Continue', className = '' }) => {
  const styles = {
    disabled:
      'bg-slate-200 text-slate-400 border-2 border-slate-200 cursor-not-allowed',
    ready: 'lyner-btn-primary cursor-pointer',
    loading: 'bg-[#4F46E5]/85 text-white cursor-wait',
    completed:
      'bg-[#22C55E] hover:bg-emerald-600 text-white shadow-[0_3px_0_0_#15803D] cursor-pointer',
  }[state];

  return (
    <button
      type="button"
      disabled={state === 'disabled' || state === 'loading'}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm sm:text-base whitespace-nowrap ${styles} ${className}`}
    >
      {state === 'loading' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Thinking...</span>
        </>
      ) : state === 'completed' ? (
        <>
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{label}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
};

export const BackButton: React.FC<{ onClick: () => void; label?: string }> = ({
  onClick,
  label = 'Back',
}) => (
  <button
    type="button"
    onClick={onClick}
    className="lyner-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
  >
    <ArrowLeft className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

/* ==========================================================================
   6. EpistemicLabel & VerificationState
   ========================================================================== */
export const EpistemicLabel: React.FC<{ state: EpistemicState }> = ({
  state,
}) => {
  const config: Record<
    EpistemicState,
    { label: string; colorClass: string; dotClass: string }
  > = {
    CONFIRMED: {
      label: 'Confirmed',
      colorClass: 'text-emerald-700',
      dotClass: 'bg-[#22C55E]',
    },
    LIKELY: {
      label: 'Likely',
      colorClass: 'text-[#4F46E5]',
      dotClass: 'bg-[#4F46E5]',
    },
    ASSUMPTION: {
      label: 'Assumption',
      colorClass: 'text-amber-700',
      dotClass: 'bg-[#F59E0B]',
    },
    OPEN: {
      label: 'Open',
      colorClass: 'text-[#7C3AED]',
      dotClass: 'bg-[#7C3AED]',
    },
    NEEDS_VERIFICATION: {
      label: 'Needs verification',
      colorClass: 'text-sky-700',
      dotClass: 'bg-sky-500',
    },
  };

  const current = config[state] || config.LIKELY;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${current.colorClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`} />
      <span>{current.label}</span>
    </span>
  );
};

export const VerificationState: React.FC<{
  status: VerificationStatus;
  feedback: string;
}> = ({ status, feedback }) => {
  const meta = {
    VERIFIED: {
      icon: <Check className="w-4 h-4 text-[#22C55E] stroke-[3]" />,
      title: '✓ Verified by Lyner',
      style: 'bg-emerald-50/95 border-emerald-200 text-emerald-950',
    },
    NEEDS_MORE_EVIDENCE: {
      icon: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
      title: '⚠ Needs more evidence',
      style: 'bg-amber-50/95 border-amber-200 text-amber-950',
    },
    UNABLE_TO_VERIFY: {
      icon: <HelpCircle className="w-4 h-4 text-[#7C3AED]" />,
      title: '? Unable to verify yet',
      style: 'bg-violet-50/95 border-violet-200 text-violet-950',
    },
    AWAITING_SUBMISSION: {
      icon: <LynerMark size={16} />,
      title: 'Ready for Team Submission',
      style: 'bg-indigo-50/60 border-indigo-100 text-slate-800',
    },
  }[status];

  return (
    <div className={`p-4 rounded-2xl border-2 ${meta.style} space-y-1.5`}>
      <div className="flex items-center gap-2 text-xs font-bold">
        {meta.icon}
        <span>{meta.title}</span>
      </div>
      <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{feedback}</p>
    </div>
  );
};

/* ==========================================================================
   7. ChatMessage (Slack + Modern Collaborative Team Studio)
   ========================================================================== */
export const ChatMessage: React.FC<{
  message: ChatMessageItem;
  isSameSenderAsPrevious?: boolean;
  onReplyClick?: (message: ChatMessageItem) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onSelectTradeoffOption?: (messageId: string, chosenProtocol: string) => void;
  onResolveContradiction?: (messageId: string, chosenResolution: string) => void;
  onAcceptDnaProposal?: (
    messageId: string,
    sectionHeading: string,
    updatedBody: string,
    updatedBullets?: string[],
    reason?: string
  ) => void;
  onRejectDnaProposal?: (messageId: string) => void;
  onNavigateTab?: (tab: ProjectViewTab, targetId?: string) => void;
}> = ({
  message,
  isSameSenderAsPrevious = false,
  onReplyClick,
  onToggleReaction,
  onSelectTradeoffOption,
  onResolveContradiction,
  onAcceptDnaProposal,
  onRejectDnaProposal,
  onNavigateTab,
}) => {
  const [showCompareDrawer, setShowCompareDrawer] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDnaReview, setShowDnaReview] = useState(true);
  const [isEditingProposedDna, setIsEditingProposedDna] = useState(false);
  const [editedProposedBody, setEditedProposedBody] = useState(
    message.proposedDnaChange?.proposedBody || ''
  );

  const isLyner = message.senderType === 'lyner';
  const isUser = message.senderType === 'user';

  const quickEmojis = ['👍', '💡', '🔥', '👀', '✅'];

  return (
    <div
      className={`group relative transition-all ${
        isLyner
          ? 'mt-7 mb-2 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#F3F5FF] via-white to-[#F7F4FF] border border-indigo-200/80 border-l-4 border-l-[#4F46E5] shadow-xs'
          : isUser
          ? `${
              isSameSenderAsPrevious ? 'mt-2' : 'mt-6'
            } rounded-2xl p-4 sm:p-5 bg-[#4F46E5] text-white shadow-xs ml-8 sm:ml-20`
          : `${
              isSameSenderAsPrevious ? 'mt-2' : 'mt-6'
            } rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/85 shadow-2xs mr-4 sm:mr-14`
      }`}
    >
      {/* Reply Quote Preview if replying to an earlier message */}
      {message.replyTo && (
        <div
          className={`mb-3 pl-3.5 border-l-2 text-xs rounded-r-xl py-1.5 px-3 ${
            isUser
              ? 'border-indigo-200 text-indigo-100 bg-indigo-700/50'
              : 'border-[#4F46E5] text-slate-600 bg-slate-50'
          }`}
        >
          <span className="font-bold">{message.replyTo.senderName}: </span>
          <span className="italic">“{message.replyTo.preview}”</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar — hidden on consecutive messages from same human speaker to group visually */}
        {isLyner ? (
          <Mascot
            state={message.mascotState || 'EXPLAINING'}
            size="sm"
            className="-mt-1 shrink-0"
          />
        ) : isSameSenderAsPrevious ? (
          <div className="w-10 shrink-0 flex justify-center pt-1">
            <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {message.timestamp}
            </span>
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-2xs ${
              isUser
                ? 'bg-indigo-800'
                : message.avatarColor || 'bg-slate-700'
            }`}
          >
            {message.senderName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header: Name · Role · Timestamp + Hover Actions */}
          {(!isSameSenderAsPrevious || isLyner) && (
            <div className="flex items-center justify-between gap-2">
              <div
                className={`flex flex-wrap items-center gap-2 text-xs ${
                  isUser ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                <span
                  className={`text-sm font-extrabold ${
                    isLyner
                      ? 'text-[#4F46E5]'
                      : isUser
                      ? 'text-white'
                      : 'text-slate-900'
                  }`}
                >
                  {message.senderName}
                </span>
                {message.senderRole && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-500">
                      {message.senderRole}
                    </span>
                  </>
                )}
                {isLyner && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100/80 text-[#4F46E5] font-bold text-[11px]">
                    AI Facilitator
                  </span>
                )}
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-slate-400">
                  {message.timestamp}
                </span>
              </div>

              {/* Message Actions (Reply & React) */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {onToggleReaction && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isUser
                          ? 'hover:bg-indigo-500 text-indigo-100'
                          : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                      }`}
                      title="Add reaction"
                    >
                      <SmilePlus className="w-3.5 h-3.5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex items-center gap-1">
                        {quickEmojis.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              onToggleReaction(message.id, em);
                              setShowEmojiPicker(false);
                            }}
                            className="w-7 h-7 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-sm cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {onReplyClick && (
                  <button
                    type="button"
                    onClick={() => onReplyClick(message)}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isUser
                        ? 'hover:bg-indigo-500 text-indigo-100'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                    }`}
                    title="Reply in chat"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Message Body */}
          <p
            className={`text-[15px] leading-[1.7] max-w-[66ch] whitespace-pre-line ${
              isUser ? 'text-white' : 'text-slate-800'
            }`}
          >
            {message.content}
          </p>

          {/* Linked Task / File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-2">
              {message.attachments.map((att, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    onNavigateTab?.(
                      att.type === 'task' ? 'tasks' : 'files',
                      att.targetId
                    )
                  }
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isUser
                      ? 'bg-indigo-700/80 text-white hover:bg-indigo-800'
                      : 'bg-white border border-indigo-200 text-[#4F46E5] hover:border-[#4F46E5] shadow-2xs'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{att.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {/* Contradiction Alert Box */}
          {message.contradictionDetected && (
            <div className="mt-2 p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <span>Contradiction with Project DNA Detected</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div>
                  <span className="font-bold">Earlier in DNA: </span>
                  <span>{message.contradictionDetected.earlierStatement}</span>
                </div>
                <div>
                  <span className="font-bold">New statement: </span>
                  <span>
                    {message.contradictionDetected.conflictingStatement}
                  </span>
                </div>
              </div>
              <p className="text-xs font-bold">
                {message.contradictionDetected.question}
              </p>
              {message.contradictionDetected.resolvedWith ? (
                <div className="text-xs font-bold text-emerald-700">
                  ✓ Resolved: {message.contradictionDetected.resolvedWith}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(message.contradictionDetected.resolutionOptions || []).map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          onResolveContradiction?.(message.id, opt)
                        }
                        className="lyner-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lyner Interactive Tradeoff Comparison */}
          {message.tradeoffComparison && (
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompareDrawer(!showCompareDrawer)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-indigo-200 hover:border-[#4F46E5] text-[#4F46E5] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>
                    {showCompareDrawer
                      ? 'Hide side-by-side comparison'
                      : 'Compare options side-by-side'}
                  </span>
                </button>

                {message.tradeoffComparison.resolvedOption && (
                  <span className="text-xs font-bold text-emerald-700">
                    ✓ Team Decision Recorded: {message.tradeoffComparison.resolvedOption}
                  </span>
                )}
              </div>

              {showCompareDrawer && (
                <div className="p-4 rounded-2xl bg-white border-2 border-indigo-100 space-y-3 shadow-xs">
                  <div className="text-xs font-bold text-slate-900">
                    Decision Comparison: {message.tradeoffComparison.topic}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[#4F46E5]">
                          {message.tradeoffComparison.optionA.name}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {message.tradeoffComparison.optionA.summary}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Best when: {message.tradeoffComparison.optionA.bestWhen}
                        </p>
                      </div>
                      {onSelectTradeoffOption && (
                        <button
                          type="button"
                          onClick={() =>
                            onSelectTradeoffOption(
                              message.id,
                              message.tradeoffComparison!.optionA.name
                            )
                          }
                          className="lyner-btn-secondary mt-2 w-full py-2 px-3 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Choose Option A for DNA
                        </button>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[#7C3AED]">
                          {message.tradeoffComparison.optionB.name}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {message.tradeoffComparison.optionB.summary}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Best when: {message.tradeoffComparison.optionB.bestWhen}
                        </p>
                      </div>
                      {onSelectTradeoffOption && (
                        <button
                          type="button"
                          onClick={() =>
                            onSelectTradeoffOption(
                              message.id,
                              message.tradeoffComparison!.optionB.name
                            )
                          }
                          className="lyner-btn-primary mt-2 w-full py-2 px-3 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Choose Option B for DNA
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proposed Project DNA Update Card (Accept / Edit / Reject) */}
          {message.proposedDnaChange && (
            <div className="mt-2 p-4 rounded-2xl bg-white border-2 border-indigo-200/90 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4F46E5]">
                  <Dna className="w-4 h-4 shrink-0" />
                  <span>
                    Proposed Project DNA Update ·{' '}
                    {message.proposedDnaChange.sectionHeading}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDnaReview(!showDnaReview)}
                  className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                >
                  {showDnaReview ? 'Hide review' : 'Review change'}
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Reason:</strong> {message.proposedDnaChange.reason}
              </p>

              {showDnaReview && (
                <div className="space-y-3 pt-1">
                  {isEditingProposedDna ? (
                    <textarea
                      value={editedProposedBody}
                      onChange={(e) => setEditedProposedBody(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-xl border-2 border-[#4F46E5] text-xs sm:text-sm text-slate-900 leading-relaxed focus:outline-none"
                    />
                  ) : (
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {editedProposedBody ||
                        message.proposedDnaChange.proposedBody}
                    </div>
                  )}

                  {message.proposedDnaChange.status === 'accepted' ||
                  message.proposedDnaChange.status === 'edited' ? (
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-700">
                      <span>✓ Applied to Project DNA & recorded in Pulse</span>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('dna')}
                          className="underline hover:text-emerald-900 cursor-pointer"
                        >
                          Open Project DNA →
                        </button>
                      )}
                    </div>
                  ) : message.proposedDnaChange.status === 'rejected' ? (
                    <div className="text-xs font-bold text-slate-400">
                      Proposed DNA change dismissed
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onAcceptDnaProposal?.(
                            message.id,
                            message.proposedDnaChange!.sectionHeading,
                            editedProposedBody ||
                              message.proposedDnaChange!.proposedBody,
                            message.proposedDnaChange!.proposedBullets,
                            message.proposedDnaChange!.reason
                          );
                          setIsEditingProposedDna(false);
                        }}
                        className="lyner-btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>
                          {isEditingProposedDna
                            ? 'Save & Accept'
                            : 'Accept DNA Change'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setIsEditingProposedDna(!isEditingProposedDna)
                        }
                        className="lyner-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {isEditingProposedDna ? 'Cancel Edit' : 'Edit'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRejectDnaProposal?.(message.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Knowledge Impact Link */}
          {message.knowledgeImpact && (
            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#4F46E5]">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {message.knowledgeImpact.target}:{' '}
                  {message.knowledgeImpact.summary}
                </span>
              </span>
              {message.knowledgeImpact.linkedTab && onNavigateTab && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateTab(message.knowledgeImpact!.linkedTab!)
                  }
                  className="font-bold underline hover:text-[#4338CA] cursor-pointer"
                >
                  Open {message.knowledgeImpact.linkedTab.toUpperCase()} →
                </button>
              )}
            </div>
          )}

          {/* Emoji Reactions Row */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => onToggleReaction?.(message.id, r.emoji)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    r.userReacted
                      ? 'bg-indigo-100 text-[#4F46E5] border border-indigo-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="tabular-nums text-[11px]">{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
