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
    <div class="my-2 ms-2 font-bold">チャット</div>
    <div class="chat__content h-full overflow-y-auto">
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
    <div class="chat__input py-3">
      <form @submit.prevent="submitChat">
        <InputText class="w-64 p-2" v-model="messageText" />
        <ButtonGeneralPrimary type="submit" class="w-16">
          送信
        </ButtonGeneralPrimary>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.chat {
  width: calc(100% - 0px);
  height: 100%;
  padding: 10px;
  margin: 0 auto;
  background-color: #fafafa;

  &__content {
    width: 100%;
    height: calc(100% - 100px);
    background-color: #e0e0e0;
  }
  &__input {
    width: 100%;
    height: 65px
  }
}

</style>
