<template>
    <div>
        <video id="video" playsinline class="feed"/>
        <canvas id="output"/>
        <button v-on:click="getEstimation">Test</button>
    </div>
</template>

<style scoped>
.feed{
    display: inline;
}
</style>

<script lang="ts">
import Vue from 'vue'
import * as ft from '@tensorflow/tfjs'
import * as posenet from '@tensorflow-models/posenet'
import dat from 'dat.gui'
import Stats from 'stats.js'
import { component } from 'vue/types/umd'

async function setupCamera (): Promise<HTMLVideoElement> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('No camera available')
  }

  const video: HTMLVideoElement = document.getElementsByTagName('video')[0]

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  })
  video.srcObject = stream

  return new Promise((resolve) => {
    video.onloadedmetadata = () => { resolve(video) }
  })
}

async function getNet (): Promise<posenet.PoseNet> {
  return await posenet.load({
    architecture: 'ResNet50',
    outputStride: 32,
    inputResolution: { width: 257, height: 200 },
    quantBytes: 2
  })
}

async function getEstimationStream (video: HTMLVideoElement, net: posenet.PoseNet): Promise<posenet.Pose[]> {
  return await net.estimatePoses(video, {
    decodingMethod: 'single-person',
    flipHorizontal: true // see https://github.com/tensorflow/tfjs-models/blob/708e3911fb01d0dfe70448acc3e8ca736fae82d3/posenet/demos/camera.js#L294
  })
}

// todo afwerken
// srcs : posenet (github)
//     : https://github.com/xunxdd/Posenet-Demo--In-My-Feelings-Challenge-AI/blob/master/src/components/Camera.vue

export default class PoseNet extends Vue {
    /**
     * Every call to this method gives an estimation of the current input frame of the video feed
     * The setting are defined as the default ResNet and single pose
     * @returns the pose estimation keypoints
     */
    async getEstimation (): Promise<posenet.Pose[]> {
        const net = await getNet()
        const video = await setupCamera()

        const estimatePoses = await getEstimationStream(video, net)
        console.log(estimatePoses)
        return estimatePoses
    }
}
</script>
