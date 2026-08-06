import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { contrastRatio } from '@/lib/color-contrast';

describe('accessibility baseline', () => {
  it('associates input errors and exposes invalid state', () => {
    render(<Input error="Обов’язкове поле" id="profile-name" label="Ім’я" />);
    const input = screen.getByLabelText('Ім’я');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'profile-name-message');
  });

  it('exposes progress as a readable percentage', () => {
    render(<ProgressBar value={42.4} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '42%');
  });

  it.each([
    ['dark foreground', '#f2f0eb', '#111315'],
    ['dark muted text', '#aaa7a0', '#111315'],
    ['dark accent button', '#17120b', '#d69a45'],
    ['light foreground', '#191a1c', '#f5f2ec'],
    ['light muted text', '#68645e', '#f5f2ec'],
    ['light accent button', '#fffaf2', '#9c641e'],
  ])('%s meets WCAG AA text contrast', (_, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
