<template>
  <div id="app">
    <div v-if="!window2Closed">
      <input type="text" v-model="message" />
      <button @click="sendToWindow2">向窗口2发送消息</button>
    </div>
    <div v-else>窗口2 已关闭</div>

    <h1>组件之间的传递</h1>
    <div class="component-container">
      <Component1></Component1>
      <Component2></Component2>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

import EventManager from 'electron-vue-event-manager'
import { EventType } from './base/Event/EventEnum'

import Component1 from '@/components/Component1.vue'
import Component2 from '@/components/Component2.vue'

// 初始化事件监听
EventManager.Instance().rendererInit()

@Component({
  components: {
    Component1,
    Component2
  }
})
export default class Window1 extends Vue {

  window2Closed = false

  message = ''

  created() {
    EventManager.Instance().addEventListener(EventType.Window2BeforeClose, () => {
      this.window2Closed = true
    })
  }

  sendToWindow2() {
    EventManager.Instance().broadcast<string>(EventType.Window1SendMessage, this.message)
  }
}

</script>