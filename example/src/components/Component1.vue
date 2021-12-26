<template>
  <div class="component">
    <h1>组件1</h1>
    <div>
      <p>组件2发来的内容：</p>
      <p v-show="name !== ''">
        姓名：{{ name }}
        年龄：{{ age }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { IPerson } from '@/base/Custom/CustomInterface'
import { EventType } from '@/base/Event/EventEnum'
import { Component, Vue } from 'vue-property-decorator'
import EventManager from 'electron-vue-event-manager'

@Component
export default class Component1 extends Vue {

  name = ''
  age = 0

  created() {
    EventManager.Instance().addEventListener<IPerson>(EventType.Component2SendMessage, (person) => {
      this.name = person.name
      this.age = person.age
    })
  }
}
</script>
