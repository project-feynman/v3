import { mount, createLocalVue } from "@vue/test-utils";
import Vuetify from "vuetify/lib";
import DoodleVideo from "@/components/DoodleVideo.vue";

// const localVue = createLocalVue();

// describe("DoodleVideo.vue", () => {
//   let vuetify;

//   beforeEach(() => {
//     vuetify = new Vuetify();
//   });

//   it("should render a thumbnail when passed an imageURL", () => {
//     const wrapper = mount(DoodleVideo, {
//       localVue,
//       vuetify,
//       propsData: {
//         thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA9MAAAIyCAYAAkhAfwTOqIvrEtH+7d5qAA1ebfgyIk99bQsp1d+g6DEJkAAJkAAJ6JzARZn5uG7CUcQGN6uRLMtKxOvbhyCvpudxK50Pk+6TgE0EKKZtwuScQr+YuR/njyjAE+tG4vOsROc0ylZIwE"
//       }
//     });

//     expect(wrapper.html()).toMatchSnapshot();
//     const image = wrapper.find(".img");
//   });
// });
