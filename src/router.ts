import Vue from 'vue'
import Router from 'vue-router'
import Search from '@/views/Search.vue'
import Meta from 'vue-meta'

Vue.use(Router)
Vue.use(Meta)

export default new Router({
  mode: 'history',
  base: process.env.NODE_ENV === 'production' ? 'published-tracks' : '',
  // base: process.env.NODE_ENV === 'production' ? 'trackmaster' : '',
  routes: [
    {
      path: '/',
      redirect: { name: 'search'},
    },
    {
      path: '/search',
      name: 'search',
      component: Search,
    },
    {
      path: '/map',
      name: 'map',
      // this generates a separate chunk (<component>.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/Map.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    return { x: 0, y: 0 }
  },
})
