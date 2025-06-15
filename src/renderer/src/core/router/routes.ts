const RouteNames = {
  LIBRARY: 'library',
  COMMUNITY: 'community',
  MEDIA_LAYOUT: 'media-layout',
  DOCUMENT_VIEWER: 'document-viewer',
  VIDEO_PLAYER: 'video-player',
  SETTINGS: 'settings'
}

const routes = [
  {
    path: '/',
    name: RouteNames.LIBRARY,
    component: () => import('@renderer/features/user-library/views/user-library.vue')
  },
  {
    path: '/community',
    name: RouteNames.COMMUNITY,
    component: () => import('@renderer/features/community-explorer/views/community-explorer.vue')
  },
  {
    path: '/media',
    name: RouteNames.MEDIA_LAYOUT,
    component: () => import('@renderer/features/user-library/components/MediaLayout.vue'),
    children: [
      {
        path: 'video/:id',
        name: RouteNames.VIDEO_PLAYER,
        component: () => import('@renderer/features/user-library/views/video-player.vue'),
        meta: { title: 'Video Player' }
      },
      {
        path: 'document/:id',
        name: RouteNames.DOCUMENT_VIEWER,
        component: () => import('@renderer/features/user-library/views/text-reader.vue'),
        meta: { title: 'Document Viewer' }
      }
    ]
  },
  // Legacy redirects for backward compatibility
  {
    path: '/document/:id',
    redirect: (to) => `/media/document/${to.params.id}`
  },
  {
    path: '/video/:id',
    redirect: (to) => `/media/video/${to.params.id}`
  },
  {
    path: '/mediaplayer',
    redirect: '/media'
  }
]

export { routes, RouteNames }
