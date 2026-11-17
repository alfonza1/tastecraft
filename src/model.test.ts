import { describe, expect, it } from 'vitest';
import { AXES, choose, freshProfile, MAX_HISTORY, parseProfile, tokens } from './model';
import { componentExport, cssExport, exportContent, skillExport } from './exports';
describe('preference evidence', () => {
  it('learns each axis independently and averages conflicting evidence', () => {
    const first = choose(freshProfile(), 'density', 100);
    expect(first.values.density).toBe(100);
    expect(first.values.typography).toBe(0);
    const second = choose(first, 'density', 0);
    expect(second.values.density).toBe(50);
    expect(first.history).toHaveLength(1);
  });
  it('does not manufacture a preference from a skip', () => {
    const base = freshProfile();
    const result = choose(base, 'density', null);
    expect(result.values).toEqual(base.values);
    expect(result.history[0].value).toBeNull();
  });
  it('bounds history and uses retained observations', () => {
    let profile = freshProfile();
    for (let i = 0; i < MAX_HISTORY + 5; i++) profile = choose(profile, 'density', 100);
    expect(profile.history).toHaveLength(MAX_HISTORY);
    expect(profile.values.density).toBe(100);
  });
});
describe('profile interchange', () => {
  it('round trips exports including evidence and removes unknown fields', () => {
    const profile = choose(freshProfile(), 'corners', 100);
    expect(parseProfile(exportContent(profile, 'json'))).toEqual(profile);
    expect(parseProfile(JSON.stringify({ ...profile, injected: '<script>' }))).not.toHaveProperty('injected');
  });
  it.each(['nope', 'null', '{}', '{"version":9}', JSON.stringify({ ...freshProfile(), values: { ...freshProfile().values, density: -1 } }), JSON.stringify({ ...freshProfile(), history: [{ axis: 'other', value: 1 }] }), JSON.stringify({ ...freshProfile(), history: [{ axis: 'density', value: '100' }] })])('rejects invalid profiles: %s', text => { expect(() => parseProfile(text)).toThrow(); });
  it('rejects oversized input before parsing', () => { expect(() => parseProfile(' '.repeat(100_001))).toThrow('too large'); });
});
describe('portable outputs', () => {
  it('every style axis changes concrete tokens', () => {
    for (const { id } of AXES) expect(tokens({ ...freshProfile().values, [id]: 0 })).not.toEqual(tokens({ ...freshProfile().values, [id]: 100 }));
  });
  it('emits reduced motion and evidence-aware guidance', () => {
    const profile = choose(freshProfile(), 'density', 100);
    expect(cssExport(profile)).toContain('--tc-space: 32px');
    expect(cssExport(profile)).toContain('prefers-reduced-motion');
    expect(skillExport(profile)).toContain('1 recorded comparison');
    expect(skillExport(profile)).toContain('not a model trained');
  });
  it('creates a standalone interactive React reference and scopes CSS', () => {
    const component = componentExport(freshProfile());
    expect(component).toContain('useState');
    expect(component).toContain('aria-pressed={done}');
    expect(component).not.toContain(':root');
    expect(component).toContain('.tastecraft-card');
  });
});
