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
    summary:
      'Generative text-adventure engine with a 20-tool MCP server and an OAuth-gated multiplayer canvas.',
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
    summary:
      'Python CLI that renders tailored LaTeX resumes from structured YAML via an argparse-driven build pipeline.',
    tags: ['Agent Tooling', 'LaTeX'],
    repo: 'https://github.com/slowbutfast/agentic-resume-builder',
    previews: [{ kind: 'terminal', label: 'Terminal' }],
    terminalDemo: demo(resumeBuilderCaptured, '$ python3 build_resume.py'),
  },
  {
    id: 'pict-climate-risk-viz-chatbot',
    title: 'PICT Climate Risk Viz',
    summary:
      'Geospatial climate-risk chat and raster visualization built on an Express backend with React 19.',
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
    summary:
      'Local transcription workspace with a Vite + Express 5 monorepo and an offline product demo video.',
    tags: ['Express', 'Vanilla JS', 'Audio'],
    repo: 'https://github.com/slowbutfast/transcribe-plus',
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
    summary:
      'Vanilla JS Chladni plate acoustic simulator rendering nodal-line sand patterns with Web Audio.',
    tags: ['Vanilla JS', 'Audio'],
    repo: 'https://github.com/slowbutfast/sandwave-sim',
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
    summary:
      'Firefox MV3 extension that gamifies focus sessions with a popup timer and an options dashboard.',
    tags: ['Vanilla JS', 'WebExtension'],
    repo: 'https://github.com/slowbutfast/attention-max-public',
    previews: [
      { kind: 'screenshot', src: attentionMaxScreenshot, caption: 'Attention Max popup UI' },
      { kind: 'terminal', label: 'Terminal' },
      { kind: 'linkout', url: 'https://github.com/slowbutfast/attention-max-public', label: 'View repository' },
    ],
    terminalDemo: demo(attentionMaxCaptured, '$ npm test'),
  },
] satisfies ProjectData[];

export function getProjectById(id: string): ProjectData | undefined {
  return projects.find((p) => p.id === id);
}