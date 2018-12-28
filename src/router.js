import Vue from 'vue'
import Router from 'vue-router'
import Student from './views/Student'
import Landing from './views/Landing'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: Landing
    },
    {
      path: '/student/:id',
      component: Student
    },
    {
      path: '/explanation/:id',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/Explanation.vue')
    }
  ]
})
