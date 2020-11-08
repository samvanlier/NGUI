<template>
  <!--<router-view/>-->
  <div id="app">
    <h2 class="center">Virtual Trainer</h2>
    <div>
      <vue-web-cam v-bind:deviceId="deviceId" width="640" height="480"/>
    </div>
    <div>
      <button id="snap" v-on:click="getEstimation()">Test</button>
    </div>
    <canvas ref="canvas" id="canvas" width="640" height="480"></canvas>
  </div>
</template>

<script>
  import * as posenet from '@tensorflow-models/posenet'
  import {WebCam} from 'vue-web-cam'

  export default {
  name: 'app',
  data () {
    return {
      deviceId: null
    }
  },
  components: {
    'vue-web-cam': WebCam
  },
  mounted () {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      for (let i = 0; i < devices.length; i++) {
        if (devices[i].kind === 'videoinput') {
          this.deviceId = devices[i].deviceId
        }
      }
    })

    // zien wat hiermee te doen!
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        console.log(stream)
      })
    }
  },
  methods: {
    async getEstimation () {
      const net = await this.getNet()
      const video = await this.setupCamera()

      const estimatePoses = await this.getEstimationStream(video, net)
      console.log(estimatePoses)
      return estimatePoses
    },
    async setupCamera () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('No camera available')
      }

      const video = document.getElementsByTagName('video')[0]

      video.srcObject = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
      })

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve(video)
        }
      })
    },
    async getNet () {
      return await posenet.load({
        architecture: 'ResNet50',
        outputStride: 32,
        inputResolution: { width: 257, height: 200 },
        quantBytes: 2
      })
    },
    async getEstimationStream (video, net) {
      return await net.estimatePoses(video, {
        decodingMethod: 'single-person',
        flipHorizontal: true // see https://github.com/tensorflow/tfjs-models/blob/708e3911fb01d0dfe70448acc3e8ca736fae82d3/posenet/demos/camera.js#L294
      })
    }
  }
}
</script>

<style>
  body {
    background-color: #F0F0F0;
  }

  #app {
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }

  #video {
    background-color: #000000;
  }

  #canvas {
    display: none;
  }

  li {
    display: inline;
    padding: 5px;
  }
</style>
