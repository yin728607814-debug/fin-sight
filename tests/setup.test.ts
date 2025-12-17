/**
 * Basic test to verify testing environment setup
 */
describe('Testing Environment Setup', () => {
  test('Jest is working correctly', () => {
    expect(true).toBe(true);
  });

  test('Fast-check is available', async () => {
    const fc = await import('fast-check');
    expect(fc).toBeDefined();
    expect(typeof fc.integer).toBe('function');
  });

  test('Testing utilities are available', () => {
    expect(global.ResizeObserver).toBeDefined();
    expect(global.fetch).toBeDefined();
    expect(window.matchMedia).toBeDefined();
  });
});