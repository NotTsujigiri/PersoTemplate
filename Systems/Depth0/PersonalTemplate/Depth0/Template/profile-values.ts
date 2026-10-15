export type PersonalProfile = {
  experience: string[];
  learning: string[];
  projects: string[];
  goals: string[];
  workingPreferences: string[];
  aiExpectations: string[];
  accessibility: string[];
};

export type PersonalProfileSnapshot = {
  values: PersonalProfile;
  revision: string;
};

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw Error(`${label} requires a list of non-empty strings.`);
  const items: readonly unknown[] = value;
  return items.map(item => {
    if (typeof item !== 'string' || !item.trim()) throw Error(`${label} requires a list of non-empty strings.`);
    return item;
  });
}

export function emptyPersonalProfile(): PersonalProfile {
  return {experience: [], learning: [], projects: [], goals: [], workingPreferences: [], aiExpectations: [], accessibility: []};
}

export function parsePersonalProfile(value: unknown): PersonalProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || !('experience' in value) || !('learning' in value) || !('projects' in value)
      || !('goals' in value) || !('workingPreferences' in value)
      || !('aiExpectations' in value) || !('accessibility' in value)
      || Object.keys(value).length !== 7) throw Error('Unsupported personal information fields.');
  return {
    experience: strings(value.experience, 'Experience'),
    learning: strings(value.learning, 'Learning'),
    projects: strings(value.projects, 'Projects and collaboration'),
    goals: strings(value.goals, 'Goals'),
    workingPreferences: strings(value.workingPreferences, 'Working preferences'),
    aiExpectations: strings(value.aiExpectations, 'AI expectations'),
    accessibility: strings(value.accessibility, 'Accessibility needs'),
  };
}

export function parsePersonalProfileSnapshot(value: unknown): PersonalProfileSnapshot {
  if (!value || typeof value !== 'object' || !('values' in value)
      || !('revision' in value) || typeof value.revision !== 'string' || !value.revision) {
    throw Error('Personal information requires a profile snapshot and revision.');
  }
  return {values: parsePersonalProfile(value.values), revision: value.revision};
}
