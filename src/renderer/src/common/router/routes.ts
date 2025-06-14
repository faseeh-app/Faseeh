const RouteNames = {
  LIBRARY: 'library',
  COMMUNITY: 'community',
  MEDIA_PLAYER: 'mediaplayer',
  DOCUMENT_VIEWER: 'document-viewer',
  VIDEO_PLAYER: 'video-player',
  SETTINGS: 'settings'
}

const routes = [
  {
    path: '/',
    name: RouteNames.LIBRARY,
    component: () => import('@renderer/features/user-library/views/user-library.vue'),
    children: [
      {
        path: 'mediaplayer',
        name: 'mediaplayer',
        component: () => import('@renderer/features/user-library/views/media-player.vue')
      }
    ]
  },
  {
    path: '/community',
    name: RouteNames.COMMUNITY,
    component: () => import('@renderer/features/community-explorer/views/community-explorer.vue')
  },
  {
    path: '/document/:id',
    name: RouteNames.DOCUMENT_VIEWER,
    component: () => import('@renderer/features/document-viewer/views/document-viewer.vue')
  },
  {
    path: '/video/:id',
    name: RouteNames.VIDEO_PLAYER,
    component: () => import('@renderer/features/document-viewer/views/video-player.vue')
  }
]

export { routes, RouteNames }
