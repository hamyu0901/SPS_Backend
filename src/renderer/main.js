import Vue from 'vue';
import App from './App';
import router from './router';
import axios from 'axios';
import store from './store';
import 'babel-polyfill';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.css';
import 'vuetify/dist/vuetify.min.css';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.prototype.$http = axios

Vue.config.productionTip = false

Vue.use(Vuetify)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})

export { axios };