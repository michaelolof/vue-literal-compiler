import Vue from "vue";
//@ts-ignore
import App from "./components/App.vue"

new Vue({
  el: "#app",
  components: {
    App,
  },
  render: (h) => h( App ),
})
