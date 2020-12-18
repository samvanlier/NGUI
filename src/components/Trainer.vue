<template>
  <div>
    <p class="space" style="font-size: 3em">Perform exercise and get feedback</p>
    <div>
      <v-progress-circular class="loader" v-if="loading && !error" indeterminate color="teal" :size="100"></v-progress-circular>
      <p class="red" v-if="error">This browser does not support video capture, or this device does not have a camera</p>
      <div v-show="!loading && !error">
        <p class="instructions">Your virtual trainer is listening: Say <span style="color: green">"<b>start</b>"</span>
          when you are ready to begin!</p>
        <video id="video" class="video" playsinline></video>
        <div>
          <canvas id="output"></canvas>
          <div>
            <v-btn class="success start" v-on:click="startTracking">Start</v-btn>
            <v-icon id="icon-red" class="start" style="display: none" color="red" :size="40">mdi-microphone</v-icon>
            <v-icon id="icon-black" class="start" color="black" :size="40">mdi-microphone</v-icon>
            <v-btn class="error" v-on:click="stopTracking">Stop</v-btn>
          </div>
          <p id="feedback" class="feedback"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import * as posenet from '@tensorflow-models/posenet'
  import Speech from "./shared/Speech";
  import PoseDetection from "./shared/PoseDetection";

  const factor = 200;
  const videoWidth = 4 * factor;
  const videoHeight = 3 * factor;

  //ratios voor input
  const resNetFactorH = 0.5;
  const resNetFactorW = 0.5;
  const mobileNetFactorW = 0.25;
  const mobileNetFactorH = 0.25;

  // variable that stated we are in the trainer tab
  let inTrainer = true;

  // different pose net config models
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
  };

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
      this.error = false;
      // initial speech recognition function
      this.initRecognition();
      // start our pose detection loop
      this.startLoop();
    },
    methods: {
      initRecognition() {
        // callback function that analysis the user's speech (input)
        let onresult = function (event) {
          let index = event.results.length - 1;
          let result = event.results[index][0];

          let command = result.transcript; // the word/sentence
          let commandNoWhitespace = command.replace(/\s+/g, '');

          // if sentence contains the start command
          if (commandNoWhitespace.includes("start")) {
            PoseDetection.changeDetection(true)
          }

          // if sentence contains the stop command
          if (commandNoWhitespace.includes("stop")) {
            document.getElementById('feedback').innerHTML = "";
            PoseDetection.changeDetection(false)
          }
        };

        // start speech recognition
        Speech.startRecognition(onresult, true);
      },
      // stops heuristic checks + visual and auditory feedback
      stopTracking: function () {
        document.getElementById('feedback').innerHTML = "";
        PoseDetection.changeDetection(false)
      },
      startTracking: function () {
        PoseDetection.changeDetection(true)
      },
      async startLoop() {
        //start camera
        const video = await this.startCamera();

        // Load posenet model
        const net = await posenet.load(config.resNetConfig);

        this.loading = false;

        const canvas = document.getElementById('output');
        const ctx = canvas.getContext('2d');

        // canvas size
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        //start pose estimation detection in real time
        await PoseDetection.detectPoseInRealTime(video, net, ctx, videoWidth, videoHeight)
      },
      async setupCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
        }

        const video = document.getElementById('video');

        //video size
        video.width = videoWidth;
        video.height = videoHeight;

        video.srcObject = await navigator.mediaDevices.getUserMedia({
          'audio': false,
          'video': {
            facingMode: 'user'
          }
        });
        return new Promise((resolve) => {
          video.onloadedmetadata = () => {
            resolve(video);
          };
        });
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
          console.error(e);
          this.error = true;
          throw e;
        }
        return video
      },
    },
    listening(bool) {
      let icon_black = document.getElementById('icon-black');
      let icon_red = document.getElementById('icon-red');

      if (bool) {
        icon_black.style.display = "none";
        icon_red.style.display = "inline"
      } else {
        icon_black.style.display = "inline";
        icon_red.style.display = "none"
      }
    },
    onEndFunction(recognition) {
      recognition.onend = function () {
        if (inTrainer) {
          recognition.start();
        }
      };
    },
    stopFunction(recognition) {
      inTrainer = false;
      recognition.stop();
    },
  }
</script>

<style scoped>
  .instructions {
    font-size: 1.5em !important;
  }

  .space {
    margin-top: 1%;
  }

  .start {
    margin-right: 2%;
  }

  .feedback {
    padding-bottom: 30px;
    font-size: 2em;
    color: #5f24ff;
  }

  .loader {
    margin-top: 15%;
  }

  .video {
    -moz-transform: scaleX(-1);
    -o-transform: scaleX(-1);
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
    display: none;
  }
</style>
