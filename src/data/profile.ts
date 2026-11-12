import type { CandidateProfile } from '../types/portfolio';

/**
 * Verified candidate identity. Every contact surface, metadata renderer, and
 * linkout reads from this record so the portfolio has one source of truth.
 */
export const candidateProfile: CandidateProfile = {
  name: 'Gregory Lazatin',
  tagline: 'Software Engineer · Autonomous Agents & Graphics',
  title: 'Gregory Lazatin — Software Engineer & Creative Technologist',
  bio: 'Gregory Lazatin is currently a Junior at Brown University studying Computer Science. He has worked on applied AI systems, geospatial data engineering, and interactive web apps, built with agentic workflows and test-driven design.',
  email: 'mailto:gregory.lazatin2006@gmail.com',
  linkedin: 'https://www.linkedin.com/in/gregory-lazatin/',
  github: 'https://github.com/slowbutfast',
  resumeUrl:
    'https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/view?usp=drive_link',
  resumeEmbedUrl:
    'https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/preview',
};

/** Alias matching the capability name used across the OpenSpec artifacts. */
export const profile = candidateProfile;
