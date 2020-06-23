import Vue from "vue";
import Router from "vue-router";

Vue.use(Router)

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    { 
      path: "/",
      component: () => import(/* webpackChunkName: "home" */ "./pages/Home.vue")
    },
    {
      path: "/class/:class_id",
      component: () => import(/* webpackChunkName: "class-page" */ "./pages/ClassPage.vue"),
      children: [
        {
          path: "",
          component: () => import(/* webpackChunkName: "class-page-overview" */ "./pages/ClassPageOverview.vue") 
        },
        {
          path: "room/center-table",
          component: () => import(/* webpackChunkName: "class-page-center-table" */ "./pages/ClassPageCenterTable.vue")
        },
        {
          path: "room/:room_id",
          component: () => import(/* webpackChunkName: "class-page-live" */ "./pages/ClassPageLiveBoard.vue") 
        },
        {
          // when /user/:id/posts is matched
          path: "new",
          component: () => import(/* webpackChunkName: "new" */ "./pages/ClassPageNewPost.vue") 
        },
        {
          // when /user/:id/posts is matched
          path: "posts/new-question",
          component: () => import(/* webpackChunkName: "new-question" */ "./pages/ClassPageNewQuestion.vue") 
        },
        {
          path: "posts/:post_id",
          component: () => import(/* webpackChunkName: "post" */ "./pages/ClassPageSeePost.vue")
        },
        {
          path: "questions/:question_id",
          component: () => import(/* webpackChunkName: "post" */ "./pages/ClassPageSeeQuestion.vue")
        }
      ]
    }
  ]
})
