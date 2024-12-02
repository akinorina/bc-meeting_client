<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useWebrtcStore } from '../stores/webrtc'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import InputText from '@/components/ui/InputText.vue'

const webrtcStore = useWebrtcStore()
const messageText = ref('')

watch(webrtcStore.dataConnData, async () => {
  await nextTick()
  const obj = document.getElementById('chatBase') as HTMLElement
  obj.scrollTop = obj.scrollHeight
})

const submitChat = () => {
  // send text
  webrtcStore.sendDataAll(messageText.value)

  // clear text.
  messageText.value = ''
}
</script>

<template>
  <div class="chat h-full w-full">
    <div class="h-8 text-center font-bold">チャット</div>
    <div class="chat__content overflow-y-auto" id="chatBase">
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
  height: calc(100% - 10px);

  &__content {
    width: 100%;
    height: calc(100% - 32px - 64px);
    background-color: #e0e0e0;
  }
  &__input {
    width: 100%;
    height: 64px;
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
