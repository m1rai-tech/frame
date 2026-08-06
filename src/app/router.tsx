import { createBrowserRouter, redirect } from 'react-router';

import { RouteErrorBoundary } from '@/components/feedback/RouteErrorBoundary';
import { RootLayout } from '@/components/layout/RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        loader: () => redirect('/browse'),
      },
      {
        path: 'browse',
        lazy: async () => {
          const { BrowseRoute } = await import('@/routes/public/browse.route');
          return { Component: BrowseRoute };
        },
      },
      {
        path: 'movies',
        loader: () => redirect('/browse?type=movie'),
      },
      {
        path: 'series',
        loader: () => redirect('/browse?type=series'),
      },
      {
        path: 'anime',
        loader: () => redirect('/browse?type=anime'),
      },
      {
        path: 'title/:slug',
        lazy: async () => {
          const { TitleRoute } = await import('@/routes/public/title.route');
          return { Component: TitleRoute };
        },
      },
      {
        path: 'profile/:username',
        lazy: async () => {
          const { ProfileRoute } = await import('@/routes/public/profile.route');
          return { Component: ProfileRoute };
        },
      },
      {
        path: 'health',
        lazy: async () => {
          const { HealthRoute } = await import('@/routes/public/health.route');
          return { Component: HealthRoute };
        },
      },
      {
        path: 'credits',
        lazy: async () => {
          const { CreditsRoute } = await import('@/routes/public/credits.route');
          return { Component: CreditsRoute };
        },
      },
      {
        path: 'legal/:document',
        lazy: async () => {
          const { LegalRoute } = await import('@/routes/public/legal.route');
          return { Component: LegalRoute };
        },
      },
      {
        path: 'login',
        lazy: async () => {
          const { LoginRoute } = await import('@/routes/auth/login.route');
          return { Component: LoginRoute };
        },
      },
      {
        path: 'register',
        lazy: async () => {
          const { RegisterRoute } = await import('@/routes/auth/register.route');
          return { Component: RegisterRoute };
        },
      },
      {
        path: 'forgot-password',
        lazy: async () => {
          const { ForgotPasswordRoute } = await import('@/routes/auth/forgot-password.route');
          return { Component: ForgotPasswordRoute };
        },
      },
      {
        path: 'reset-password',
        lazy: async () => {
          const { ResetPasswordRoute } = await import('@/routes/auth/reset-password.route');
          return { Component: ResetPasswordRoute };
        },
      },
      {
        path: 'auth/callback',
        lazy: async () => {
          const { AuthCallbackRoute } = await import('@/routes/auth/callback.route');
          return { Component: AuthCallbackRoute };
        },
      },
      {
        path: 'design-system',
        lazy: async () => {
          const { DesignSystemRoute } = await import('@/routes/app/design-system.route');
          return { Component: DesignSystemRoute };
        },
      },
      {
        lazy: async () => {
          const { RequireAuth } = await import('@/features/auth/RequireAuth');
          return { Component: RequireAuth };
        },
        children: [
          {
            path: 'profile',
            lazy: async () => {
              const { MyProfileRoute } = await import('@/routes/app/my-profile.route');
              return { Component: MyProfileRoute };
            },
          },
          {
            path: 'home',
            loader: () => redirect('/browse'),
          },
          {
            path: 'my-list',
            lazy: async () => {
              const { MyListRoute } = await import('@/routes/app/my-list.route');
              return { Component: MyListRoute };
            },
          },
          {
            path: 'history',
            lazy: async () => {
              const { HistoryRoute } = await import('@/routes/app/history.route');
              return { Component: HistoryRoute };
            },
          },
          {
            path: 'notifications',
            lazy: async () => {
              const { NotificationsRoute } = await import('@/routes/app/notifications.route');
              return { Component: NotificationsRoute };
            },
          },
          {
            path: 'profile/edit',
            lazy: async () => {
              const { ProfileEditRoute } = await import('@/routes/app/profile-edit.route');
              return { Component: ProfileEditRoute };
            },
          },
          {
            path: 'profile/stats',
            lazy: async () => {
              const { ProfileStatsRoute } = await import('@/routes/app/profile-stats.route');
              return { Component: ProfileStatsRoute };
            },
          },
          {
            path: 'settings/privacy',
            lazy: async () => {
              const { PrivacySettingsRoute } = await import('@/routes/app/privacy-settings.route');
              return { Component: PrivacySettingsRoute };
            },
          },
          {
            path: 'settings/notifications',
            lazy: async () => {
              const { NotificationSettingsRoute } = await import('@/routes/app/notification-settings.route');
              return { Component: NotificationSettingsRoute };
            },
          },
          {
            path: 'onboarding',
            lazy: async () => {
              const { OnboardingRoute } = await import('@/routes/app/onboarding.route');
              return { Component: OnboardingRoute };
            },
          },
          {
            path: 'watch/:episodeId',
            lazy: async () => {
              const { WatchRoute } = await import('@/routes/app/watch.route');
              return { Component: WatchRoute };
            },
          },
          {
            path: 'admin',
            lazy: async () => {
              const { RequireEditor } = await import('@/features/admin/RequireEditor');
              return { Component: RequireEditor };
            },
            children: [
              {
                index: true,
                loader: () => redirect('/admin/titles'),
              },
              {
                path: 'titles',
                lazy: async () => {
                  const { AdminTitlesRoute } = await import('@/routes/admin/titles.route');
                  return { Component: AdminTitlesRoute };
                },
              },
              {
                path: 'titles/:id',
                lazy: async () => {
                  const { AdminTitleEditRoute } = await import('@/routes/admin/title-edit.route');
                  return { Component: AdminTitleEditRoute };
                },
              },
              {
                path: 'imports',
                lazy: async () => {
                  const { AdminImportsRoute } = await import('@/routes/admin/imports.route');
                  return { Component: AdminImportsRoute };
                },
              },
              {
                path: 'seasons/:id',
                lazy: async () => {
                  const { AdminSeasonEditRoute } = await import('@/routes/admin/season-edit.route');
                  return { Component: AdminSeasonEditRoute };
                },
              },
              {
                path: 'episodes/:id',
                lazy: async () => {
                  const { AdminEpisodeEditRoute } =
                    await import('@/routes/admin/episode-edit.route');
                  return { Component: AdminEpisodeEditRoute };
                },
              },
              {
                path: 'genres',
                lazy: async () => {
                  const { AdminGenresRoute } = await import('@/routes/admin/genres.route');
                  return { Component: AdminGenresRoute };
                },
              },
              {
                path: 'collections',
                lazy: async () => {
                  const { AdminCollectionsRoute } =
                    await import('@/routes/admin/collections.route');
                  return { Component: AdminCollectionsRoute };
                },
              },
              {
                path: 'collections/:id',
                lazy: async () => {
                  const { AdminCollectionEditRoute } =
                    await import('@/routes/admin/collection-edit.route');
                  return { Component: AdminCollectionEditRoute };
                },
              },
            ],
          },
        ],
      },
      {
        path: '*',
        lazy: async () => {
          const { NotFoundRoute } = await import('@/routes/public/not-found.route');
          return { Component: NotFoundRoute };
        },
      },
    ],
  },
]);
