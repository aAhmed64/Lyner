import React, { useState, useEffect } from 'react';
import { Project, MascotState, AIProviderStatus } from './types/lyner';
import { SEED_PROJECTS } from './data/seedProjects';
import {
  AppSidebar,
  ProjectSidebar,
  ProjectViewTab,
  Mascot,
  ContinueButton,
} from './components/ui/LynerUI';
import { NewProjectLesson } from './components/NewProjectLesson';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { aiService } from './services/aiService';
import {
  Plus,
  ArrowRight,
  AlertTriangle,
  Compass,
  Dna,
  CheckSquare,
  MessageSquare,
  Cpu,
  Check,
} from 'lucide-react';

const STORAGE_KEY = 'lyner_mvp_projects_v7';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          Array.isArray(parsed[0]?.dna) &&
          parsed[0].dna[0]?.heading
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore localStorage errors
    }
    return SEED_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeGlobalTab, setActiveGlobalTab] = useState<
    'home' | 'projects' | 'new-project' | 'settings'
  >('home');
  const [activeProjectTab, setActiveProjectTab] =
    useState<ProjectViewTab>('overview');
  const [reEntryMode, setReEntryMode] = useState<'question' | 'progress'>(
    'question'
  );
  const [previewMascotState, setPreviewMascotState] =
    useState<MascotState>('IDLE');
  const [aiStatus, setAiStatus] = useState<AIProviderStatus | null>(null);
  const [customModelIdInput, setCustomModelIdInput] = useState('');
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);

  useEffect(() => {
    aiService
      .getStatus()
      .then((st) => {
        setAiStatus(st);
        if (st.activeModel) {
          setCustomModelIdInput(st.activeModel);
        }
      })
      .catch(() =>
        setAiStatus({
          provider: 'featherless',
          connected: false,
          activeModel: null,
          activeModelFamily: null,
          availableModels: [],
          baseUrl: 'https://api.featherless.ai/v1',
          missingVariables: ['FEATHERLESS_API_KEY', 'FEATHERLESS_MODEL'],
          message: 'Unable to reach Featherless AI backend.',
        })
      );
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      // ignore storage errors
    }
  }, [projects]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || null;
  const latestProject = projects[0] || SEED_PROJECTS[0];

  const handleOpenProject = (
    projectId: string,
    tab: ProjectViewTab = 'overview'
  ) => {
    setActiveProjectId(projectId);
    setActiveProjectTab(tab);
  };

  const handleCompleteNewProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setActiveProjectTab('dna');
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleSelectFeatherlessModel = async (modelId: string) => {
    if (!modelId.trim() || isUpdatingModel) return;
    setIsUpdatingModel(true);
    try {
      const updated = await aiService.setActiveModel(modelId.trim());
      setAiStatus(updated);
      setCustomModelIdInput(updated.activeModel || modelId.trim());
    } catch {
      // ignore error
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const aiWarningBanner =
    aiStatus && !aiStatus.connected ? (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-950 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Featherless AI Configuration Needed:</strong>{' '}
            {aiStatus.message}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveProjectId(null);
            setActiveGlobalTab('settings');
          }}
          className="font-bold text-[#4F46E5] hover:underline shrink-0 cursor-pointer"
        >
          View AI Setup →
        </button>
      </div>
    ) : null;

  // Inside a specific Project Workspace
  if (activeProject) {
    return (
      <div className="min-h-screen flex lyner-ambient-bg lyner-dot-grid text-slate-900">
        <ProjectSidebar
          project={activeProject}
          activeTab={activeProjectTab}
          onSelectTab={setActiveProjectTab}
          onExitToHome={() => {
            setActiveProjectId(null);
            setActiveGlobalTab('home');
          }}
          onStartNewProject={() => {
            setActiveProjectId(null);
            setActiveGlobalTab('new-project');
          }}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {aiWarningBanner}
          <ProjectWorkspace
            project={activeProject}
            activeTab={activeProjectTab}
            onSelectTab={setActiveProjectTab}
            onUpdateProject={handleUpdateProject}
          />
        </main>
      </div>
    );
  }

  const latestVerifiedCount = latestProject.tasks.filter(
    (t) => t.status === 'VERIFIED'
  ).length;

  // Global / Pre-Project / Adaptive New Project Discovery Flow
  return (
    <div className="min-h-screen flex lyner-ambient-bg lyner-dot-grid text-slate-900">
      <AppSidebar
        activeGlobalTab={activeGlobalTab}
        onSelectGlobalTab={setActiveGlobalTab}
        projects={projects}
        onOpenProject={(id) => handleOpenProject(id, 'overview')}
      />

      <div className="flex-1 min-w-0 overflow-y-auto">
        {aiWarningBanner}

        {/* 1. ADAPTIVE NEW PROJECT DISCOVERY CONVERSATION */}
        {activeGlobalTab === 'new-project' && (
          <NewProjectLesson onCompleteProject={handleCompleteNewProject} />
        )}

        {/* 2. HOME — CONTEXTUAL DAILY RE-ENTRY + INTERACTIVE JUMP CARDS */}
        {activeGlobalTab === 'home' && (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 max-w-3xl mx-auto space-y-6">
            <div className="w-full bg-white/95 backdrop-blur-xl border-2 border-indigo-100 shadow-sm rounded-3xl p-8 sm:p-10 text-center space-y-6">
              <div className="flex justify-center">
                <Mascot
                  state={reEntryMode === 'question' ? 'HELPING' : 'CELEBRATING'}
                  size="lg"
                />
              </div>

              <div className="space-y-2.5 max-w-xl mx-auto">
                <div className="text-xs font-bold text-[#4F46E5]">
                  {latestProject.reEntryContext.greeting} · {latestProject.name}
                </div>

                {reEntryMode === 'question' ? (
                  <>
                    <h1
                      className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug"
                      style={{ textWrap: 'balance' }}
                    >
                      “{latestProject.reEntryContext.lastTimeSummary}”
                    </h1>
                    <p className="text-base text-slate-600">
                      {latestProject.reEntryContext.focusStatement}
                    </p>
                  </>
                ) : (
                  <>
                    <h1
                      className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug"
                      style={{ textWrap: 'balance' }}
                    >
                      “Nice. Youssef’s first 3-section recycling station prototype is verified.”
                    </h1>
                    <p className="text-base text-slate-600">
                      Next up: testing Salma’s two label designs with students and deciding final classroom and cafeteria bin locations.
                    </p>
                  </>
                )}
              </div>

              {/* Primary Action Row */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <ContinueButton
                  state="ready"
                  label={`Continue ${latestProject.name}`}
                  onClick={() =>
                    handleOpenProject(
                      latestProject.id,
                      reEntryMode === 'question' ? 'overview' : 'tasks'
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() => setActiveGlobalTab('new-project')}
                  className="lyner-btn-secondary inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#4F46E5] stroke-[2.5]" />
                  <span>Start a New Project</span>
                </button>
              </div>

              {/* Interactive Quick-Jump Surface Cards */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                <button
                  type="button"
                  onClick={() => handleOpenProject(latestProject.id, 'overview')}
                  className="lyner-card-interactive p-3 rounded-2xl space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#4F46E5]">
                    <Compass className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Overview
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Stage 3 Active
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenProject(latestProject.id, 'dna')}
                  className="lyner-card-interactive p-3 rounded-2xl space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#4F46E5]">
                    <Dna className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Project DNA
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {latestProject.dna.length} Brief Sections
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenProject(latestProject.id, 'tasks')}
                  className="lyner-card-interactive p-3 rounded-2xl space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#22C55E]">
                    <CheckSquare className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Team Tasks
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {latestVerifiedCount}/{latestProject.tasks.length} Verified
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenProject(latestProject.id, 'chat')}
                  className="lyner-card-interactive p-3 rounded-2xl space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#7C3AED]">
                    <MessageSquare className="w-4 h-4" />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Team Chat
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {latestProject.chat.length} Messages
                  </div>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>Contextual re-entry greeting:</span>
                <button
                  type="button"
                  onClick={() =>
                    setReEntryMode(
                      reEntryMode === 'question' ? 'progress' : 'question'
                    )
                  }
                  className="font-bold text-[#4F46E5] hover:underline cursor-pointer"
                >
                  {reEntryMode === 'question'
                    ? 'Preview Verified Progress greeting'
                    : 'Preview DNA Summary greeting'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PROJECTS LIST */}
        {activeGlobalTab === 'projects' && (
          <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#4F46E5]">
                  Collaborative Workspaces
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Team Projects
                </h1>
              </div>

              <button
                onClick={() => setActiveGlobalTab('new-project')}
                className="lyner-btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((proj) => {
                const verCount = proj.tasks.filter(
                  (t) => t.status === 'VERIFIED'
                ).length;

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj.id, 'overview')}
                    className="lyner-card-interactive rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer group"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-[#4F46E5]">
                          {proj.dna.length} DNA sections
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-bold text-emerald-700">
                          {verCount}/{proj.tasks.length} tasks verified
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {proj.members.filter((m) => !m.isAI).length} student members + Lyner
                        </span>
                      </div>

                      <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-[#4F46E5] transition-colors">
                        {proj.name}
                      </h2>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {proj.summary}
                      </p>
                    </div>

                    <div className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-xs font-bold text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. GLOBAL SETTINGS — FEATHERLESS AI ROUTING & CANONICAL MASCOT */}
        {activeGlobalTab === 'settings' && (
          <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#4F46E5]">
                Developer / Admin Configuration & Brand System
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Settings & Featherless AI Routing
              </h1>
            </div>

            {/* Featherless AI Provider & Model Routing Card */}
            <div className="bg-white/95 border-2 border-indigo-100 rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      AI Provider: Featherless AI (Server-Side Proxy)
                    </div>
                    <div className="text-xs text-slate-500">
                      Endpoint: <code className="font-mono">{aiStatus?.baseUrl || 'https://api.featherless.ai/v1'}</code>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold ${
                    aiStatus?.connected
                      ? 'text-emerald-700'
                      : 'text-amber-800'
                  }`}
                >
                  {aiStatus?.connected
                    ? '✓ Connected to Featherless AI'
                    : `⚠ Missing: ${(aiStatus?.missingVariables || []).join(', ')}`}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Required Server-Side Environment Variables (Configure in AI Studio Secrets)
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-700 space-y-1">
                  <div>
                    FEATHERLESS_API_KEY={'<your_featherless_api_key>'}
                  </div>
                  <div>
                    FEATHERLESS_MODEL={'<your_default_model_id>'}
                  </div>
                  <div className="text-slate-400 pt-1">
                    # Optional model slots for switching between DeepSeek, Kimi, and GLM:
                  </div>
                  <div>FEATHERLESS_MODEL_DEEPSEEK={'<deepseek_model_id>'}</div>
                  <div>FEATHERLESS_MODEL_KIMI={'<kimi_model_id>'}</div>
                  <div>FEATHERLESS_MODEL_GLM={'<glm_model_id>'}</div>
                </div>
              </div>

              {/* Configured Model Family Slots (DeepSeek / Kimi / GLM) */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">
                  Model Routing (DeepSeek / Kimi / GLM)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(aiStatus?.availableModels || [])
                    .filter((m) => m.family !== 'Default')
                    .map((slot) => {
                      const isCurrent =
                        aiStatus?.activeModel &&
                        slot.modelId &&
                        aiStatus.activeModel === slot.modelId;

                      return (
                        <button
                          key={slot.family}
                          type="button"
                          disabled={!slot.configured}
                          onClick={() =>
                            slot.modelId &&
                            handleSelectFeatherlessModel(slot.modelId)
                          }
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                            isCurrent
                              ? 'bg-indigo-50 border-[#4F46E5]'
                              : slot.configured
                              ? 'bg-white border-indigo-100 hover:border-[#4F46E5] cursor-pointer'
                              : 'bg-slate-50 border-slate-200/70 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900">
                              {slot.family}
                            </span>
                            {isCurrent && (
                              <Check className="w-3.5 h-3.5 text-[#4F46E5] stroke-[3]" />
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate mt-1">
                            {slot.configured
                              ? slot.modelId
                              : 'Not set in env'}
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Direct Featherless Model ID Selector */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customModelIdInput}
                    onChange={(e) => setCustomModelIdInput(e.target.value)}
                    placeholder="Enter exact Featherless model ID (e.g. deepseek-ai/DeepSeek-V3-0324)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-indigo-100 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#4F46E5]"
                  />
                  <button
                    type="button"
                    disabled={!customModelIdInput.trim() || isUpdatingModel}
                    onClick={() =>
                      handleSelectFeatherlessModel(customModelIdInput)
                    }
                    className="lyner-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isUpdatingModel ? 'Applying...' : 'Set Active Model ID'}
                  </button>
                </div>
              </div>
            </div>

            {/* Canonical Mascot State Inspector */}
            <div className="bg-white/95 border-2 border-indigo-100 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900">
                  Canonical Lyner Mascot States
                </h2>
                <p className="text-xs text-slate-500">
                  Preview how Lyner reacts across adaptive project discovery, contradiction alerts, and work verification.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-2xl border border-slate-200/70">
                <Mascot state={previewMascotState} size="xl" showLabel />
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    'IDLE',
                    'LISTENING',
                    'THINKING',
                    'CURIOUS',
                    'HELPING',
                    'EXPLAINING',
                    'CONCERNED',
                    'CELEBRATING',
                  ] as MascotState[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPreviewMascotState(st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      previewMascotState === st
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Reset workspace demo state to default GreenCycle school project
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY);
                    setProjects(SEED_PROJECTS);
                    setActiveGlobalTab('home');
                  }}
                  className="lyner-btn-secondary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reset GreenCycle Demo Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
