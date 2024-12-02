<script setup lang="ts">
import { ref } from 'vue'
import { useWebrtcStore } from '../stores/webrtc';
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue';
import InputText from '@/components/ui/InputText.vue';

const webrtcStore = useWebrtcStore()
const messageText = ref('')

// Text-chat: メッセージ送信
// const sendText = () => {
// }

const submitChat = () => {
  // send text
  webrtcStore.sendDataAll(messageText.value)

  // clear text.
  messageText.value = ''

  console.log('webrtcStore.peerMedias', webrtcStore.peerMedias)
}
</script>

<template>
  <div class="chat h-full w-full">
    <div class="text-center font-bold h-8">Chat</div>
    <!-- <div class="my-2 ms-2 font-bold">チャット</div> -->
    <div class="chat__content overflow-y-auto">
      <div v-for="(item, idx) in webrtcStore.dataConnData" :key="idx">
        <div class="flex" :class="{ 'justify-end': item.senderPeerId === webrtcStore.myPeerId }">
          <div class="max-w-64 p-0 m-2">
            <div class="p-1 bg-blue-200 text-xs">
              {{ webrtcStore.getDisplayName(item.senderPeerId) }}
            </div>
            <div class="p-2 bg-slate-50">
              {{ item.message }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat__input">
      <form @submit.prevent="submitChat">
        <InputText class="w-48 py-2 m-0" v-model="messageText" />
        <ButtonGeneralPrimary type="submit" class="w-18 py-2 m-0 text-sm">
          送信
        </ButtonGeneralPrimary>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.chat {
  width: 100%;
  height: calc(100% - 10px);
  // border: 2px red dashed;

  &__content {
    width: 100%;
    height: calc(100% - 32px - 64px);
    background-color: #e0e0e0;
    // border: 1px red dashed;
  }
  &__input {
    width: 100%;
    height: 64px;
    padding: 10px;
  }
}

</style>
