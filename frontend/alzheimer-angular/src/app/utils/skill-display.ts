/** Optional emoji prefix for known skill codes (demo UI). */
const SKILL_ICONS: Record<string, string> = {
  DOCTOR: '🩺',
  NURSE: '💉',
  CAREGIVER: '🤝',
  FAMILY: '👨‍👩‍👧',
  VOLUNTEER: '🙋',
};

export function skillChipLabel(name: string | undefined | null): string {
  if (name == null || name === '') {
    return '';
  }
  const key = name.trim().toUpperCase();
  const icon = SKILL_ICONS[key];
  return icon ? `${icon} ${name}` : name;
}
