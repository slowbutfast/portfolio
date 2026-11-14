import type { ProjectData, TerminalDemo } from '../types/portfolio';
import openDungeonCapturedJson from './captured/open-dungeon.json';
import resumeBuilderCapturedJson from './captured/agentic-resume-builder.json';
import transcribePlusCapturedJson from './captured/transcribe-plus.json';
import sandwaveSimCapturedJson from './captured/sandwave-sim.json';
import attentionMaxCapturedJson from './captured/attention-max.json';
import openDungeonScreenshot from '../assets/screenshots/open-dungeon.png';
import pictClimateScreenshot from '../assets/screenshots/pict-climate-risk-viz-chatbot.png';
import transcribeClip from '../assets/clip.mp4';
import sandwaveScreenshot from '../assets/screenshots/sandwave-sim.png';
import attentionMaxScreenshot from '../assets/screenshots/attention-max.png';

interface CapturedDemo {
  prompt: string;
  commands: TerminalDemo['commands'];
}

const openDungeonCaptured = openDungeonCapturedJson as CapturedDemo;
const resumeBuilderCaptured = resumeBuilderCapturedJson as CapturedDemo;
const transcribePlusCaptured = transcribePlusCapturedJson as CapturedDemo;
const sandwaveSimCaptured = sandwaveSimCapturedJson as CapturedDemo;
const attentionMaxCaptured = attentionMaxCapturedJson as CapturedDemo;

function demo(captured: CapturedDemo, prompt: string): TerminalDemo {
  return { prompt, commands: captured.commands };
}

export const projects = [
  {
    id: 'open-dungeon',
    title: 'OpenDungeon',
    shortTitle: 'OpenDungeon',
    summary:
      'Generative text-adventure engine with a 20-tool MCP server and an OAuth-gated multiplayer canvas.',
    classification: 'GENERATIVE ADVENTURE // MCP RUNTIME',
    tags: ['Express', 'Vanilla JS', 'LLM', 'Agent Tooling'],
    repo: 'https://github.com/slowbutfast/open-dungeon',
    liveUrl: 'https://open-dungeon-three.vercel.app/',
    previews: [
      { kind: 'terminal', label: 'Terminal' },
      { kind: 'screenshot', src: openDungeonScreenshot, caption: 'OpenDungeon web canvas' },
      { kind: 'linkout', url: 'https://open-dungeon-three.vercel.app/', label: 'Launch live app' },
    ],
    terminalDemo: demo(openDungeonCaptured, '$ node'),
  },
  {
    id: 'agentic-resume-builder',
    title: 'Agentic Resume Builder',
    shortTitle: 'Resume Builder',
    summary:
      'Python CLI that renders tailored LaTeX resumes from structured YAML via an argparse-driven build pipeline.',
    classification: 'AGENTIC DOCUMENT PIPELINE // LaTeX',
    tags: ['Agent Tooling', 'LaTeX', 'Design'],
    repo: 'https://github.com/slowbutfast/agentic-resume-builder',
    previews: [{ kind: 'terminal', label: 'Terminal' }],
    terminalDemo: demo(resumeBuilderCaptured, '$ python3 build_resume.py'),
  },
  {
    id: 'pict-climate-risk-viz-chatbot',
    title: 'PICT Climate Risk Viz',
    shortTitle: 'Climate Risk',
    summary:
      'Geospatial climate-risk chat and raster visualization built on an Express backend with React 19.',
    classification: 'GEOSPATIAL CLIMATE INTELLIGENCE // RASTER VIZ',
    tags: ['Express', 'LLM', 'Geospatial'],
    repo: 'https://github.com/BrownEarthLab/pict-climate-risk-viz-chatbot',
    previews: [
      {
        kind: 'screenshot',
        src: pictClimateScreenshot,
        caption: 'PICT Climate Risk raster dashboard',
      },
      {
        kind: 'linkout',
        url: 'https://github.com/BrownEarthLab/pict-climate-risk-viz-chatbot',
        label: 'View repository',
      },
    ],
  },
  {
    id: 'transcribe-plus',
    title: 'Transcribe Plus',
    shortTitle: 'Transcribe+',
    summary:
      'Local transcription workspace with a Vite + Express 5 monorepo and an offline product demo video.',
    classification: 'LOCAL AUDIO TRANSCRIPTION // MONOREPO',
    tags: ['Express', 'Vanilla JS', 'Audio'],
    repo: 'https://github.com/slowbutfast/transcribe-plus',
    liveUrl: 'https://transcribe-plus-frontend.vercel.app/',
    previews: [
      { kind: 'video', src: transcribeClip, caption: 'Transcribe Plus product walkthrough' },
      { kind: 'terminal', label: 'Terminal' },
      { kind: 'linkout', url: 'https://github.com/slowbutfast/transcribe-plus', label: 'View repository' },
    ],
    terminalDemo: demo(transcribePlusCaptured, '$ npm test'),
  },
  {
    id: 'sandwave-sim',
    title: 'Sandwave Sim',
    shortTitle: 'Sandwave',
    summary:
      'Vanilla JS Chladni plate acoustic simulator rendering nodal-line sand patterns with Web Audio.',
    classification: 'ACOUSTIC PHYSICS SIMULATION // CHLADNI PLATES',
    tags: ['Vanilla JS', 'Audio'],
    repo: 'https://github.com/slowbutfast/sandwave-sim',
    liveUrl: 'https://sandwave-sim.vercel.app/',
    previews: [
      { kind: 'screenshot', src: sandwaveScreenshot, caption: 'Sandwave Chladni plate view' },
      { kind: 'terminal', label: 'Terminal' },
      { kind: 'linkout', url: 'https://github.com/slowbutfast/sandwave-sim', label: 'View repository' },
    ],
    terminalDemo: demo(sandwaveSimCaptured, '$ npm test'),
  },
  {
    id: 'attention-max',
    title: 'Attention Max',
    shortTitle: 'AttentionMax',
    summary:
      'Firefox MV3 extension that gamifies focus sessions with a popup timer and an options dashboard.',
    classification: 'FOCUS PROTOCOL EXTENSION // MV3',
    tags: ['Vanilla JS', 'WebExtension', 'Design', 'Graphics'],
    repo: 'https://github.com/slowbutfast/attention-max-public',
    previews: [
      { kind: 'screenshot', src: attentionMaxScreenshot, caption: 'Attention Max popup UI' },
      { kind: 'terminal', label: 'Terminal' },
      { kind: 'linkout', url: 'https://github.com/slowbutfast/attention-max-public', label: 'View repository' },
    ],
    terminalDemo: demo(attentionMaxCaptured, '$ npm test'),
  },
  {
    id: 'kintsugi-fracture',
    title: 'Kintsugi Fracture',
    shortTitle: 'Kintsugi 3D',
    summary:
      'WebGL fracture study that reassembles procedurally shattered geometry along gilded kintsugi seams in real time.',
    classification: 'PROCEDURAL MESH GENERATION // WEBGL',
    tags: ['Graphics'],
    repo: 'https://github.com/slowbutfast/kintsugi-fracture',
    liveUrl: 'https://kintsugi-fracture.vercel.app/',
    previews: [
      {
        kind: 'linkout',
        url: 'https://kintsugi-fracture.vercel.app/',
        label: 'Launch live app',
      },
    ],
  },
  {
    id: 'ivy-film-festival-2026',
    title: 'Ivy Film Festival 2026',
    shortTitle: 'Ivy Film\nFestival',
    summary:
      'Web design, visual identity, and interactive screening program for the student-run Ivy Film Festival.',
    classification: 'STUDENT FILM FESTIVAL // BRAND & WEB',
    tags: ['Design'],
    liveUrl: 'https://www.ivyfilmfestival.org/',
    previews: [
      {
        kind: 'linkout',
        url: 'https://www.ivyfilmfestival.org/',
        label: 'Visit festival site',
      },
    ],
  },
  {
    id: 'art-wip',
    title: 'ART',
    shortTitle: 'ART',
    summary: 'WIP',
    classification: 'ART & VISUAL EXPERIMENTS // WIP',
    tags: ['Design', 'Graphics'],
    liveUrl: '/art/',
    rainbowOnInteract: true,
    omitIndex: true,
    hideOverview: true,
    revealLabelOnInspect: true,
    gravityWeight: 2.5,
    previews: [],
  },
] satisfies ProjectData[];

export function getProjectById(id: string): ProjectData | undefined {
  return projects.find((p) => p.id === id);
}