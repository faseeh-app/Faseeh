const RouteNames = {
  LIBRARY: 'library',
  COMMUNITY: 'community',
  MEDIA_PLAYER: 'mediaplayer'
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
  }
]

export { routes, RouteNames }
