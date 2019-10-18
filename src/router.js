import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    { 
      name: "Home",
      path: '/',
      component: () => import(/* webpackChunkName: "home" */ './views/Home.vue')
    },
    {
      name: "Classmates",
      path: '/:class_id/classmates',
      component: () => import(/* webpackChunkName: "ranking" */ './views/Classmates.vue')
    },
    {
      path: '/:class_id/gallery',
      component: () => import(/* webpackChunkName: "ranking" */ './views/Explanations.vue')
    },
    {
      path: '/:class_id/workspace/:id',
      component: () => import(/* webpackChunkName: "workspace" */ './views/Workspace.vue'),
    },
    {
      path: '/:class_id/:video_id',
      component: () => import(/* webpackChunkName: "video" */ './views/DoodleVideo.vue')
    }
  ]
})
