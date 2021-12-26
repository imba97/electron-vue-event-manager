<template>
  <div class="component">
    <h1>组件2</h1>
    <p>
      <input type="text" v-model="name" />
    </p>
    <p>
      <button @click="sendToComponent1">发送到组件1</button>
    </p>
  </div>
</template>

<script lang="ts">
import { IPerson } from '@/base/Custom/CustomInterface'
import { EventType } from '@/base/Event/EventEnum'
import { Component, Vue } from 'vue-property-decorator'
import EventManager from 'electron-vue-event-manager'

@Component
export default class Component2 extends Vue {
  name = '张三'

  sendToComponent1() {
    EventManager.Instance().broadcast<IPerson>(EventType.Component2SendMessage, {
      name: this.name,
      age: 18
    })
  }
}
</script>
