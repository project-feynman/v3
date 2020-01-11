import Vue from 'vue'
import Vuetify from 'vuetify/lib';
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi',
  },
  theme: {
    // Configure color scheme of the website here 
    themes: {
      light: {
        primary: colors.blue, // #E53935
        secondary: colors.purple, // #FFCDD2
        accent: colors.blue, // #3F51B5
      },
    },
  }
})
