import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: () => import(/* webpackChunkName: "home" */ './views/Home.vue')
    },
    {
      path: '/beta-workspace',
      component: () => import(/* webpackChunkName: "answer" */ './views/BetaWorkspace.vue')
    },
    {
      path: '/:teacher_id',
      component: () => import(/* webpackChunkName: "tutorial" */ './views/Schedule.vue') 
    },
    {
      path: '/:teacher_id/workspace/:id',
      component: () => import(/* webpackChunkName: "workspace" */ './views/Workspace.vue') 
    },
    {
      path: '/:teacher_id/answer/:id',
      component: () => import(/* webpackChunkName: "answer" */ './views/Answer.vue')
    }
  ]
})
