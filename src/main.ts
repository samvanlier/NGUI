import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// import WebCam from "../node_modules/vue-web-cam"

// Vue.use(WebCam)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
