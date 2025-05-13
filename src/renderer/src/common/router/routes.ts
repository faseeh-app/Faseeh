const RouteNames = {
  LIBRARY: 'library',
  COMMUNITY: 'community'
}

const routes = [
  {
    path: '/',
    name: RouteNames.LIBRARY,
    component: () => import('@/features/user-library/views/user-library.vue')
  },
  {
    path: '/community',
    name: RouteNames.COMMUNITY,
    component: () => import('@/features/community-explorer/views/community-explorer.vue')
  }
]

export { routes, RouteNames }
