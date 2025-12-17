import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import * as fc from 'fast-check';

// Custom render function for testing with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };

// Fast-check generators for property-based testing
export const generators = {
  // Generate valid news items
  newsItem: () =>
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      title: fc.string({ minLength: 10, maxLength: 200 }),
      content: fc.string({ minLength: 50, maxLength: 1000 }),
      source: fc.string({ minLength: 3, maxLength: 50 }),
      publishedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
      url: fc.webUrl(),
      relevanceScore: fc.float({ min: 0, max: 1, noNaN: true }),
    }),

  // Generate price data
  priceData: () =>
    fc.record({
      date: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
      open: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
      high: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
      low: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
      close: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
      volume: fc.option(fc.integer({ min: 0, max: 1000000 })),
      change: fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
      changePercent: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
    }),

  // Generate news analysis
  newsAnalysis: () =>
    fc.record({
      newsId: fc.string({ minLength: 1, maxLength: 50 }),
      impact: fc.constantFrom('positive', 'negative', 'neutral'),
      confidence: fc.float({ min: 0, max: 1, noNaN: true }),
      summary: fc.string({ minLength: 20, maxLength: 500 }),
      keyPoints: fc.array(fc.string({ minLength: 10, maxLength: 100 }), {
        minLength: 1,
        maxLength: 5,
      }),
      predictedChange: fc.float({ min: -50, max: 50, noNaN: true }),
      timeframe: fc.constantFrom('short', 'medium', 'long'),
    }),

  // Generate asset types
  assetType: () => fc.constantFrom('gold' as const, 'nasdaq' as const),

  // Generate valid date ranges
  dateRange: () =>
    fc.tuple(fc.date(), fc.date()).map(([start, end]) => {
      const [earlierDate, laterDate] = start <= end ? [start, end] : [end, start];
      return { start: earlierDate, end: laterDate };
    }),

  // Generate non-empty strings
  nonEmptyString: () => fc.string({ minLength: 1 }),

  // Generate positive numbers
  positiveNumber: () => fc.float({ min: 0.01, max: Number.MAX_SAFE_INTEGER }),

  // Generate API error responses
  apiError: () =>
    fc.record({
      status: fc.integer({ min: 400, max: 599 }),
      message: fc.string({ minLength: 5, maxLength: 100 }),
      code: fc.string({ minLength: 3, maxLength: 20 }),
    }),
};

// Test data factories
export const createMockNewsItem = (overrides = {}) => ({
  id: 'test-news-1',
  title: 'Test News Title',
  content: 'This is test news content that should be long enough for testing.',
  source: 'Test Source',
  publishedAt: new Date('2024-01-01'),
  url: 'https://example.com/news/1',
  relevanceScore: 0.8,
  ...overrides,
});

export const createMockPriceData = (overrides = {}) => ({
  date: new Date('2024-01-01'),
  open: 100,
  high: 105,
  low: 95,
  close: 102,
  volume: 1000000,
  change: 2,
  changePercent: 2.0,
  ...overrides,
});

export const createMockNewsAnalysis = (overrides = {}) => ({
  newsId: 'test-news-1',
  impact: 'positive' as const,
  confidence: 0.85,
  summary: 'This news is expected to have a positive impact on the market.',
  keyPoints: ['Key point 1', 'Key point 2'],
  predictedChange: 2.5,
  timeframe: 'short' as const,
  ...overrides,
});