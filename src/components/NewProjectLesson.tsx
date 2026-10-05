import React, { useState, useRef, useEffect } from 'react';
import {
  DiscoveryMessage,
  DiscoveryTurnResponse,
  ProjectUnderstanding,
  UnderstandingStage,
  Project,
  MascotState,
  InteractionType,
  DiscoveryReflectionSummary,
} from '../types/lyner';
import {
  EMPTY_PROJECT_UNDERSTANDING,
  INITIAL_DISCOVERY_STARTERS,
} from '../data/seedProjects';
import {
  UnderstandingProgressionHeader,
  Mascot,
  TextInput,
  ChoiceButton,
  MultiChoice,
  ContinueButton,
} from './ui/LynerUI';
import {
  sendDiscoveryTurn,
  synthesizeProjectFromDiscovery,
} from '../services/lynerApi';
import {
  AlertTriangle,
  Sparkles,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';

interface NewProjectLessonProps {
  onCompleteProject: (newProject: Project) => void;
  onCancel?: () => void;
}

export const NewProjectLesson: React.FC<NewProjectLessonProps> = ({
  onCompleteProject,
}) => {
  const [understanding, setUnderstanding] = useState<ProjectUnderstanding>(
    EMPTY_PROJECT_UNDERSTANDING
  );
  const [stage, setStage] = useState<UnderstandingStage>('IDEA');
  const [messages, setMessages] = useState<DiscoveryMessage[]>([
    {
      id: 'msg-init',
      role: 'lyner',
      content:
        "What are you thinking about building? Start as rough as you like — we'll figure it out together.",
      mascotState: 'CURIOUS',
      intent: 'question',
      timestamp: 'Now',
    },
  ]);

  // Current interaction state controlled by the AI
  const [currentInteractionType, setCurrentInteractionType] =
    useState<InteractionType>('TEXT');
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [currentPlaceholder, setCurrentPlaceholder] = useState<string>(
    "Tell Lyner what you're thinking..."
  );
  const [activeMascotState, setActiveMascotState] =
    useState<MascotState>('CURIOUS');
  const [reflectionSummary, setReflectionSummary] =
    useState<DiscoveryReflectionSummary | null>(null);
  const [customProjectName, setCustomProjectName] = useState<string>('');

  // User input controls
  const [textInput, setTextInput] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [customTextOverride, setCustomTextOverride] = useState(false);
  const [showUnderstandingDrawer, setShowUnderstandingDrawer] = useState(false);

  // Async & error states
  const [isThinking, setIsThinking] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, reflectionSummary]);

  const resetTurnInputs = () => {
    setTextInput('');
    setSelectedChoice('');
    setSelectedMulti([]);
    setCustomTextOverride(false);
  };

  const getEffectiveUserResponse = (): string => {
    if (currentInteractionType === 'TEXT' || customTextOverride) {
      return textInput.trim();
    }
    if (
      currentInteractionType === 'CHOICES' ||
      currentInteractionType === 'CONFIRMATION'
    ) {
      return selectedChoice.trim();
    }
    if (currentInteractionType === 'MULTI_CHOICE') {
      return selectedMulti.join(', ').trim();
    }
    return textInput.trim();
  };

  const handleSendTurn = async (
    overrideMessage?: string,
    forceReflection = false
  ) => {
    const messageToSend = (
      overrideMessage ?? getEffectiveUserResponse()
    ).trim();
    if (!messageToSend || isThinking || isSynthesizing) return;

    setApiError(null);
    setIsThinking(true);

    const userMsg: DiscoveryMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    resetTurnInputs();

    try {
      const aiResult: DiscoveryTurnResponse = await sendDiscoveryTurn({
        userMessage: messageToSend,
        understanding,
        history: nextHistory,
        forceReflection,
      });

      setUnderstanding(aiResult.understandingUpdate);
      setStage(aiResult.understandingStage || 'UNDERSTANDING');
      setActiveMascotState(aiResult.mascotState || 'HELPING');
      setCurrentInteractionType(
        aiResult.readyForReflection
          ? 'REFLECTION'
          : aiResult.interactionType || 'TEXT'
      );
      setCurrentOptions(aiResult.options || []);
      setCurrentPlaceholder(
        aiResult.placeholder || "Tell Lyner what you're thinking..."
      );

      if (aiResult.reflectionSummary) {
        setReflectionSummary(aiResult.reflectionSummary);
        if (aiResult.reflectionSummary.projectNameSuggested) {
          setCustomProjectName(aiResult.reflectionSummary.projectNameSuggested);
        }
      }

      const lynerMsg: DiscoveryMessage = {
        id: `lyner-${Date.now()}`,
        role: 'lyner',
        content: aiResult.message,
        mascotState: aiResult.mascotState,
        intent: aiResult.intent,
        contradictionAlert: aiResult.contradictionAlert,
        reflectionSummary: aiResult.reflectionSummary,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, lynerMsg]);
    } catch (err: any) {
      setApiError(
        err?.message ||
          "Lyner couldn't respond right now. Try again in a moment."
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleSynthesizeProjectDNA = async () => {
    if (isSynthesizing) return;
    setApiError(null);
    setIsSynthesizing(true);

    try {
      const synthesized = await synthesizeProjectFromDiscovery({
        understanding,
        history: messages,
        customProjectName: customProjectName.trim() || undefined,
      });

      const projectId = `proj-${Date.now()}`;
      const finalName =
        customProjectName.trim() || synthesized.name || 'Untitled Project';

      const createdTasks = (synthesized.tasks || []).map((t, index) => ({
        id: `task-${Date.now()}-${index + 1}`,
        title: t.title,
        goal: t.goal,
        discipline: t.discipline || 'General',
        assigneeName: t.assigneeName || 'Ahmed',
        assigneeRole: t.assigneeRole || 'Project Coordination',
        status: 'AWAITING_SUBMISSION' as const,
        verificationEvaluation:
          'Ready for submission. Share what you did, how you implemented it, the result, and evidence.',
        submissions: [],
      }));

      const newProject: Project = {
        id: projectId,
        name: finalName,
        summary: synthesized.summary,
        currentDirection: synthesized.currentDirection,
        rightNowFocus: synthesized.rightNowFocus,
        nextActionPrompt:
          synthesized.nextActionPrompt ||
          'Read your synthesized Project DNA or begin executing the initial tasks.',
        reEntryContext: {
          greeting: 'Welcome back.',
          lastTimeSummary: `We synthesized the Project DNA for ${finalName} from our discovery conversation.`,
          focusStatement:
            'Ready to review the Project DNA brief or check the initial team tasks?',
          targetView: 'dna',
        },
        createdAt: new Date().toISOString().slice(0, 10),
        understanding,
        dna: synthesized.dna || [],
        tasks: createdTasks,
        pulse: [
          {
            id: `pulse-${Date.now()}-1`,
            type: 'decision_confirmed',
            symbol: '◆',
            headline: '◆ Project DNA synthesized from understanding',
            whatChanged: `Lyner synthesized the ${finalName} Project DNA brief (${
              (synthesized.dna || []).length
            } sections) and ${createdTasks.length} initial tasks.`,
            whyItMatters:
              'Transforms our discovery conversation into a clear, readable shared project brief.',
            whenItHappened: 'Just now',
            whereItCameFrom: 'Adaptive Discovery Conversation',
            actor: 'Lyner & You',
            linkedSource: {
              tab: 'dna',
              label: 'Read Project DNA',
            },
          },
          {
            id: `pulse-${Date.now()}-2`,
            type: 'direction_changed',
            symbol: '→',
            headline: '→ First direction established',
            whatChanged: synthesized.currentDirection,
            whyItMatters:
              'Focuses the team on proving the core concept before expanding scope.',
            whenItHappened: 'Just now',
            whereItCameFrom: 'Project DNA Synthesis',
            actor: 'Lyner',
            linkedSource: {
              tab: 'tasks',
              label: 'View Initial Tasks',
            },
          },
        ],
        chat: [
          {
            id: `chat-${Date.now()}-1`,
            senderType: 'lyner',
            senderName: 'Lyner',
            mascotState: 'HELPING',
            content: `I've synthesized our discovery conversation into the Project DNA for ${finalName}.\n\nCurrent direction: ${synthesized.currentDirection}\n\nAs the team works and discusses ideas here, I'll help keep the DNA accurate and flag any contradictions.`,
            timestamp: 'Just now',
          },
        ],
        files: [
          {
            id: `file-${Date.now()}-1`,
            name: 'discovery_conversation_transcript.md',
            type: 'Discovery Notes',
            summary: `Original discovery conversation that formed the ${finalName} Project DNA.`,
            linkedSectionHeading: 'PROBLEM',
            updatedAt: 'Just now',
          },
        ],
        members: [
          {
            id: 'mem-ahmed',
            name: 'Ahmed',
            role: 'Project Coordination',
            avatarColor: 'bg-indigo-600',
            focus: 'Organizing tasks, station placement & final presentation',
          },
          {
            id: 'mem-mariam',
            name: 'Mariam',
            role: 'Research',
            avatarColor: 'bg-emerald-600',
            focus: 'Student surveys, interviews & problem research',
          },
          {
            id: 'mem-youssef',
            name: 'Youssef',
            role: 'Prototype Design',
            avatarColor: 'bg-sky-600',
            focus: 'Building and testing the physical/visual prototype',
          },
          {
            id: 'mem-salma',
            name: 'Salma',
            role: 'Visual Design & Communication',
            avatarColor: 'bg-amber-600',
            focus: 'Clear labels, signage & student awareness materials',
          },
          {
            id: 'mem-lyner',
            name: 'Lyner',
            role: 'AI Facilitator',
            avatarColor: 'bg-violet-600',
            focus:
              'Maintains Project DNA, checks contradictions & verifies task outcomes',
            isAI: true,
          },
        ],
      };

      onCompleteProject(newProject);
    } catch (err: any) {
      setApiError(
        err?.message ||
          "Lyner couldn't respond right now. Try again in a moment."
      );
      setIsSynthesizing(false);
    }
  };

  const userTurnCount = messages.filter((m) => m.role === 'user').length;
  const latestLynerMsg =
    [...messages].reverse().find((m) => m.role === 'lyner') || messages[0];

  const displayedMascotState: MascotState =
    isThinking || isSynthesizing
      ? 'THINKING'
      : isVoiceListening
      ? 'LISTENING'
      : activeMascotState;

  return (
    <div className="min-h-screen flex flex-col justify-between lyner-ambient-bg lyner-dot-grid pb-8">
      {/* Top Understanding Progression Header (IDEA → UNDERSTANDING → DIRECTION → DNA) */}
      <UnderstandingProgressionHeader
        currentStage={stage}
        canSynthesizeEarly={
          userTurnCount >= 2 && currentInteractionType !== 'REFLECTION'
        }
        onSynthesizeEarly={() =>
          handleSendTurn(
            'Please summarize what you understand so far so we can review and create the Project DNA.',
            true
          )
        }
      />

      {/* Main Centered Conversational Discovery Surface */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 flex flex-col justify-between gap-6">
        {/* Conversation History Thread (Prior Exchanges) */}
        {messages.length > 1 && (
          <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
            {messages.slice(0, -1).map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#4F46E5] text-white font-medium shadow-xs'
                      : 'bg-white/90 backdrop-blur-xs border border-indigo-100 text-slate-700 shadow-2xs'
                  }`}
                >
                  <div
                    className={`text-[11px] font-bold mb-0.5 ${
                      msg.role === 'user' ? 'text-indigo-200' : 'text-[#4F46E5]'
                    }`}
                  >
                    {msg.role === 'user' ? 'You' : 'Lyner'}
                  </div>
                  <div className="whitespace-pre-line">{msg.content}</div>
                </div>
              </div>
            ))}
            <div ref={threadEndRef} />
          </div>
        )}

        {/* Active Focus Card: Lyner + Current Exchange + One Clear Action */}
        <div className="my-auto bg-white/92 backdrop-blur-xl border-2 border-indigo-100/90 rounded-3xl p-6 sm:p-9 shadow-sm space-y-6">
          {/* Lyner Mascot & Latest Prompt */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Mascot state={displayedMascotState} size="lg" />
            <div className="text-xs font-bold tracking-tight text-[#4F46E5]">
              Lyner · Collaborative Discovery
            </div>

            {isThinking ? (
              <div className="px-5 py-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-2.5 text-sm font-bold text-[#4F46E5]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking through your idea...</span>
              </div>
            ) : (
              <div className="space-y-3 max-w-xl">
                {/* Contradiction Alert if detected */}
                {latestLynerMsg.contradictionAlert && (
                  <div className="p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-amber-950 text-left space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                      <span>Hold on — let’s check a contradiction</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {latestLynerMsg.contradictionAlert}
                    </p>
                  </div>
                )}

                <h1
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug whitespace-pre-line"
                  style={{ textWrap: 'balance' }}
                >
                  {latestLynerMsg.content}
                </h1>
              </div>
            )}
          </div>

          {/* Honest API Error Notice */}
          {apiError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">AI Connection Error</div>
                <p className="text-xs leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          {/* ==============================================================
              AI REFLECTION STATE (Before creating Project DNA)
             ============================================================== */}
          {!isThinking &&
            currentInteractionType === 'REFLECTION' &&
            reflectionSummary && (
              <div className="rounded-2xl p-5 sm:p-6 bg-indigo-50/40 border-2 border-indigo-100 space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-3.5">
                  <div>
                    <div className="text-xs font-bold text-[#4F46E5]">
                      Here’s what I think we’re building
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Confirm this understanding before Lyner synthesizes your Project DNA brief.
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-[#7C3AED] shrink-0" />
                </div>

                {/* Editable Project Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={customProjectName}
                    onChange={(e) => setCustomProjectName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-indigo-100 font-extrabold text-lg text-slate-900 focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                {/* Synthesized Understanding Paragraphs */}
                <div className="space-y-3 text-slate-800 text-base leading-relaxed">
                  {(reflectionSummary.summaryParagraphs || []).map(
                    (para, index) => (
                      <p key={index}>{para}</p>
                    )
                  )}
                </div>

                {/* Open / Undecided items (No Forced Certainty!) */}
                {reflectionSummary.undecidedItems &&
                  reflectionSummary.undecidedItems.length > 0 && (
                    <div className="p-4 rounded-xl bg-white border border-indigo-100 space-y-2">
                      <div className="text-xs font-bold text-[#7C3AED]">
                        Intentionally left open for the team to test later
                      </div>
                      <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
                        {reflectionSummary.undecidedItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {!customTextOverride ? (
                  <div className="pt-2 space-y-3">
                    <div className="text-sm font-bold text-slate-900 text-center">
                      Does this represent what you mean?
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        disabled={isSynthesizing}
                        onClick={handleSynthesizeProjectDNA}
                        className="w-full sm:w-auto lyner-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm sm:text-base cursor-pointer disabled:opacity-60"
                      >
                        {isSynthesizing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Synthesizing Project DNA...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Yes, create the DNA</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSynthesizing}
                        onClick={() => setCustomTextOverride(true)}
                        className="w-full sm:w-auto lyner-btn-secondary px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer"
                      >
                        Not quite
                      </button>

                      <button
                        type="button"
                        disabled={isSynthesizing}
                        onClick={() => {
                          setCurrentInteractionType('TEXT');
                          setCustomTextOverride(true);
                        }}
                        className="w-full sm:w-auto lyner-btn-secondary px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer"
                      >
                        Keep exploring
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <TextInput
                      value={textInput}
                      onChange={setTextInput}
                      placeholder="Tell Lyner what to adjust or what we should explore further..."
                      submitLabel="Update Understanding"
                      isSubmitting={isThinking}
                      onSubmit={() => handleSendTurn()}
                      onListeningChange={setIsVoiceListening}
                    />
                  </div>
                )}
              </div>
            )}

          {/* ==============================================================
              ADAPTIVE SINGLE INTERACTION AREA (TEXT / CHOICES / MULTI)
             ============================================================== */}
          {!isThinking && currentInteractionType !== 'REFLECTION' && (
            <div className="w-full space-y-4">
              {(currentInteractionType === 'TEXT' || customTextOverride) && (
                <div className="space-y-4">
                  <TextInput
                    value={textInput}
                    onChange={setTextInput}
                    placeholder={currentPlaceholder}
                    isSubmitting={isThinking}
                    onSubmit={() => handleSendTurn()}
                    onListeningChange={setIsVoiceListening}
                    voiceSamplePrompts={INITIAL_DISCOVERY_STARTERS}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {customTextOverride ? (
                      <button
                        type="button"
                        onClick={() => setCustomTextOverride(false)}
                        className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                      >
                        ← Back to suggested options
                      </button>
                    ) : (
                      <span />
                    )}

                    {userTurnCount >= 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSendTurn(
                            "We don't need to decide that yet — let's leave it open for now."
                          )
                        }
                        className="text-xs font-semibold text-slate-500 hover:text-[#4F46E5] transition-colors cursor-pointer"
                      >
                        We don’t need to decide this yet →
                      </button>
                    )}
                  </div>

                  {/* Starter rough ideas on the very first turn */}
                  {userTurnCount === 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-[#4F46E5]" />
                        <span>Try a sample rough idea to see how Lyner thinks:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {INITIAL_DISCOVERY_STARTERS.map((example) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => setTextInput(example)}
                            className="p-3 rounded-xl bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100 hover:border-[#4F46E5] text-xs font-semibold text-slate-700 hover:text-[#4F46E5] transition-all cursor-pointer text-left leading-relaxed"
                          >
                            “{example}”
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(currentInteractionType === 'CHOICES' ||
                currentInteractionType === 'CONFIRMATION') &&
                !customTextOverride && (
                  <div className="space-y-2.5">
                    {currentOptions.map((opt, idx) => (
                      <ChoiceButton
                        key={opt}
                        label={opt}
                        indexBadge={String(idx + 1)}
                        state={selectedChoice === opt ? 'selected' : 'default'}
                        onClick={() => setSelectedChoice(opt)}
                      />
                    ))}

                    <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setCustomTextOverride(true)}
                          className="text-xs font-bold text-slate-600 hover:text-[#4F46E5] transition-colors cursor-pointer"
                        >
                          Or reply in your own words...
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendTurn(
                              "We don't need to decide that yet — leave it open."
                            )
                          }
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          Decide later
                        </button>
                      </div>

                      <ContinueButton
                        state={selectedChoice ? 'ready' : 'disabled'}
                        onClick={() => handleSendTurn()}
                      />
                    </div>
                  </div>
                )}

              {currentInteractionType === 'MULTI_CHOICE' &&
                !customTextOverride && (
                  <div className="space-y-3">
                    <MultiChoice
                      options={currentOptions}
                      selected={selectedMulti}
                      onToggle={(opt) =>
                        setSelectedMulti((prev) =>
                          prev.includes(opt)
                            ? prev.filter((item) => item !== opt)
                            : [...prev, opt]
                        )
                      }
                    />
                    <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setCustomTextOverride(true)}
                        className="text-xs font-bold text-slate-600 hover:text-[#4F46E5] transition-colors cursor-pointer"
                      >
                        Or describe in your own words...
                      </button>

                      <ContinueButton
                        state={selectedMulti.length > 0 ? 'ready' : 'disabled'}
                        onClick={() => handleSendTurn()}
                      />
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </main>

      {/* Expandable Live Understanding Inspector */}
      <footer className="max-w-2xl mx-auto w-full px-4 pt-2">
        {understanding.idea && (
          <div className="bg-white/90 backdrop-blur-md border border-indigo-100 rounded-2xl p-3.5 shadow-2xs space-y-3">
            <button
              type="button"
              onClick={() =>
                setShowUnderstandingDrawer(!showUnderstandingDrawer)
              }
              className="w-full flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0" />
                <span className="font-bold text-[#4F46E5] shrink-0">
                  Live Understanding:
                </span>
                <span className="truncate font-medium">
                  {understanding.idea}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400 font-semibold shrink-0">
                <span>{showUnderstandingDrawer ? 'Hide' : 'Inspect'}</span>
                {showUnderstandingDrawer ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </button>

            {showUnderstandingDrawer && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left">
                {understanding.problem && (
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <div className="font-bold text-slate-500">Problem</div>
                    <div className="text-slate-800 mt-0.5">
                      {understanding.problem}
                    </div>
                  </div>
                )}
                {understanding.users && (
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <div className="font-bold text-slate-500">Target Users</div>
                    <div className="text-slate-800 mt-0.5">
                      {understanding.users}
                    </div>
                  </div>
                )}
                {understanding.proposed_solution && (
                  <div className="p-2.5 rounded-xl bg-slate-50 sm:col-span-2">
                    <div className="font-bold text-slate-500">
                      Emerging Direction
                    </div>
                    <div className="text-slate-800 mt-0.5">
                      {understanding.proposed_solution}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};
