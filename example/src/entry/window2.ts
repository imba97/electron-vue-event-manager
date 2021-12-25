import Vue from 'vue'
import Window2 from '@/Window2.vue'
import router from '@/router'
import store from '@/store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: (h) => h(Window2)
}).$mount('#app')
