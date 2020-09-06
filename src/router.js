import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

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
      component: () => import(/* webpackChunkName: "class-overview" */ "./pages/ClassPageTemplate.vue"),
      children: [
        {
          path: "",
          component: () => import(/* webpackChunkName: "all-open-spaces" */ "./pages/AllOpenSpaces.vue") 
        },
        {
          path: "section/:section_id",
          component: () => import(/* webpackChunkName: "particular-open-space" */ "./pages/ParticularOpenSpace.vue"),
          children: [
            {
              path: "",
              component: () => import(/* webpackChunkName: "common-room" */ "./pages/CommonRoom.vue")
            },
            {
              path: "room/:room_id",
              component: () => import(/* webpackChunkName: "realtime-room" */ "./pages/RealtimeRoom.vue"),
              props: route => {
                return {
                  roomId: route.params.room_id
                };
              }
            }
          ]
        },
        // {
        //   // when /user/:id/posts is matched
        //   path: "new",
        //   // component: () => import(/* webpackChunkName: "new" */ "./pages/ClassPageNewPost.vue") 
        //   // move from components folder to pages folder later
        //   component: () => import(/* webpackChunkName: "new" */ "./components/ExplanationCreate.vue"),
        //   props: route => {
        //     // if it's a new post/question, the query type will be "post" or "question"
        //     return {
        //       explType: route.query.type ? "post" : "reply" 
        //     };  
        //   }
        // },
        // {
        //   path: "posts/:post_id",
        //   component: () => import(/* webpackChunkName: "post" */ "./pages/ClassPageSeePost.vue")
        // },
        // {
        //   path: "questions/:question_id",
        //   component: () => import(/* webpackChunkName: "question" */ "./pages/ClassPageSeeQuestion.vue")
        // }
      ]
    }
  ]
})
