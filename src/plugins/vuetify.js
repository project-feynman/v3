import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import 'vuetify/src/stylus/app.styl'
// Helpers
import colors from 'vuetify/es5/util/colors'

Vue.use(Vuetify, {
  iconfont: 'md',
  theme: {
    primary: colors.blue, // #E53935
    secondary: colors.purple, // #FFCDD2
    accent: colors.blue // #3F51B5
  }
})
