import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getFeatherlessConfig,
  setRuntimeFeatherlessModel,
  callFeatherlessJSON,
} from './src/server/aiConfig.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  /* ========================================================================
     1. FEATHERLESS AI STATUS & MODEL ROUTING CONFIGURATION
     ======================================================================== */
  app.get('/api/lyner/ai-status', (_req, res) => {
    const cfg = getFeatherlessConfig();

    let message = 'Connected to Featherless AI.';
    if (cfg.missingVariables.length > 0) {
      message = `Missing required environment configuration: ${cfg.missingVariables.join(
        ', '
      )}. Configure these in AI Studio Secrets to enable live Featherless AI.`;
    }

    res.json({
      provider: cfg.provider,
      connected: cfg.connected,
      activeModel: cfg.activeModel,
      activeModelFamily: cfg.activeModelFamily,
      availableModels: cfg.availableModels,
      baseUrl: cfg.baseUrl,
      missingVariables: cfg.missingVariables,
      message,
    });
  });

  app.post('/api/lyner/ai-config', (req, res) => {
    const { modelId } = req.body as { modelId?: string };
    if (!modelId || !modelId.trim()) {
      return res.status(400).json({
        error: 'A valid Featherless model ID is required.',
      });
    }

    setRuntimeFeatherlessModel(modelId.trim());
    const cfg = getFeatherlessConfig();

    res.json({
      provider: cfg.provider,
      connected: cfg.connected,
      activeModel: cfg.activeModel,
      activeModelFamily: cfg.activeModelFamily,
      availableModels: cfg.availableModels,
      baseUrl: cfg.baseUrl,
      missingVariables: cfg.missingVariables,
      message: cfg.connected
        ? `Switched active Featherless model to ${cfg.activeModel}.`
        : `Selected model ${cfg.activeModel}. Waiting for FEATHERLESS_API_KEY.`,
    });
  });

  /* ========================================================================
     2. NEW PROJECT — ADAPTIVE AI DISCOVERY CONVERSATION
     ======================================================================== */
  app.post('/api/lyner/discovery-turn', async (req, res) => {
    try {
      const { userMessage, understanding, history, forceReflection } =
        req.body as {
          userMessage: string;
          understanding: any;
          history: { role: 'lyner' | 'user'; content: string }[];
          forceReflection?: boolean;
        };

      const systemPrompt = `You are guiding a user or student team through the NEW PROJECT discovery flow in LYNER.
Principle: LYNER must UNDERSTAND the project before it STRUCTURES the project.
This is NOT a fixed questionnaire. Ask ONE adaptive, high-value question at a time based on what the user just said.

Rules:
1. Update the internal understanding object with what is known so far.
2. Determine what is already understood, what is missing, and whether another question is actually necessary.
3. If the user says they don't know yet or want to decide later, record it in "uncertainties" and do NOT force premature certainty.
4. Check if the user's new statement contradicts something they said earlier; if so, set "intent": "contradiction" and populate "contradictionAlert".
5. When enough core understanding is reached (usually after 3-5 meaningful exchanges, or if forceReflection is true), set "readyForReflection": true, "interactionType": "REFLECTION", "understandingStage": "DIRECTION", and provide "reflectionSummary".

Return a JSON object with this exact structure:
{
  "message": "Your concise, thoughtful response or next question (1-3 sentences)",
  "intent": "question" | "clarification" | "reflection" | "contradiction" | "synthesis_ready",
  "mascotState": "CURIOUS" | "HELPING" | "EXPLAINING" | "CONCERNED" | "CELEBRATING",
  "understandingStage": "IDEA" | "UNDERSTANDING" | "DIRECTION" | "DNA",
  "interactionType": "TEXT" | "CHOICES" | "MULTI_CHOICE" | "CONFIRMATION" | "REFLECTION",
  "options": ["Option 1", "Option 2", "Option 3"],
  "placeholder": "Helpful input placeholder",
  "contradictionAlert": "Optional string if contradiction detected, otherwise empty string",
  "readyForReflection": boolean,
  "reflectionSummary": {
    "projectNameSuggested": "Short memorable project name",
    "tagline": "One-sentence summary",
    "summaryParagraphs": ["Paragraph 1 explaining the problem and goal", "Paragraph 2 explaining the approach"],
    "undecidedItems": ["Open question 1", "Open question 2"]
  },
  "understandingUpdate": {
    "idea": "string",
    "motivation": "string",
    "problem": "string",
    "users": "string",
    "desired_outcome": "string",
    "proposed_solution": "string",
    "important_features": ["string"],
    "constraints": ["string"],
    "assumptions": ["string"],
    "decisions": ["string"],
    "uncertainties": ["string"],
    "missing_information": ["string"]
  }
}`;

      const userPrompt = JSON.stringify({
        latestUserMessage: userMessage,
        forceReflection: Boolean(forceReflection),
        currentUnderstanding: understanding,
        recentConversationHistory: (history || []).slice(-8),
      });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.4,
      });

      res.json({
        message:
          parsed.message ||
          'Tell me a bit more about what you want to solve and who it will help.',
        intent: parsed.intent || 'question',
        mascotState: parsed.mascotState || 'HELPING',
        understandingStage: parsed.understandingStage || 'UNDERSTANDING',
        interactionType: parsed.readyForReflection
          ? 'REFLECTION'
          : parsed.interactionType || 'TEXT',
        options: Array.isArray(parsed.options) ? parsed.options : [],
        placeholder:
          parsed.placeholder || "Tell Lyner what you're thinking...",
        contradictionAlert: parsed.contradictionAlert || undefined,
        readyForReflection: Boolean(parsed.readyForReflection),
        reflectionSummary: parsed.reflectionSummary || undefined,
        understandingUpdate: parsed.understandingUpdate || understanding,
      });
    } catch (error: any) {
      console.error('[discovery-turn error]:', error?.message);
      res.status(503).json({
        error: "Lyner couldn't respond right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     3. SYNTHESIZE PROJECT DNA, TASKS & PULSE FROM DISCOVERY
     ======================================================================== */
  app.post('/api/lyner/synthesize-project', async (req, res) => {
    try {
      const { understanding, history, customProjectName } = req.body as {
        understanding: any;
        history: any[];
        customProjectName?: string;
      };

      const systemPrompt = `Synthesize the discovery conversation and understanding into a clear, human-readable Project DNA brief and meaningful initial tasks.
Project DNA must read like a calm, well-structured project brief (PROBLEM, GOAL, TARGET USERS, PROPOSED SOLUTION, KEY AREAS, IMPORTANT DECISIONS, DELIVERABLES, OPEN QUESTIONS).
Tasks must be meaningful accomplishments assigned to student/team roles (Ahmed, Mariam, Youssef, Salma), never trivial chores like "Create a folder".

Return a JSON object with this exact structure:
{
  "name": "Project Name",
  "summary": "Clear 1-2 sentence project description",
  "currentDirection": "Clear statement of current focus and direction",
  "rightNowFocus": "What the team is doing right now",
  "nextActionPrompt": "Concrete next step for the team",
  "dna": [
    {
      "id": "dna-problem",
      "heading": "PROBLEM",
      "questionSubtitle": "What problem are we trying to solve?",
      "body": "Clear prose paragraph(s)",
      "bullets": ["Optional bullet points"],
      "epistemicNote": "Confirmed | Open / Being tested"
    }
  ],
  "tasks": [
    {
      "title": "Meaningful task title",
      "goal": "Clear explanation of what needs to be accomplished and why",
      "discipline": "Research" | "Design" | "Validation" | "Software" | "Hardware" | "General",
      "assigneeName": "Mariam" | "Youssef" | "Salma" | "Ahmed",
      "assigneeRole": "Research" | "Prototype Design" | "Visual Design & Communication" | "Project Coordination"
    }
  ]
}`;

      const userPrompt = JSON.stringify({
        customProjectName,
        understanding,
        conversationHistory: (history || []).slice(-10),
      });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.35,
        maxTokens: 2800,
      });

      res.json({
        name: customProjectName || parsed.name || 'New Project',
        summary: parsed.summary || understanding?.idea || '',
        currentDirection:
          parsed.currentDirection || understanding?.proposed_solution || '',
        rightNowFocus:
          parsed.rightNowFocus ||
          'Reviewing the synthesized Project DNA and starting initial team research.',
        nextActionPrompt:
          parsed.nextActionPrompt ||
          'Review your Project DNA sections and begin the first research task.',
        dna: Array.isArray(parsed.dna) ? parsed.dna : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      });
    } catch (error: any) {
      console.error('[synthesize-project error]:', error?.message);
      res.status(503).json({
        error:
          "Lyner couldn't synthesize the Project DNA right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     4. REAL LYNER CHAT (Context-Aware + Structured Output + DNA Proposals)
     ======================================================================== */
  app.post('/api/lyner/chat', async (req, res) => {
    try {
      const { message, senderName, projectContext } = req.body as {
        message: string;
        senderName: string;
        projectContext: any;
      };

      const systemPrompt = `You are facilitating the team chat for "${
        projectContext?.project?.name || 'the project'
      }".
You receive the structured PROJECT CONTEXT (project overview, Project DNA, team roles, tasks, recent Pulse, recent conversation, and currentUser).

Your responsibilities:
1. Respond directly to the user's message using the real project context (survey results, prototype findings, DNA sections, assigned tasks, open questions).
2. If the user asks about project history, strategy, or "what should I work on next?", answer accurately from the actual DNA, Pulse, and Tasks in the context.
3. If the user's statement changes or refines the project's problem definition, goal, direction, or key decisions (for example: "We realized students don't really know what belongs in each recycling bin" or "We decided to put the bins near the cafeteria"), set "nextAction": "update_dna" and populate "proposedDnaChange" so the user can review and Accept, Edit, or Reject the change!
4. If the user's statement contradicts verified research or an existing Project DNA decision, populate "contradictionDetected".
5. If the user is weighing two approaches, you may populate "tradeoffComparison".

Return a JSON object with this exact structure:
{
  "shouldRespond": true,
  "reply": "Your natural, context-aware facilitator response (2-4 sentences)",
  "mascotState": "HELPING" | "EXPLAINING" | "CONCERNED" | "CURIOUS" | "CELEBRATING",
  "nextAction": "none" | "ask_question" | "suggest_decision" | "update_dna" | "create_task",
  "understanding": "Brief 1-sentence summary of what this message means for the project",
  "openQuestions": ["Any new or remaining open questions"],
  "confidence": "high" | "medium" | "low",
  "proposedDnaChange": {
    "sectionHeading": "PROBLEM | GOAL | PROPOSED SOLUTION | IMPORTANT DECISIONS & DISCOVERIES | OPEN QUESTIONS",
    "proposedBody": "The updated text for this DNA section",
    "proposedBullets": ["Optional updated bullets if applicable"],
    "reason": "Why this conversation suggests updating this section of Project DNA"
  } | null,
  "contradictionDetected": {
    "earlierStatement": "What the DNA or verified research currently states",
    "conflictingStatement": "What the new message proposes",
    "question": "Clarifying question asking how the team wants to resolve the conflict",
    "resolutionOptions": ["Keep existing DNA decision", "Update DNA to new direction"]
  } | null,
  "tradeoffComparison": {
    "topic": "Decision topic",
    "optionA": { "name": "Option A", "summary": "Pros/cons", "bestWhen": "When to choose A" },
    "optionB": { "name": "Option B", "summary": "Pros/cons", "bestWhen": "When to choose B" }
  } | null,
  "knowledgeImpact": {
    "target": "Project DNA" | "Tasks" | "Pulse",
    "summary": "Short label of what this connects to",
    "linkedTab": "dna" | "tasks" | "pulse"
  } | null
}`;

      const userPrompt = JSON.stringify({
        currentUserMessage: message,
        senderName,
        projectContext,
      });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.35,
      });

      res.json({
        shouldRespond: true,
        reply:
          parsed.reply ||
          "I checked your Project DNA and current tasks — let's look at how this affects our next step.",
        mascotState: parsed.mascotState || 'EXPLAINING',
        nextAction: parsed.nextAction || 'none',
        understanding: parsed.understanding || '',
        openQuestions: Array.isArray(parsed.openQuestions)
          ? parsed.openQuestions
          : [],
        confidence: parsed.confidence || 'high',
        proposedDnaChange: parsed.proposedDnaChange
          ? {
              id: `prop-dna-${Date.now()}`,
              sectionHeading:
                parsed.proposedDnaChange.sectionHeading || 'PROBLEM',
              proposedBody: parsed.proposedDnaChange.proposedBody || '',
              proposedBullets: Array.isArray(
                parsed.proposedDnaChange.proposedBullets
              )
                ? parsed.proposedDnaChange.proposedBullets
                : undefined,
              reason:
                parsed.proposedDnaChange.reason ||
                'Suggested from team conversation',
              status: 'pending',
            }
          : undefined,
        contradictionDetected: parsed.contradictionDetected || undefined,
        tradeoffComparison: parsed.tradeoffComparison || undefined,
        knowledgeImpact: parsed.knowledgeImpact || undefined,
      });
    } catch (error: any) {
      console.error('[chat error]:', error?.message);
      res.status(503).json({
        error: "Lyner couldn't respond right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     5. UPDATE PROJECT DNA ("Ask Lyner to change this")
     ======================================================================== */
  app.post('/api/lyner/update-dna', async (req, res) => {
    try {
      const {
        projectContext,
        currentDna,
        instruction,
        forceApplyDespiteContradiction,
      } = req.body as {
        projectContext: any;
        currentDna: any[];
        instruction: string;
        forceApplyDespiteContradiction?: boolean;
      };

      const systemPrompt = `You are updating or evaluating a change to the Project DNA for "${
        projectContext?.project?.name || 'the project'
      }".
1. Compare the user's instruction against the current Project DNA and verified findings.
2. If forceApplyDespiteContradiction is false and the instruction contradicts a core verified finding or decision in the DNA, set "hasContradiction": true, explain the contradiction clearly in "lynerMessage", and do NOT overwrite the DNA yet.
3. Otherwise, set "hasContradiction": false, update the relevant section(s) in "updatedDna", and generate a meaningful "pulseEvent" explaining what changed and why it matters.

Return a JSON object with this exact structure:
{
  "hasContradiction": boolean,
  "lynerMessage": "Clear explanation of the update or contradiction check",
  "mascotState": "CELEBRATING" | "CONCERNED" | "HELPING" | "EXPLAINING",
  "contradictionDetails": {
    "earlierStatement": "string",
    "newStatement": "string",
    "question": "string"
  } | null,
  "updatedSummary": "Updated 1-2 sentence project summary",
  "updatedDirection": "Updated current direction string",
  "updatedDna": [
    {
      "id": "string",
      "heading": "string",
      "questionSubtitle": "string",
      "body": "string",
      "bullets": ["string"],
      "epistemicNote": "string"
    }
  ],
  "pulseEvent": {
    "type": "decision_confirmed" | "direction_changed" | "open_question",
    "symbol": "◆" | "→" | "!",
    "headline": "Short title of what changed",
    "whatChanged": "1-2 sentences describing what changed",
    "whyItMatters": "1 sentence explaining why this matters to the project"
  } | null
}`;

      const userPrompt = JSON.stringify({
        instruction,
        forceApplyDespiteContradiction: Boolean(forceApplyDespiteContradiction),
        currentDna,
        projectContext,
      });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.3,
        maxTokens: 2600,
      });

      res.json({
        hasContradiction: Boolean(parsed.hasContradiction),
        lynerMessage:
          parsed.lynerMessage || 'Project DNA has been updated.',
        mascotState:
          parsed.mascotState ||
          (parsed.hasContradiction ? 'CONCERNED' : 'CELEBRATING'),
        contradictionDetails: parsed.contradictionDetails || undefined,
        updatedSummary: parsed.updatedSummary,
        updatedDirection: parsed.updatedDirection,
        updatedDna: Array.isArray(parsed.updatedDna)
          ? parsed.updatedDna
          : currentDna,
        pulseEvent: parsed.pulseEvent || undefined,
      });
    } catch (error: any) {
      console.error('[update-dna error]:', error?.message);
      res.status(503).json({
        error:
          "Lyner couldn't update the Project DNA right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     6. GENERATE MEANINGFUL TASKS FROM PROJECT DNA
     ======================================================================== */
  app.post('/api/lyner/generate-tasks-from-dna', async (req, res) => {
    try {
      const { projectContext } = req.body as { projectContext: any };

      const systemPrompt = `Generate 2 to 3 meaningful, non-duplicate tasks for "${
        projectContext?.project?.name || 'the project'
      }" based on its Project DNA, deliverables, open questions, constraints, team roles, and current progress.
Rules:
- Tasks must represent meaningful accomplishments (e.g., "Test both label designs with 10 students during lunch and record which bin has fewer mistakes").
- Never generate trivial tasks like "Create a folder" or "Open Canva".
- Assign each task to the most appropriate team member from the project's team list.

Return a JSON object with this exact structure:
{
  "generatedTasks": [
    {
      "title": "Meaningful task title",
      "goal": "Concrete explanation of what to do and what evidence will verify it",
      "discipline": "Research" | "Design" | "Validation" | "Software" | "Hardware" | "General",
      "assigneeName": "Team member name",
      "assigneeRole": "Team member role"
    }
  ]
}`;

      const userPrompt = JSON.stringify({ projectContext });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.4,
      });

      res.json({
        generatedTasks: Array.isArray(parsed.generatedTasks)
          ? parsed.generatedTasks
          : [],
      });
    } catch (error: any) {
      console.error('[generate-tasks error]:', error?.message);
      res.status(503).json({
        error:
          "Lyner couldn't generate tasks right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     7. VERIFY TASK SUBMISSION WITH REAL AI
     ======================================================================== */
  app.post('/api/lyner/verify-submission', async (req, res) => {
    try {
      const { task, submission, projectContext } = req.body as {
        task: any;
        submission: any;
        projectContext: any;
      };

      const systemPrompt = `You are evaluating a team member's task submission in LYNER.
Evaluate strictly and honestly:
1. Does the submission address the task goal?
2. Does the explanation make sense and contain concrete findings or implementation details?
3. Is there enough evidence attached or described? (If the user wrote a shallow claim like "I finished it" or "It works" without real detail or evidence, you MUST return status: "needs_evidence").
4. Does it conflict with the Project DNA?
5. What is the impact on Project DNA?

Return a JSON object with this exact structure:
{
  "status": "verified" | "needs_evidence" | "unable_to_verify",
  "reason": "Clear, constructive feedback explaining why it is verified, what evidence is missing, or why it cannot be verified",
  "missingEvidence": ["Specific missing evidence item if not verified"],
  "projectImpact": "1-sentence summary of how this verified work advances or updates Project DNA",
  "dnaUpdateSuggested": boolean,
  "pulseEvent": {
    "headline": "✓ Headline of verified milestone (only if verified)",
    "whatChanged": "What was accomplished and learned",
    "whyItMatters": "Why this matters for the project direction"
  } | null
}`;

      const userPrompt = JSON.stringify({
        task,
        submission,
        projectContext,
      });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.25,
      });

      const statusMap: Record<
        string,
        'VERIFIED' | 'NEEDS_MORE_EVIDENCE' | 'UNABLE_TO_VERIFY'
      > = {
        verified: 'VERIFIED',
        needs_evidence: 'NEEDS_MORE_EVIDENCE',
        unable_to_verify: 'UNABLE_TO_VERIFY',
      };

      const mappedStatus =
        statusMap[(parsed.status || '').toLowerCase()] ||
        'NEEDS_MORE_EVIDENCE';

      res.json({
        status: parsed.status || 'needs_evidence',
        evaluationStatus: mappedStatus,
        reason:
          parsed.reason ||
          'Please provide more detail and evidence about how you completed this task.',
        lynerFeedback:
          parsed.reason ||
          'Please provide more detail and evidence about how you completed this task.',
        missingEvidence: Array.isArray(parsed.missingEvidence)
          ? parsed.missingEvidence
          : [],
        projectImpact: parsed.projectImpact || '',
        dnaUpdateSuggested: Boolean(parsed.dnaUpdateSuggested),
        verifiedDecisionBullet:
          mappedStatus === 'VERIFIED' ? parsed.projectImpact : undefined,
        pulseEvent:
          mappedStatus === 'VERIFIED' && parsed.pulseEvent
            ? {
                type: 'verified_outcome',
                symbol: '✓',
                headline:
                  parsed.pulseEvent.headline || `✓ Verified: ${task.title}`,
                whatChanged:
                  parsed.pulseEvent.whatChanged || parsed.projectImpact || '',
                whyItMatters:
                  parsed.pulseEvent.whyItMatters ||
                  'Advances verified project progress and updates Project DNA.',
                whereItCameFrom: `Task Verification (${task.title})`,
              }
            : undefined,
      });
    } catch (error: any) {
      console.error('[verify-submission error]:', error?.message);
      res.status(503).json({
        error:
          "Lyner couldn't verify this submission right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     8. GENERATE MEANINGFUL PULSE EVENT
     ======================================================================== */
  app.post('/api/lyner/generate-pulse', async (req, res) => {
    try {
      const { eventDescription, source, projectContext } = req.body as {
        eventDescription: string;
        source: string;
        projectContext: any;
      };

      const systemPrompt = `Determine whether the described project event represents a meaningful change in the project (such as direction changed, problem definition changed, important decision made, research changed understanding, task milestone reached, or new open question discovered).

Return a JSON object with this exact structure:
{
  "isMeaningful": boolean,
  "type": "verified_outcome" | "direction_changed" | "open_question" | "decision_confirmed" | "task_milestone",
  "symbol": "✓" | "→" | "!" | "◆" | "↗",
  "title": "Short impactful headline (e.g., ◆ Problem definition refined around label clarity)",
  "whatChanged": "1-2 sentences explaining what changed",
  "whyItMatters": "1 sentence explaining why this matters to the team",
  "source": "Where this change came from"
}`;

      const userPrompt = JSON.stringify({
        eventDescription,
        source,
        projectContext,
      });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.3,
      });

      res.json({
        isMeaningful: parsed.isMeaningful !== false,
        type: parsed.type || 'decision_confirmed',
        symbol: parsed.symbol || '◆',
        title: parsed.title || '◆ Project understanding updated',
        whatChanged: parsed.whatChanged || eventDescription,
        whyItMatters:
          parsed.whyItMatters ||
          'Keeps the shared Project DNA aligned with the team’s latest understanding.',
        source: parsed.source || source || 'Project Workspace',
        timestamp: 'Just now',
      });
    } catch (error: any) {
      console.error('[generate-pulse error]:', error?.message);
      res.status(503).json({
        error:
          "Lyner couldn't generate a Pulse update right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     9. ANALYZE PROJECT FOR DYNAMIC OVERVIEW INSIGHTS
     ======================================================================== */
  app.post('/api/lyner/analyze-project', async (req, res) => {
    try {
      const { projectContext } = req.body as { projectContext: any };

      const systemPrompt = `Analyze the current project state (DNA, Tasks, Pulse, Chat, Submissions) and generate dynamic Overview insights for the team.
Do NOT invent facts. Base your synthesis strictly on the verified tasks, open tasks, DNA sections, and recent Pulse events provided.

Return a JSON object with this exact structure:
{
  "mascotMessage": "1-2 sentence message from Lyner summarizing where the team is right now and what is moving",
  "mascotState": "HELPING" | "EXPLAINING" | "CELEBRATING" | "CURIOUS",
  "currentStageSummary": "Concise description of current project stage",
  "whatNeedsAttention": "The single most important open question or unverified task needing attention",
  "nextRecommendedAction": "Concrete next step for the current user",
  "currentDirectionSummary": "Clear 1-sentence summary of the project's current direction"
}`;

      const userPrompt = JSON.stringify({ projectContext });

      const parsed = await callFeatherlessJSON<any>({
        systemPrompt,
        userPrompt,
        temperature: 0.3,
      });

      res.json({
        mascotMessage:
          parsed.mascotMessage ||
          'Your team has completed initial research and is now advancing prototype testing.',
        mascotState: parsed.mascotState || 'HELPING',
        currentStageSummary: parsed.currentStageSummary || '',
        whatNeedsAttention: parsed.whatNeedsAttention || '',
        nextRecommendedAction: parsed.nextRecommendedAction || '',
        currentDirectionSummary: parsed.currentDirectionSummary || '',
      });
    } catch (error: any) {
      console.error('[analyze-project error]:', error?.message);
      res.status(503).json({
        error:
          "Lyner couldn't analyze the project overview right now. Try again in a moment.",
        technicalHint: error?.message,
      });
    }
  });

  /* ========================================================================
     VITE MIDDLEWARE / STATIC ASSETS
     ======================================================================== */
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lyner Server running on http://localhost:${PORT}`);
  });
}

startServer();
