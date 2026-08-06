import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@/app/theme-provider';
import { LandingRoute } from '@/routes/public/landing.route';

describe('LandingRoute', () => {
  it('shows the primary product promise', () => {
    const router = createMemoryRouter([{ path: '/', Component: LandingRoute }]);
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Дивись. Зберігай. Продовжуй.' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Почати дивитися/ })[0]).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByText('Каталог доступний без реєстрації')).toBeInTheDocument();
  });
});
