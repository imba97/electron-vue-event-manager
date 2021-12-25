<template>
  <div id="app">
    <p>来自 Window1的 消息：{{ message }}</p>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'

import EventManager from '../../electron-vue-event-manager'
import { EventType } from '@/base/Event/EventEnum'

// 初始化事件监听
EventManager.Instance().rendererInit()

@Component
export default class Window1 extends Vue {
  message = ''

  created() {
    // 监听 窗口1发送消息 事件
    EventManager.Instance().addEventListener<string>(EventType.Window1SendMessage, (window2Message) => {
      this.message = window2Message
      console.log('window2: ', window2Message)
    })
  }
}

</script>