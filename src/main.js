import Vue from 'vue'
import App from './App.vue'
import store from './store'
import VueRouter from "vue-router";
import vuetify from './plugins/vuetify';
import Trainer from "./components/Trainer";
import Info from "./components/Info";
import Tutorial from "./components/Tutorial";
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.use(VueRouter);

Vue.config.productionTip = false;

const router = new VueRouter({
  routes: [
    {path: '/', redirect: '/trainer'},
    {path: '/trainer', name: "trainer", component: Trainer},
    {path: "/info", name: "info", component: Info},
    {path: "/tutorial", name: "tutorial", component: Tutorial}
  ],
  mode: 'history'
});

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');
