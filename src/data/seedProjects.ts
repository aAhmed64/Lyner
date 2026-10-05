import { Project, ProjectUnderstanding } from '../types/lyner';

export const EMPTY_PROJECT_UNDERSTANDING: ProjectUnderstanding = {
  idea: '',
  motivation: '',
  problem: '',
  users: '',
  desired_outcome: '',
  proposed_solution: '',
  important_features: [],
  constraints: [],
  assumptions: [],
  decisions: [],
  uncertainties: [],
  missing_information: [],
};

export const INITIAL_DISCOVERY_STARTERS: string[] = [
  'We want to do a school project to improve recycling because students keep mixing recyclables with regular trash.',
  'We want to build a science project that tests how classroom air quality affects student focus.',
  'I have an idea for smart glasses that help visually impaired people read signs and recognize objects.',
  'We want to create a cooperative puzzle game that teaches circuit design without technical jargon.',
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'greencycle-school-project',
    name: 'GreenCycle',
    summary:
      'A student group project to make recycling easier at school through clear station design, better labels, and real student testing.',
    currentDirection:
      'Focus on improving how students separate paper, plastic, and general waste using clear example-based labels and placing stations near both classrooms and the cafeteria.',
    rightNowFocus:
      'GreenCycle is currently testing its first recycling station prototype with students.',
    recentlySummary:
      'Youssef completed the first 3-section recycling station prototype, and Mariam’s 86-student survey showed that classrooms generate just as much paper waste as the cafeteria.',
    openQuestionHighlight:
      'What labels will students understand most easily, and how can the team measure whether recycling actually improves?',
    nextActionPrompt:
      'Test Salma’s two label designs with students, decide final station locations, and record the testing results in Tasks.',
    reEntryContext: {
      greeting: 'Welcome back.',
      lastTimeSummary:
        'Mariam shared the 86-student survey results, Youssef built the first 3-section recycling station prototype, and the team is discussing classroom vs. cafeteria bin placement.',
      focusStatement:
        'Ready to check the prototype testing tasks or review the GreenCycle Project DNA?',
      targetView: 'overview',
    },
    createdAt: '2026-10-02',
    understanding: {
      idea: 'Design a simple recycling system for our school that makes waste separation clear for students and measures whether recycling actually improves.',
      motivation:
        'We noticed that recyclable bottles and paper at school almost always end up mixed with regular trash.',
      problem:
        'Students often do not know how to properly separate recyclable waste, causing recyclable materials to end up in regular trash.',
      users: 'Students and school staff.',
      desired_outcome:
        'Create a simple recycling system that students will actually use and prove whether it reduces mixed waste at school.',
      proposed_solution:
        'Create clearly labeled recycling stations in useful locations around the school, supported by simple awareness materials and a way to measure whether recycling improves.',
      important_features: [
        'Student research & survey findings',
        'Three-section recycling station (Paper, Plastic, General Waste)',
        'Visual labels with concrete example items',
        'Strategic bin placement near classrooms and the cafeteria',
        'Before-and-after waste check to measure if recycling improves',
      ],
      constraints: [
        'Stations must be affordable and practical to build with school project materials.',
        'Labels must be understandable in 1–2 seconds as students walk by between classes.',
      ],
      assumptions: [
        'Students want to recycle when it is obvious which bin to use.',
      ],
      decisions: [
        'Focus on improving waste separation rather than simply adding more unlabeled bins.',
        'Use three separated sections for paper, plastic, and general waste.',
        'Include both classrooms and the cafeteria in target locations based on the 86-student survey.',
        'Verified: 86-student survey completed and analyzed.',
        'Verified: First physical recycling station prototype built and tested with 5 students.',
      ],
      uncertainties: [
        'Where should the recycling stations be placed?',
        'Which types of waste should the school collect?',
        'What labels will students understand most easily?',
        'How can the team measure whether the project actually works?',
      ],
      missing_information: [],
    },
    dna: [
      {
        id: 'dna-problem',
        heading: 'PROBLEM',
        questionSubtitle: 'What problem are we trying to solve?',
        body: 'Students often do not know how to properly separate recyclable waste, causing recyclable materials to end up in regular trash.\n\nWhen our team looked at the bins around school, we realized the main issue is not that students do not care — it is that when someone is in a rush between classes or at lunch, it is not obvious what can be recycled or which bin it belongs in.',
      },
      {
        id: 'dna-goal',
        heading: 'GOAL',
        questionSubtitle: 'What is our team trying to achieve?',
        body: 'Create a simple recycling system that students will actually use, and show whether the new setup genuinely improves recycling at our school.',
      },
      {
        id: 'dna-users',
        heading: 'TARGET USERS',
        questionSubtitle: 'Who is expected to use or benefit from it?',
        body: 'Students and school staff across classrooms, hallways, and the cafeteria.',
      },
      {
        id: 'dna-solution',
        heading: 'PROPOSED SOLUTION',
        questionSubtitle: 'How does our solution work?',
        body: 'Create clearly labeled recycling stations in useful locations around the school, supported by simple awareness materials and a way to measure whether recycling improves.\n\nEach station separates Paper, Plastic, and General Waste and uses clear visual examples of common school items (like water bottles, juice cups, and notebook paper) so students do not have to guess.',
      },
      {
        id: 'dna-areas',
        heading: 'KEY AREAS',
        questionSubtitle: 'What are the important parts of the project?',
        body: 'Our group divided the project into eight connected areas:',
        bullets: [
          'Student research',
          'Recycling behavior',
          'Bin placement',
          'Clear labeling',
          'Prototype',
          'Testing',
          'Measuring results',
          'Final presentation',
        ],
      },
      {
        id: 'dna-decisions',
        heading: 'IMPORTANT DECISIONS & DISCOVERIES',
        questionSubtitle: 'What have we learned and decided so far?',
        body: 'As we researched and built our first prototype, the project evolved based on what we found:',
        bullets: [
          'Direction clarified: Focus on improving waste separation and label clarity rather than simply adding more bins.',
          'Verified Survey Insight (Mariam): 86 students responded to our survey. Most want to recycle but are unsure which bin to use, and classrooms generate a large amount of paper waste alongside the cafeteria.',
          'Design decision: Use three separated sections at each station for Paper, Plastic, and General Waste.',
          'Verified Prototype Insight (Youssef): Testing the first prototype with 5 students showed that the plastic label is much easier to understand when we show example items on the sign.',
        ],
      },
      {
        id: 'dna-deliverables',
        heading: 'DELIVERABLES',
        questionSubtitle: 'What does our group need to produce?',
        body: 'Everything our team needs to complete for the school project:',
        bullets: [
          'Student survey',
          'Research findings',
          'Recycling station design',
          'Prototype',
          'Labels/signage',
          'Testing results',
          'Final presentation',
        ],
      },
      {
        id: 'dna-open',
        heading: 'OPEN QUESTIONS',
        questionSubtitle: 'What still needs to be decided or tested?',
        body: 'Questions the team is still working to answer:',
        bullets: [
          'Where should the recycling stations be placed (smaller bins near classrooms vs. larger stations in the cafeteria)?',
          'Which types of waste should the school collect?',
          'What labels will students understand most easily?',
          'How can the team measure whether the project actually works?',
        ],
        epistemicNote: 'Open / Being tested',
      },
    ],
    tasks: [
      /* 1. Mariam — Research current recycling habits */
      {
        id: 'task-gc-1',
        title: 'Research current recycling habits',
        goal: 'Observe how bins are currently used around the school during lunch and between classes to see why recyclables get mixed with trash.',
        discipline: 'Research',
        assigneeName: 'Mariam',
        assigneeRole: 'Research',
        status: 'VERIFIED',
        verificationEvaluation:
          '✓ Verified: Mariam documented observations from the cafeteria and hallways showing that unmarked bins lead to mixed trash.',
        dnaOutcomeSummary:
          'Confirmed that unclear bin separation is the primary issue at school.',
        submissions: [
          {
            id: 'sub-gc-1',
            submittedBy: 'Mariam',
            role: 'Research',
            whatDidYouDo:
              'Checked the existing bins in the cafeteria and 2nd-floor hallway after lunch and took notes on what was inside.',
            howDidYouImplement:
              'Observed three bin locations over two school days and listed the most common items thrown into the wrong bin.',
            whatWasResult:
              'Plastic water bottles and notebook paper were mixed into regular trash in all three spots because the bins had no clear labels.',
            evidence: [
              {
                id: 'ev-gc-1',
                type: 'file',
                label: 'school_bin_observations.pdf',
                detail:
                  'Notes from observing cafeteria and hallway bins during lunch break',
              },
            ],
            submittedAt: '4 days ago',
            evaluationStatus: 'VERIFIED',
            lynerFeedback:
              'Verified. This observation grounded the project problem: students need clearer separation and labeling, not just more bins.',
          },
        ],
      },
      /* 2. Mariam — Survey students about recycling */
      {
        id: 'task-gc-2',
        title: 'Survey students about recycling',
        goal: 'Run a short survey with classmates to learn what confuses them about recycling at school and where they think bins are needed most.',
        discipline: 'Research',
        assigneeName: 'Mariam',
        assigneeRole: 'Research',
        status: 'VERIFIED',
        verificationEvaluation:
          '✓ Verified: 86 students responded. Survey results and charts confirm that unclear labeling is the main barrier and that both classrooms and the cafeteria need bins.',
        dnaOutcomeSummary:
          '86-student survey findings added to Project DNA and updated target locations.',
        submissions: [
          {
            id: 'sub-gc-2',
            submittedBy: 'Mariam',
            role: 'Research',
            whatDidYouDo:
              '86 students responded to our survey. Most students said they want to recycle but are unsure which bin to use. The results also showed that students preferred having recycling bins near classrooms and the cafeteria.',
            howDidYouImplement:
              'Created a 5-question form shared across homeroom classes and summarized the responses into charts.',
            whatWasResult:
              '78% of students said they hesitate over which bin to use; 64% pointed out that paper waste mostly happens inside classrooms while plastic bottles pile up in the cafeteria.',
            evidence: [
              {
                id: 'ev-gc-2',
                type: 'file',
                label: 'student_survey_results_86.csv',
                detail: 'Survey results from 86 students across grades 10–12',
              },
              {
                id: 'ev-gc-3',
                type: 'image',
                label: 'survey_charts_summary.png',
                detail:
                  'Charts showing top recycling barriers and preferred bin locations (classrooms + cafeteria)',
              },
            ],
            submittedAt: '2 days ago',
            evaluationStatus: 'VERIFIED',
            lynerFeedback:
              'Verified. The 86 responses and summary charts provide clear evidence and directly updated the target locations in Project DNA.',
          },
        ],
      },
      /* 3. Mariam + Ahmed — Analyze survey results */
      {
        id: 'task-gc-3',
        title: 'Analyze survey results',
        goal: 'Turn the 86 survey responses into clear takeaways for how we should design and place our recycling stations.',
        discipline: 'Research',
        assigneeName: 'Mariam + Ahmed',
        assigneeRole: 'Research & Project Lead',
        status: 'VERIFIED',
        verificationEvaluation:
          '✓ Verified: Key findings synthesized into three design takeaways: focus on Paper + Plastic + General Waste, use example-based labels, and cover both classrooms and the cafeteria.',
        dnaOutcomeSummary:
          'Survey takeaways linked to station design and placement decisions.',
        submissions: [
          {
            id: 'sub-gc-3',
            submittedBy: 'Mariam + Ahmed',
            role: 'Research & Project Lead',
            whatDidYouDo:
              'Reviewed the 86 responses together and wrote down the top 3 conclusions for Youssef’s prototype and Salma’s labels.',
            howDidYouImplement:
              'Grouped open-ended student comments by waste type (notebook paper, plastic bottles, food wrappers) and location.',
            whatWasResult:
              'Confirmed that paper and plastic bottles make up almost all recyclable student waste, and labels need pictures of real school items.',
            evidence: [
              {
                id: 'ev-gc-4',
                type: 'file',
                label: 'survey_key_takeaways.md',
                detail:
                  'Summary of top waste types and student confusion points',
              },
            ],
            submittedAt: '2 days ago',
            evaluationStatus: 'VERIFIED',
            lynerFeedback:
              'Verified. Connects the student research directly to Youssef and Salma’s design tasks.',
          },
        ],
      },
      /* 4. Ahmed + team — Decide where recycling stations should go */
      {
        id: 'task-gc-4',
        title: 'Decide where recycling stations should go',
        goal: 'Choose the exact spots in the cafeteria and classroom hallways for our recycling stations and decide if classroom bins should be smaller.',
        discipline: 'General',
        assigneeName: 'Ahmed + team',
        assigneeRole: 'Project Lead',
        status: 'AWAITING_SUBMISSION',
        verificationEvaluation:
          'Awaiting final location plan after the team finishes discussing smaller classroom bins vs. larger cafeteria stations.',
        submissions: [],
      },
      /* 5. Youssef — Design the recycling station */
      {
        id: 'task-gc-5',
        title: 'Design the recycling station',
        goal: 'Create a simple 3-section station layout for Paper, Plastic, and General Waste where the labels sit at eye level.',
        discipline: 'Design',
        assigneeName: 'Youssef',
        assigneeRole: 'Prototype',
        status: 'VERIFIED',
        verificationEvaluation:
          '✓ Verified: Youssef shared the 3-section station sketch with raised signboards for Paper, Plastic, and General Waste.',
        dnaOutcomeSummary:
          'Three-section station layout (Paper, Plastic, General Waste) confirmed in DNA.',
        submissions: [
          {
            id: 'sub-gc-5',
            submittedBy: 'Youssef',
            role: 'Prototype',
            whatDidYouDo:
              'Sketched the recycling station layout with three connected sections and a backboard at eye level so students see the labels before dropping trash.',
            howDidYouImplement:
              'Measured the existing school bins and designed a modular frame that holds three separate bins side by side.',
            whatWasResult:
              'Station design approved by the group and ready to build as a physical prototype.',
            evidence: [
              {
                id: 'ev-gc-5',
                type: 'image',
                label: 'station_3_section_sketch.png',
                detail:
                  'Sketch and dimensions for the Paper / Plastic / General Waste station',
              },
            ],
            submittedAt: 'Yesterday',
            evaluationStatus: 'VERIFIED',
            lynerFeedback:
              'Verified. The 3-section layout matches the team’s design decision.',
          },
        ],
      },
      /* 6. Salma — Create clear recycling labels */
      {
        id: 'task-gc-6',
        title: 'Create clear recycling labels',
        goal: 'Design two versions of the Paper, Plastic, and General Waste labels (including real example items) so we can test which one students understand faster.',
        discipline: 'Design',
        assigneeName: 'Salma',
        assigneeRole: 'Design & Presentation',
        status: 'AWAITING_SUBMISSION',
        verificationEvaluation:
          'Ready for submission. Share the label designs and what you included on each version.',
        submissions: [],
      },
      /* 7. Youssef — Build the first prototype */
      {
        id: 'task-gc-7',
        title: 'Build the first prototype',
        goal: 'Assemble the first physical recycling station prototype and run a quick check with students to see if the sections and labels make sense.',
        discipline: 'Hardware',
        assigneeName: 'Youssef',
        assigneeRole: 'Prototype',
        status: 'VERIFIED',
        verificationEvaluation:
          '✓ Verified: Youssef built the 3-section prototype and tested it with 5 students, discovering that adding example items made the plastic label much clearer.',
        dnaOutcomeSummary:
          'First recycling station prototype verified; example-item label insight added to DNA.',
        submissions: [
          {
            id: 'sub-gc-7',
            submittedBy: 'Youssef',
            role: 'Prototype',
            whatDidYouDo:
              'We created the first prototype using three separated sections for paper, plastic, and general waste. We tested the labels with five students and found that the plastic label was easier to understand when we added example items.',
            howDidYouImplement:
              'Built the three-bin station frame using sturdy poster board dividers and attached temporary signs above each section for a quick hallway test.',
            whatWasResult:
              'All 5 students sorted paper correctly right away, and once we added drawings of water bottles and juice cups to the Plastic sign, nobody hesitated.',
            evidence: [
              {
                id: 'ev-gc-7',
                type: 'image',
                label: 'recycling_station_prototype_v1.jpg',
                detail:
                  'Photo of the first 3-section recycling station prototype with test labels',
              },
            ],
            submittedAt: '3 hours ago',
            evaluationStatus: 'VERIFIED',
            lynerFeedback:
              'Verified. Great hands-on test — the discovery that example items make the plastic label easier to understand has been added to Project DNA.',
          },
        ],
      },
      /* 8. Everyone — Test the system with students */
      {
        id: 'task-gc-8',
        title: 'Test the system with students',
        goal: 'Place our prototype station out during lunch and between classes, test Salma’s label versions, and count how accurately students sort their waste.',
        discipline: 'Validation',
        assigneeName: 'Everyone',
        assigneeRole: 'Full Team',
        status: 'AWAITING_SUBMISSION',
        verificationEvaluation:
          'Currently in progress. Submit your observations and sorting accuracy counts from the school test.',
        submissions: [],
      },
      /* 9. Mariam — Analyze the testing results */
      {
        id: 'task-gc-9',
        title: 'Analyze the testing results',
        goal: 'Compare how much recyclable waste was properly separated with our prototype versus the old bins so we can prove whether GreenCycle works.',
        discipline: 'Research',
        assigneeName: 'Mariam',
        assigneeRole: 'Research',
        status: 'AWAITING_SUBMISSION',
        verificationEvaluation:
          'Awaiting data from the student prototype test.',
        submissions: [],
      },
      /* 10. Salma + Ahmed — Prepare the final presentation */
      {
        id: 'task-gc-10',
        title: 'Prepare the final presentation',
        goal: 'Put together our final class presentation showing the problem, our 86-student survey, the station prototype, and what happened when we tested it.',
        discipline: 'General',
        assigneeName: 'Salma + Ahmed',
        assigneeRole: 'Design & Project Lead',
        status: 'AWAITING_SUBMISSION',
        verificationEvaluation:
          'Awaiting final presentation slides and summary once testing is complete.',
        submissions: [],
      },
    ],
    pulse: [
      {
        id: 'pulse-gc-1',
        type: 'task_milestone',
        symbol: '↗',
        headline: 'TESTING STARTED',
        whatChanged:
          'The team began testing the recycling station with students.',
        whyItMatters:
          'First real test of whether example-based labels help classmates separate paper and plastic without slowing down.',
        whenItHappened: '1 hour ago',
        whereItCameFrom: 'Prototype testing task (Everyone)',
        actor: 'Ahmed, Mariam, Youssef & Salma',
        linkedSource: {
          tab: 'tasks',
          label: 'View Testing Task',
          targetId: 'task-gc-8',
        },
      },
      {
        id: 'pulse-gc-2',
        type: 'verified_outcome',
        symbol: '✓',
        headline: 'PROTOTYPE READY',
        whatChanged:
          'Youssef completed the first recycling station prototype and submitted photos for review.',
        whyItMatters:
          'Initial 5-student check showed that adding example items to the plastic label makes sorting much clearer.',
        whenItHappened: '3 hours ago',
        whereItCameFrom: 'Task Submission by Youssef (Prototype)',
        actor: 'Youssef · Verified by Lyner',
        linkedSource: {
          tab: 'tasks',
          label: 'Inspect Prototype Submission',
          targetId: 'task-gc-7',
        },
      },
      {
        id: 'pulse-gc-3',
        type: 'direction_changed',
        symbol: '→',
        headline: 'DNA UPDATED',
        whatChanged:
          'The project’s target locations were updated after the survey results showed that classrooms generate significant amounts of recyclable waste.',
        whyItMatters:
          'Shifted the team from only thinking about the cafeteria to considering smaller paper-focused bins near classrooms too.',
        whenItHappened: 'Yesterday',
        whereItCameFrom: 'Student Survey Findings & Team Chat',
        actor: 'Mariam & Lyner',
        linkedSource: {
          tab: 'dna',
          label: 'Read Updated Project DNA',
        },
      },
      {
        id: 'pulse-gc-4',
        type: 'decision_confirmed',
        symbol: '◆',
        headline: 'DESIGN DECISION',
        whatChanged:
          'The team decided to use separate stations for paper, plastic, and general waste.',
        whyItMatters:
          'Matches the two most common recyclable materials students throw away at school while keeping the station simple.',
        whenItHappened: 'Yesterday',
        whereItCameFrom: 'Station Design & Survey Analysis',
        actor: 'Youssef, Mariam & Ahmed',
        linkedSource: {
          tab: 'tasks',
          label: 'View Station Design Task',
          targetId: 'task-gc-5',
        },
      },
      {
        id: 'pulse-gc-5',
        type: 'verified_outcome',
        symbol: '✓',
        headline: 'RESEARCH COMPLETED',
        whatChanged:
          '86 students responded to the team’s survey. The results showed that unclear bin labeling is one of the main barriers to recycling.',
        whyItMatters:
          'Confirmed that students want to recycle when they can tell which bin to use at a glance.',
        whenItHappened: '2 days ago',
        whereItCameFrom: 'Task Submission by Mariam (Research)',
        actor: 'Mariam · Verified by Lyner',
        linkedSource: {
          tab: 'tasks',
          label: 'View Survey Results Submission',
          targetId: 'task-gc-2',
        },
      },
      {
        id: 'pulse-gc-6',
        type: 'direction_changed',
        symbol: '→',
        headline: 'DIRECTION CLARIFIED',
        whatChanged:
          'The team decided to focus on improving waste separation rather than simply adding more recycling bins.',
        whyItMatters:
          'Turned our initial vague idea ("do something about school recycling") into a clear, testable project goal.',
        whenItHappened: '4 days ago',
        whereItCameFrom: 'Initial Team Discovery & Bin Observations',
        actor: 'Ahmed, Mariam, Youssef & Salma',
        linkedSource: {
          tab: 'dna',
          label: 'Read Problem & Goal in DNA',
        },
      },
    ],
    chat: [
      {
        id: 'chat-gc-1',
        senderType: 'teammate',
        senderName: 'Mariam',
        senderRole: 'Research',
        avatarColor: 'bg-emerald-600',
        content:
          'I just finished putting the survey charts together from all 86 responses. Most students said they want to recycle, they just aren’t sure which bin takes what.',
        timestamp: '3:40 PM',
        reactions: [
          { emoji: '🔥', count: 3, userReacted: true },
          { emoji: '👍', count: 2 },
        ],
        attachments: [
          {
            type: 'task',
            label: 'Survey students about recycling (✓ Verified)',
            targetId: 'task-gc-2',
          },
        ],
      },
      {
        id: 'chat-gc-2',
        senderType: 'teammate',
        senderName: 'Ahmed',
        senderRole: 'Project Lead',
        avatarColor: 'bg-indigo-600',
        content:
          "I think we should put the bins near the cafeteria because that's where most of the waste is.",
        timestamp: '3:42 PM',
      },
      {
        id: 'chat-gc-3',
        senderType: 'teammate',
        senderName: 'Mariam',
        senderRole: 'Research',
        avatarColor: 'bg-emerald-600',
        replyTo: {
          id: 'chat-gc-2',
          senderName: 'Ahmed',
          preview:
            "I think we should put the bins near the cafeteria because that's where most of the waste is.",
        },
        content:
          'Maybe, but the survey shows students also throw a lot of paper away in classrooms.',
        timestamp: '3:44 PM',
      },
      {
        id: 'chat-gc-4',
        senderType: 'teammate',
        senderName: 'Youssef',
        senderRole: 'Prototype',
        avatarColor: 'bg-sky-600',
        content:
          'Then maybe we need smaller bins near classrooms and bigger ones in the cafeteria.',
        timestamp: '3:45 PM',
        reactions: [{ emoji: '💡', count: 3, userReacted: true }],
      },
      {
        id: 'chat-gc-5',
        senderType: 'teammate',
        senderName: 'Salma',
        senderRole: 'Design & Presentation',
        avatarColor: 'bg-amber-600',
        content:
          'I can make two versions of the labels and we can test which one students understand faster.',
        timestamp: '3:47 PM',
        attachments: [
          {
            type: 'task',
            label: 'Create clear recycling labels',
            targetId: 'task-gc-6',
          },
        ],
      },
      {
        id: 'chat-gc-6',
        senderType: 'teammate',
        senderName: 'Ahmed',
        senderRole: 'Project Lead',
        avatarColor: 'bg-indigo-600',
        content: "Yeah, let's do that before we build the final version.",
        timestamp: '3:48 PM',
        reactions: [{ emoji: '✅', count: 3 }],
      },
      {
        id: 'chat-gc-7',
        senderType: 'lyner',
        senderName: 'Lyner',
        mascotState: 'HELPING',
        content:
          "There's a useful decision taking shape here: you're considering different bin sizes depending on location (smaller bins near classrooms for paper and bigger 3-section stations in the cafeteria), plus testing two label designs first.\n\nWant me to add that as a project decision?",
        timestamp: '3:49 PM',
        tradeoffComparison: {
          topic: 'Station Placement Strategy: Cafeteria Only vs. Split Sizing (Classrooms + Cafeteria)',
          optionA: {
            name: 'Use smaller bins near classrooms + larger stations in the cafeteria',
            summary:
              'Matches Mariam’s survey showing heavy paper waste in classrooms and plastic/drink waste at lunch.',
            bestWhen:
              'Capturing both classroom paper and cafeteria plastic without crowding narrow hallways.',
          },
          optionB: {
            name: 'Place full 3-section stations only in the cafeteria first',
            summary:
              'Concentrates all bins in one high-traffic area for the initial test.',
            bestWhen:
              'Testing only lunchtime waste separation in one spot.',
          },
          recommendation:
            'Confirm whether to record the split classroom + cafeteria sizing decision in Project DNA.',
        },
        knowledgeImpact: {
          target: 'DNA',
          summary: 'Ready to record bin placement & label testing decision in Project DNA',
          linkedTab: 'dna',
        },
      },
    ],
    files: [
      {
        id: 'file-gc-1',
        name: 'student_survey_results_86.csv',
        type: 'Survey Data (Mariam)',
        summary:
          'Responses from 86 students on recycling habits, confusing labels, and where bins are needed.',
        linkedSectionHeading: 'IMPORTANT DECISIONS & DISCOVERIES',
        updatedAt: '2 days ago',
      },
      {
        id: 'file-gc-2',
        name: 'recycling_station_prototype_v1.jpg',
        type: 'Prototype Photo (Youssef)',
        summary:
          'First 3-section recycling station prototype for Paper, Plastic, and General Waste.',
        linkedSectionHeading: 'PROPOSED SOLUTION',
        updatedAt: '3 hours ago',
      },
      {
        id: 'file-gc-3',
        name: 'label_options_draft.pdf',
        type: 'Signage Drafts (Salma)',
        summary:
          'Two visual label designs comparing simple icons vs. photos of common school items.',
        linkedSectionHeading: 'DELIVERABLES',
        updatedAt: 'Today',
      },
    ],
    members: [
      {
        id: 'mem-ahmed',
        name: 'Ahmed',
        role: 'Project Lead',
        avatarColor: 'bg-indigo-600',
        focus: 'Coordinates the team, helps keep everyone aligned & tracks overall progress',
      },
      {
        id: 'mem-mariam',
        name: 'Mariam',
        role: 'Research',
        avatarColor: 'bg-emerald-600',
        focus: 'Surveys students, researches recycling habits & analyzes the results',
      },
      {
        id: 'mem-youssef',
        name: 'Youssef',
        role: 'Prototype',
        avatarColor: 'bg-sky-600',
        focus: 'Designs the physical recycling station, works on the prototype & tests the setup',
      },
      {
        id: 'mem-salma',
        name: 'Salma',
        role: 'Design & Presentation',
        avatarColor: 'bg-amber-600',
        focus: 'Designs labels and visuals, works on the user experience & prepares the final presentation',
      },
      {
        id: 'mem-lyner',
        name: 'Lyner',
        role: 'AI Facilitator',
        avatarColor: 'bg-violet-600',
        focus:
          'Helps the team stay aligned, maintains Project DNA, verifies submitted work & tracks meaningful project evolution',
        isAI: true,
      },
    ],
  },
];
