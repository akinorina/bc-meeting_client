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

// import { ImageSegmenter, SegmentationMask, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";
import { ImageSegmenter, FilesetResolver, type ImageSegmenterResult } from "@mediapipe/tasks-vision";

// // Get DOM elements
const video = ref<HTMLVideoElement>()
const canvasElement = ref()
const canvasCtx = ref<CanvasRenderingContext2D>();
const enableWebcamButton = ref<HTMLButtonElement>()

onMounted(() => {
  video.value = document.getElementById("webcam") as HTMLVideoElement
  canvasElement.value = document.getElementById('canvas') as HTMLCanvasElement
  console.log('--- canvasElement.value', canvasElement.value)
  canvasCtx.value = canvasElement.value.getContext('2d') as CanvasRenderingContext2D
})

// const webcamPredictions = document.getElementById("webcamPredictions");
// const demosSection = ref<HTMLElement>(document.getElementById("demos") as HTMLElement);
const enableWebcamButtonName = ref('ENABLE SEGMENTATION')
let webcamRunning: boolean = false;
// const videoHeight: string = "360px";
// const videoWidth: string = "480px";
let runningMode: "IMAGE" | "VIDEO" = "IMAGE";
// const resultWidthHeigth = 256;

let imageSegmenter: ImageSegmenter;
// let labels: Array<string>;

const legendColors = [
  [255, 197, 0, 255], // Vivid Yellow
  [128, 62, 117, 255], // Strong Purple
  [255, 104, 0, 255], // Vivid Orange
  [166, 189, 215, 255], // Very Light Blue
  [193, 0, 32, 255], // Vivid Red
  [206, 162, 98, 255], // Grayish Yellow
  [129, 112, 102, 255], // Medium Gray
  [0, 125, 52, 255], // Vivid Green
  [246, 118, 142, 255], // Strong Purplish Pink
  [0, 83, 138, 255], // Strong Blue
  [255, 112, 92, 255], // Strong Yellowish Pink
  [83, 55, 112, 255], // Strong Violet
  [255, 142, 0, 255], // Vivid Orange Yellow
  [179, 40, 81, 255], // Strong Purplish Red
  [244, 200, 0, 255], // Vivid Greenish Yellow
  [127, 24, 13, 255], // Strong Reddish Brown
  [147, 170, 0, 255], // Vivid Yellowish Green
  [89, 51, 21, 255], // Deep Yellowish Brown
  [241, 58, 19, 255], // Vivid Reddish Orange
  [35, 44, 22, 255], // Dark Olive Green
  [0, 161, 194, 255] // Vivid Blue
];

const createImageSegmenter = async () => {
  const audio = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );

  imageSegmenter = await ImageSegmenter.createFromOptions(audio, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
      delegate: "GPU"
    },
    runningMode: runningMode,
    outputCategoryMask: true,
    outputConfidenceMasks: false
  });
  // labels = imageSegmenter.getLabels();
  // demosSection.value.classList.remove("invisible");
};
createImageSegmenter();

// const imageContainers: HTMLCollectionOf<Element> = document.getElementsByClassName(
//   "segmentOnClick"
// );

// // Add click event listeners for the img elements.
// for (let i = 0; i < imageContainers.length; i++) {
//   imageContainers[i]
//     .getElementsByTagName("img")[0]
//     .addEventListener("click", handleClick);
// }

// /**
//  * Demo 1: Segmented images on click and display results.
//  */
// let canvasClick: HTMLCanvasElement;
// async function handleClick(event) {
//   // Do not segmented if imageSegmenter hasn't loaded
//   if (imageSegmenter === undefined) {
//     return;
//   }
//   canvasClick = event.target.parentElement.getElementsByTagName("canvas")[0];
//   canvasClick.classList.remove("removed");
//   canvasClick.width = event.target.naturalWidth;
//   canvasClick.height = event.target.naturalHeight;
//   const cxt = canvasClick.getContext("2d");
//   cxt.clearRect(0, 0, canvasClick.width, canvasClick.height);
//   cxt.drawImage(event.target, 0, 0, canvasClick.width, canvasClick.height);
//   event.target.style.opacity = 0;
//   // if VIDEO mode is initialized, set runningMode to IMAGE
//   if (runningMode === "VIDEO") {
//     runningMode = "IMAGE";
//     await imageSegmenter.setOptions({
//       runningMode: runningMode
//     });
//   }

//   // imageSegmenter.segment() when resolved will call the callback function.
//   imageSegmenter.segment(event.target, callback);
// }

// function callback(result: ImageSegmenterResult) {
//   const cxt = canvasClick.getContext("2d");
//   const { width, height } = result.categoryMask;
//   let imageData = cxt.getImageData(0, 0, width, height).data;
//   canvasClick.width = width;
//   canvasClick.height = height;
//   let category: String = "";
//   const mask: Number[] = result.categoryMask.getAsUint8Array();
//   for (let i in mask) {
//     if (mask[i] > 0) {
//       category = labels[mask[i]];
//     }
//     const legendColor = legendColors[mask[i] % legendColors.length];
//     imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
//     imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
//     imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
//     imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
//   }
//   const uint8Array = new Uint8ClampedArray(imageData.buffer);
//   const dataNew = new ImageData(uint8Array, width, height);
//   cxt.putImageData(dataNew, 0, 0);
//   const p: HTMLElement = event.target.parentNode.getElementsByClassName(
//     "classification"
//   )[0];
//   p.classList.remove("removed");
//   p.innerText = "Category: " + category;
// }

function callbackForVideo(result: ImageSegmenterResult) {
  if (!video.value || !canvasCtx.value || !result.categoryMask) return

  let imageData = canvasCtx.value.getImageData(0, 0, video.value.videoWidth, video.value.videoHeight).data;
  const mask = result.categoryMask.getAsFloat32Array()
  let j = 0;
  for (let i = 0; i < mask.length; ++i) {
    const maskVal = Math.round(mask[i] * 255.0);
    // console.log('--- maskVal', maskVal)
    const legendColor = legendColors[maskVal % legendColors.length];
    imageData[j] = (legendColor[0] + imageData[j]) / 2;
    imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
    imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
    imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;
    j += 4;
  }
  const uint8Array = new Uint8ClampedArray(imageData.buffer);
  const dataNew = new ImageData(
    uint8Array,
    video.value.videoWidth,
    video.value.videoHeight
  );
  canvasCtx.value.putImageData(dataNew, 0, 0);
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// /********************************************************************
// // Demo 2: Continuously grab image from webcam stream and segmented it.
// ********************************************************************/

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

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
  canvasCtx.value.drawImage(video.value, 0, 0, video.value.videoWidth, video.value.videoHeight);
  // Do not segmented if imageSegmenter hasn't loaded
  if (imageSegmenter === undefined) {
    return;
  }
  // if image mode is initialized, create a new segmented with video runningMode
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await imageSegmenter.setOptions({ runningMode: runningMode });
  }
  let startTimeMs = performance.now();

  // Start segmenting the stream.
  imageSegmenter.segmentForVideo(video.value, startTimeMs, callbackForVideo);
}

// Enable the live webcam view and start imageSegmentation.
async function enableCam() {
  if (imageSegmenter === undefined || !video.value) {
    return;
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
    video: true
  };

  // Activate the webcam stream.
  video.value.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
  video.value.addEventListener("loadeddata", predictWebcam);
}

// If webcam supported, add event listener to button.
if (hasGetUserMedia()) {
  enableWebcamButton.value = document.getElementById("webcamButton") as HTMLButtonElement;
  // enableWebcamButton.value.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

</script>

<template>
  <div class="container mx-auto">
    <!-- Copyright 2023 The MediaPipe Authors.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License. -->

    <!--
    <link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet">
    <script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"></script>
    -->

    <h1>Segmenting images using the MediaPipe Image Segmentation Task</h1>

    <section id="demos" class="">
      <h2>Demo: Segmenting Images</h2>
      <p><b>Click on an image below</b> to see its Segmentation.</p>
      <div class="segmentOnClick">
        <canvas class="removed"></canvas>
        <img src="https://assets.codepen.io/9177687/dog_flickr_publicdomain.jpeg" crossorigin="anonymous" title="Click to get segmentation!" />
            <p class="classification removed"></p>
      </div>
      <div class="segmentOnClick">
        <canvas class="removed"></canvas>
        <img src="https://assets.codepen.io/9177687/cat_flickr_publicdomain.jpeg" crossorigin="anonymous" title="Click to get segmentation!" />
            <p class="classification removed"></p>
      </div>

      <h2>Demo: Webcam continuous segmentation</h2>
      <p>Hold some objects up close to your webcam to get real-time segmentation.<br />Click <b>enable webcam</b> below and grant access to the webcam if prompted.</p>

      <div class="webcam">
        <button id="webcamButton" class="mdc-button mdc-button--raised" @click="enableCam">
          <span class="mdc-button__ripple"></span>
          <span class="mdc-button__label">{{ enableWebcamButtonName }}</span>
        </button>
        <video id="webcam" autoplay style="display: none;"></video>
        <canvas id="canvas" width="1280px" height="720px"></canvas>
        Yeah!
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
