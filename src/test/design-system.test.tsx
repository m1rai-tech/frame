import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';

describe('design system primitives', () => {
  it('clamps progress to the supported range', () => {
    render(<ProgressBar value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders an actionable empty state', () => {
    render(<EmptyState description="Додайте перший тайтл." title="Список порожній" />);
    expect(screen.getByRole('heading', { name: 'Список порожній' })).toBeInTheDocument();
  });
});
