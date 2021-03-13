import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

const router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    { 
      name: "RedirectToForumQuestion",
      path: "/forum/:class_id/:question_id",
      component: () => import(/* webpackChunkName: "redirect-to-forum-question" */ "./pages/RedirectToForumQuestion.vue"),
      props: route => {
        return {
          classID: route.params.class_id,
          questionID: route.params.question_id
        };
      }
    },
    {
      path: "/explanation/:expl_id/class/:class_id",
      component: () => import(/* webpackChunkName: "home" */ "./components/ClassPageSeePost.vue"),
      props: route => {
        return { 
          postID: route.params.expl_id
        };
      }
    },
    {
      path: "/music-playground",
      component: () => import(/* webpackChunkName: "music-playground" */ "./components/MusicPlayer.vue")
    },
    {
      path: "/canvas-playground",
      component: () => import(/* webpackChunkName: "canvas-playground" */ "./pages/CanvasPlayground.vue")
    },
    {
      path: "/library-playground",
      component: () => import(/* webpackChunkName: "library-playground" */ "./pages/LibraryPlayground.vue")
    },
    {
      path: "/class/:class_id/section/:section_id/room/:room_id",
      component: () => import(/* webpackChunkName: "class-page-layout" */ "./pages/ClassPageLayout.vue"),
      props: route => {
        return {
          classID: route.params.class_id
        }
      }
    }
  ]
});

export default router;

