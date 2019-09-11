import Vue from 'vue'
import Router from 'vue-router'
import store from "./store.js"

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
      path: '/playground',
      component: () => import(/* webpackChunkName: "tutorial" */ './components/VuetifyMenu.vue')
    },
    {
      name: "Classmates",
      path: '/:class_id/ranking',
      component: () => import(/* webpackChunkName: "ranking" */ './views/Ranking.vue')
    },
    {
      path: '/:class_id/doodles',
      component: () => import(/* webpackChunkName: "ranking" */ './views/Explanations.vue')
    },
    {
      path: '/:class_id/workspace/:id',
      component: () => import(/* webpackChunkName: "workspace" */ './views/Workspace.vue'),
      // beforeEnter: (to, from, next) => {
      //   if (store.state.user) {
      //     next()
      //   } else {
      //     next({ name: "Classmates" })
      //   }
      //   // console.log("to, from, next =", to, from, next)
      // }
    },
    {
      path: '/:class_id/:video_id',
      component: () => import(/* webpackChunkName: "video" */ './views/DoodleVideo.vue')
    }
  ]
})
