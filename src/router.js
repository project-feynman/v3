import Vue from 'vue'
import Router from 'vue-router'
import RecordButton from '@/components/RecordButton'
import AudioRecorder from '@/components/AudioRecorder'

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
      path: '/record',
      component: AudioRecorder
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
      component: () => import(/* webpackChunkName: "answers" */ './views/Answer.vue')
    }
  ]
})
