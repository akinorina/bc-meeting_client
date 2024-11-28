<script setup lang="ts">
import { onMounted, ref } from 'vue'
// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ImageSegmenter, FilesetResolver, type ImageSegmenterResult } from "@mediapipe/tasks-vision";

// Get DOM elements
const video = ref<HTMLVideoElement>()
const canvasElement = ref()
const canvasCtx = ref<CanvasRenderingContext2D>();
// const outputVideo = ref<HTMLVideoElement>()
const outputMediaStream = ref<MediaStream>()

const enableWebcamButtonName = ref('ENABLE SEGMENTATION')
let webcamRunning: boolean = false;
// let runningMode: "IMAGE" | "VIDEO" = "IMAGE";

const imageSegmenter = ref<ImageSegmenter>();
// let labels: Array<string>;

// const legendColors = [
//   [0, 0, 0, 255],     // black
//   [255, 197, 0, 255], // Vivid Yellow
//   [128, 62, 117, 255], // Strong Purple
//   [255, 104, 0, 255], // Vivid Orange
//   [166, 189, 215, 255], // Very Light Blue
//   [193, 0, 32, 255], // Vivid Red
//   [206, 162, 98, 255], // Grayish Yellow
//   [129, 112, 102, 255], // Medium Gray
//   [0, 125, 52, 255], // Vivid Green
//   [246, 118, 142, 255], // Strong Purplish Pink
//   [0, 83, 138, 255], // Strong Blue
//   [255, 112, 92, 255], // Strong Yellowish Pink
//   [83, 55, 112, 255], // Strong Violet
//   [255, 142, 0, 255], // Vivid Orange Yellow
//   [179, 40, 81, 255], // Strong Purplish Red
//   [244, 200, 0, 255], // Vivid Greenish Yellow
//   [127, 24, 13, 255], // Strong Reddish Brown
//   [147, 170, 0, 255], // Vivid Yellowish Green
//   [89, 51, 21, 255], // Deep Yellowish Brown
//   [241, 58, 19, 255], // Vivid Reddish Orange
//   [35, 44, 22, 255], // Dark Olive Green
//   [0, 161, 194, 255] // Vivid Blue
// ];

const createImageSegmenter = async () => {
};
createImageSegmenter();

onMounted(async () => {
  const vision = await FilesetResolver.forVisionTasks("/node_modules/@mediapipe/tasks-vision/wasm");

  // [画像セグメンテーション]: 生成
  imageSegmenter.value = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    outputCategoryMask: true,
    outputConfidenceMasks: false
  });
  // [画像セグメンテーション]: 初期設定
  // await imageSegmenter.value.setOptions({ runningMode: "VIDEO" });
  // labels = imageSegmenter.value.getLabels();
  // console.log('labels', labels)

  // WebCam ビデオ動画
  video.value = document.createElement('video') as HTMLVideoElement
  video.value.width = 1920
  video.value.height = 1280
  // outputVideo.value = document.getElementById('output-video') as HTMLVideoElement

  // Canvas
  canvasElement.value = document.createElement('canvas') as HTMLCanvasElement
  canvasElement.value.width = 1920
  canvasElement.value.height = 1280
  canvasCtx.value = canvasElement.value.getContext('2d') as CanvasRenderingContext2D

  // Canvas => MediaStream
  outputMediaStream.value = canvasElement.value.captureStream(30)
})

// Get segmentation from the webcam
let lastWebcamTime = -1;
async function predictWebcam() {
  if (!video.value || !canvasCtx.value) return

  if (video.value.currentTime === lastWebcamTime) {
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
    return;
  }
  lastWebcamTime = video.value.currentTime;

  // Video映像 => Canvas 描画
  canvasCtx.value.drawImage(video.value, 0, 0, video.value.videoWidth, video.value.videoHeight);

  // Do not segmented if imageSegmenter hasn't loaded
  if (imageSegmenter.value === undefined) {
    return;
  }

  let startTimeMs = performance.now();

  // [画像セグメンテーション]: 開始
  // Start segmenting the stream.
  imageSegmenter.value.segmentForVideo(video.value, startTimeMs, callbackForVideo);
}

function callbackForVideo(result: ImageSegmenterResult) {
  if (!video.value || !canvasCtx.value || !result.categoryMask) return

  // Canvas 画像 => imageData
  let imageData = canvasCtx.value.getImageData(0, 0, video.value.videoWidth, video.value.videoHeight).data;

  // [画像セグメンテーション]: 判定結果 => imageData 加工 => dataNew
  const mask = result.categoryMask.getAsFloat32Array()
  let j = 0;
  // let before = 0;
  for (let i = 0; i < mask.length; ++i) {
    const maskVal = Math.round(mask[i] * 255.0);
    // if (maskVal !== before) {
    //   // console.log('maskVal', i, maskVal, imageData[j], imageData[j + 1], imageData[j + 2], imageData[j + 3])
    //   before = maskVal
    // }
    // const legendColor = legendColors[maskVal % legendColors.length];
    // imageData[j] = (legendColor[0] + imageData[j]) / 2;
    // imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
    // imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
    // imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;

    if (maskVal === 0) {
      imageData[j + 3] = 0;
    }
    j += 4;
  }
  const uint8Array = new Uint8ClampedArray(imageData.buffer);
  const dataNew = new ImageData(uint8Array, video.value.videoWidth, video.value.videoHeight);

  // imageData 加工 => Canvas画像
  canvasCtx.value.putImageData(dataNew, 0, 0);

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// Enable the live webcam view and start imageSegmentation.
async function enableCam() {
  if (!hasGetUserMedia()) {
    console.warn("getUserMedia() is not supported by your browser");
    return
  }

  if (imageSegmenter.value === undefined || !video.value) {
    return
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButtonName.value = "ENABLE SEGMENTATION";
    // ENABLE WEBCAM
  } else {
    webcamRunning = true;
    enableWebcamButtonName.value = "DISABLE SEGMENTATION";
  }

  // getUsermedia parameters.
  const constraints = {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    }
  };

  // Activate the webcam stream.
  video.value.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
  video.value.play()
  video.value.addEventListener("loadeddata", predictWebcam);
}

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

</script>

<template>
  <div class="container mx-auto">
    <section id="demos" class="">
      <div class="webcam">
        <button id="webcamButton" class="mdc-button mdc-button--raised" @click="enableCam">
          <span class="mdc-button__label">{{ enableWebcamButtonName }}</span>
        </button>

        <video id="output-video" :srcObject.prop="outputMediaStream" autoplay muted playsinline></video>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
/* Copyright 2023 The MediaPipe Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

// @use "@material";

body {
  font-family: roboto;
  margin: 2em;
  color: #3d3d3d;
  --mdc-theme-primary: #007f8b;
  --mdc-theme-on-primary: #f1f3f4;
}

h1 {
  color: #007f8b;
}

h2 {
  clear: both;
}

em {
  font-weight: bold;
}

video {
  clear: both;
  display: block;
}
canvas {
  clear: both;
  display: block;
}

section {
  opacity: 1;
  transition: opacity 500ms ease-in-out;
}

.removed {
  display: none;
}

.invisible {
  opacity: 0.2;
}

.videoView,
.segmentOnClick {
  position: relative;
  float: left;
  width: 48%;
  margin: 2% 1%;
  cursor: pointer;
}

.segmentOnClick p {
  padding: 5px;
  background-color: #007f8b;
  color: #fff;
  z-index: 2;
  font-size: 12px;
  margin: 0;
}


.segmentOnClick {
  z-index: 0;
}

.segmentOnClick canvas {
  position: absolute;
  top: 0px;
  bottom: 0px;
  width: 100%;
}

.segmentOnClick img {
  width: 100%;
}
</style>
