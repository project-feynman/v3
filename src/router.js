import Vue from 'vue';
import Router from 'vue-router';

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
      path: '/:class_id/room/:room_id',
      component: () => import(/* webpackChunkName: "piazza" */ './views/BlackboardRoom.vue') // there are no questions to navigate to initially
    },
    {
      path: '/:class_id/posts/new',
      component: () => import(/* webpackChunkName: "piazza" */ './views/CreatePost.vue') // there are no questions to navigate to initially
    },
    {
      path: '/:class_id/posts/tutorial',
      component: () => import(/* webpackChunkName: "piazza" */ './views/TutorialPost.vue') // there are no questions to navigate to initially
    },
    {
      path: '/:class_id/posts/:post_id',
      component: () => import(/* webpackChunkName: "piazza" */ './views/DisplayPost.vue')
    }
  ]
})
