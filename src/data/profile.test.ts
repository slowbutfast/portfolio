import { describe, expect, it } from 'vitest';
import { candidateProfile, profile } from './profile';

const EXPECTED_BIO =
  'Gregory Lazatin is currently a Junior at Brown University studying Computer Science. He has worked on applied AI systems, geospatial data engineering, and interactive web apps, built with agentic workflows and test-driven design.';

describe('candidate profile dataset', () => {
  it('exposes the canonical Brown University bio verbatim', () => {
    expect(candidateProfile.bio).toBe(EXPECTED_BIO);
    expect(candidateProfile.bio).toContain('Brown University');
    expect(profile).toBe(candidateProfile);
  });

  it('pins the canonical identity and tagline', () => {
    expect(candidateProfile.name).toBe('Gregory Lazatin');
    expect(candidateProfile.tagline).toBe('Software Engineer · Autonomous Agents & Graphics');
    expect(candidateProfile.title).toBe(
      'Gregory Lazatin — Software Engineer & Creative Technologist',
    );
  });

  it('uses a mailto: protocol for email and https: for every external link', () => {
    expect(candidateProfile.email.startsWith('mailto:')).toBe(true);
    expect(candidateProfile.email).toBe('mailto:gregory.lazatin2006@gmail.com');

    const external = [
      candidateProfile.linkedin,
      candidateProfile.github,
      candidateProfile.resumeUrl,
      candidateProfile.resumeEmbedUrl,
    ];
    for (const url of external) {
      expect(url.startsWith('https://'), url).toBe(true);
    }
  });

  it('points at the verified social profiles and resume preview', () => {
    expect(candidateProfile.linkedin).toBe(
      'https://www.linkedin.com/in/gregory-lazatin/',
    );
    expect(candidateProfile.github).toBe('https://github.com/slowbutfast');
    expect(candidateProfile.resumeEmbedUrl).toContain(
      'https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/preview',
    );
  });
});
