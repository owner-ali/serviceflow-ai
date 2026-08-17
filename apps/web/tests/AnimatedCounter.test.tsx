import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AnimatedCounter from '../components/AnimatedCounter';

// jsdom doesn't implement IntersectionObserver — a minimal stub that fires
// "intersecting" immediately is enough to exercise the count-up logic.
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as any);
  }
  disconnect() {}
  unobserve() {}
}
// @ts-expect-error — test stub
global.IntersectionObserver = MockIntersectionObserver;

describe('AnimatedCounter', () => {
  it('renders the prefix and suffix around the counted value', async () => {
    render(<AnimatedCounter target={100} prefix="$" suffix=" ★" duration={10} />);
    await waitFor(() => {
      const text = screen.getByText((_, el) => el?.textContent?.startsWith('$') ?? false);
      expect(text.textContent).toContain('$');
      expect(text.textContent).toContain('★');
    });
  });

  it('eventually reaches the target value', async () => {
    render(<AnimatedCounter target={42} duration={10} />);
    await waitFor(
      () => {
        const el = screen.getByText('42');
        expect(el).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
