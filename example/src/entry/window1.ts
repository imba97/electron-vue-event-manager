import Vue from 'vue'
import Window1 from '@/Window1.vue'
import router from '@/router'
import store from '@/store'

import '@/styles/index.css'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: (h) => h(Window1)
}).$mount('#app')
