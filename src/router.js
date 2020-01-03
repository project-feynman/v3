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
      path: '/:class_id/videos',
      component: () => import(/* webpackChunkName: "videos" */ './views/VideoGallery.vue')
    },
    {
      path: '/:class_id/questions',
      component: () => import(/* webpackChunkName: "piazza" */ './views/Piazza.vue')
    },
    {
      path: '/:class_id/workspace/:id',
      component: () => import(/* webpackChunkName: "blackboard" */ './views/BlackboardRoom.vue'),
    },
    {
      path: '/:class_id/:video_id',
      component: () => import(/* webpackChunkName: "video" */ './views/FullVideo.vue')
    }
  ]
})
