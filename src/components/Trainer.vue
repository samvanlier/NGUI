<template>
  <div>
    <p class="space" style="font-size: 4em">Perform exercise and get feedback</p>
    <div>
      <v-progress-circular class="loader" v-if="loading && !error" indeterminate color="teal"
                           :size="100"></v-progress-circular>
      <p class="red" v-if="error">This browser does not support video capture, or this device does not have a camera</p>
      <div v-show="!loading && !error">
        <p class="instructions">Your virtual trainer is listening: Say <span style="color: green">"<b>start</b>"</span>
          when you are ready to begin!</p>
        <v-icon id="icon-red" style="display: none" color="red" :size="50">mdi-microphone</v-icon>
        <v-icon id="icon-black" color="black" :size="50">mdi-microphone</v-icon>
        <video id="video" class="video" playsinline></video>
        <div>
          <canvas id="output"></canvas>
          <div>
            <v-btn class="success start" v-on:click="start">Start</v-btn>
            <v-btn class="error" v-on:click="turnOffTracking">Stop</v-btn>
          </div>
          <p id="feedback" class="feedback"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import * as posenet from '@tensorflow-models/posenet'
  import Stats from 'stats.js'
  import Speech from "./shared/Speech";
  import PoseDetection from "./shared/PoseDetection";

  const factor = 200
  const videoWidth = 4 * factor
  const videoHeight = 3 * factor
  const stats = new Stats()

  //ratios voor input
  const resNetFactorH = 0.5
  const resNetFactorW = 0.5
  const mobileNetFactorW = 0.25
  const mobileNetFactorH = 0.25

  let inTrainer = true
  let listening = false

  const config = {
    resNetConfig: {
      architecture: 'ResNet50',
      outputStride: 32, //can be 8, 16, 32
      inputResolution: {width: videoWidth * resNetFactorH, height: videoHeight * resNetFactorW / 2.0},
      multiplier: 1,
      quantBytes: 4
    },
    mobileNetConfig: {
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: {width: videoWidth * mobileNetFactorW, height: videoHeight * mobileNetFactorH},
      multiplier: 1,
      quantBytes: 4
    },
    defaultConfig: {
      architecture: 'MobileNetV1',
      outputStride: 32,
      //inputResolution: 257,
      multiplier: 0.75,
      quantBytes: 2
    }
  }

  export default {
    name: 'Trainer',
    data() {
      return {
        loading: true,
        error: false
      }
    },
    components: {Speech},
    mounted() {
      this.error = false
      this.initRecognition();
      this.startLoop(); // comment if testing speech (it will help)
    },
    methods: {
      initRecognition() {
        // callback function that extracts the text that we want
        let onresult = function (event) {
          let i = event.results.length - 1;
          let result = event.results[i][0];

          let command = result.transcript; // the word/sentence
          let confidence = result.confidence; // the confidence of the text version of the audio
          let commandNoWS = command.replace(/\s+/g, '');

          console.log(command)

          if (commandNoWS.includes("start")) {
            PoseDetection.changeDetection(true)
          }

          if (commandNoWS.includes("stop")) {
            PoseDetection.changeDetection(false)
          }
        };
        Speech.startRecognition(onresult, true);
      },
      turnOffTracking: function () {
        PoseDetection.changeDetection(false)
      },
      start: function () {
        PoseDetection.changeDetection(true)
      },
      async startLoop() {
        //start camera
        const video = await this.startCamera()
        // Load posenet model
        const net = await posenet.load(config.resNetConfig);

        this.loading = false

        //start detection
        await this.detectPoseIRT(video, net)
      },
      async detectPoseIRT(video, net) {
        const canvas = document.getElementById('output');
        const ctx = canvas.getContext('2d');

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        await PoseDetection.detectPoseInRealTime(video, net, ctx, videoWidth, videoHeight, stats)
      },
      async setupCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
        }

        const video = document.getElementById('video');

        video.width = videoWidth;
        video.height = videoHeight;

        const stream = await navigator.mediaDevices.getUserMedia({
          'audio': false,
          'video': {
            facingMode: 'user',
            width: videoWidth,
            height: videoHeight,
          }
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
          video.onloadedmetadata = () => {
            resolve(video);
          };
        });
      },
      /**
       * Sets up a frames per second panel on the top-left of the window
       */
      setupFPS() {
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);
      },
      async loadVideo() {
        const video = await this.setupCamera();
        video.play();
        return video;
      },
      async startCamera() {
        let video;
        try {
          video = await this.loadVideo();
          this.error = false
        } catch (e) {
          console.error(e)
          this.error = true
          throw e;
        }
        this.setupFPS();
        return video
      },
    },
    listening(bool) {
      let icon_black = document.getElementById('icon-black')
      let icon_red = document.getElementById('icon-red')

      if (bool){
        icon_black.style.display = "none"
        icon_red.style.display = "block"
      }else{
        icon_black.style.display = "block"
        icon_red.style.display = "none"
      }
    },
    onEndFunction(recognition) {
      recognition.onend = function () {
        if (inTrainer) {
          console.log("restart recognition")
          recognition.start();
        }
      };
    },
    stopFunction(recognition) {
      inTrainer = false
      recognition.stop();
    },
  }
</script>

<style scoped>
  .instructions {
    font-size: 2em !important;
  }

  .space {
    margin-top: 1%;
    margin-bottom: 1%;
  }

  .start {
    margin-right: 2%;
  }

  .feedback {
    padding-bottom: 30px;
    font-size: 3em;
    color: #5f24ff;
  }

  .loader {
    margin-top: 15%;
  }

  /* .listening {
     position: absolute !important;
     font-size: 1.5em !important;
     color: red !important;
     z-index: 1 !important;
     left: 1320px !important;
     top: 205px !important;
   }*/

  .video {
    -moz-transform: scaleX(-1);
    -o-transform: scaleX(-1);
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
    display: none;
  }
</style>
