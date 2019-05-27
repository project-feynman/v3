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
    // {
    //   path: '/:class_id',
    //   component: () => import(/* webpackChunkName: "tutorial" */ './views/Tutorial.vue')
    // },
    {
      path: '/:class_id/ranking',
      component: () => import(/* webpackChunkName: "ranking" */ './views/Ranking.vue')
    },
    {
      path: '/:class_id/workspace/:id',
      component: () => import(/* webpackChunkName: "workspace" */ './views/Workspace.vue')
    },
    {
      path: '/:class_id/:video_id',
      component: () => import(/* webpackChunkName: "video" */ './views/DoodleVideo.vue')
    }
  ]
})
