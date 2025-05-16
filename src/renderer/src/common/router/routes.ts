const RouteNames = {
  LIBRARY: 'library',
  COMMUNITY: 'community'
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
  }
]

export { routes, RouteNames }