import DefaultTheme from "vitepress/theme";
import SwanHome from "./SwanHome.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("SwanHome", SwanHome);
  },
};
