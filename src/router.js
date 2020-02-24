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
      component: () => import(/* webpackChunkName: "realtime-board" */ './views/BlackboardRoom.vue') 
    },
    {
      path: '/:class_id/posts/new',
      component: () => import(/* webpackChunkName: "new" */ './views/CreatePost.vue') 
    },
    {
      path: '/:class_id/posts/tutorial',
      component: () => import(/* webpackChunkName: "tutorial" */ './views/TutorialPost.vue') 
    },
    {
      path: '/:class_id/posts/:post_id',
      component: () => import(/* webpackChunkName: "post" */ './views/DisplayPost.vue')
    }
  ]
})
