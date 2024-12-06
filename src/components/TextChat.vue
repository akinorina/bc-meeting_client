<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useWebrtcStore } from '../stores/webrtc'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import InputText from '@/components/ui/InputText.vue'
import ButtonGeneralSecondary from './ui/ButtonGeneralSecondary.vue';

const webrtcStore = useWebrtcStore()
const messageText = ref('')

watch(webrtcStore.dataConnData, async () => {
  await showNewestLine()
})

onMounted(async () => {
  await showNewestLine()
})

const submitChat = () => {
  // send text
  webrtcStore.sendDataAll(messageText.value)

  // clear text.
  messageText.value = ''
}

const showNewestLine = async () => {
  await nextTick()
  const obj = document.getElementById('chatBase') as HTMLElement
  obj.scrollTop = obj.scrollHeight
}
</script>

<template>
  <div class="chat">
    <div class="m-0 p-3 font-bold">チャット</div>
    <div class="chat__content" id="chatBase">
      <div v-for="(item, idx) in webrtcStore.dataConnData" :key="idx">
        <div class="flex" :class="{ 'justify-end': item.senderPeerId === webrtcStore.myPeerId }">
          <div class="m-2 max-w-64 p-0">
            <div class="bg-blue-200 p-1 text-xs">
              {{ webrtcStore.getDisplayName(item.senderPeerId) }}
            </div>
            <div class="bg-slate-50 p-2">
              {{ item.message }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat__input">
        <form @submit.prevent="submitChat">
          <div class="w-full">
            <InputText class="input-text m-0 py-2" v-model="messageText" />
            <ButtonGeneralPrimary type="submit" class="btn-text m-0 py-2 text-sm">
              送信
            </ButtonGeneralPrimary>
          </div>
        </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat {
  width: 100%;
  height: 100%;

  &__content {
    width: 100%;
    height: calc(100% - 50px - 65px);
    overflow-y: auto;
    background-color: #c0c0c0;
  }
  &__input {
    width: 100%;
    height: 65px;
    padding: 10px;

    .input-text {
      width: calc(100% - 72px);
    }
    .btn-text {
      width: 64px;
    }
  }
}
</style>
