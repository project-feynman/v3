import Vue from "vue";
import Vuetify from "vuetify/lib";
import colors from "vuetify/lib/util/colors";

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: "mdi"
  },
  theme: {
    themes: {
      light: {
        primary: colors.blue, // #E53935
        secondary: colors.purple, // #FFCDD2 or deep-purple accent-4 
        accent: "#ff5b24"
      }
    }
  },
  options: {
    customProperties: true
  }
});
