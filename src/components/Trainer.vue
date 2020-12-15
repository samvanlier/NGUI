<template>
  <div>
    <p class="space title">Perform exercise and get feedback</p>
    <p class="instructions">Your virtual trainer is listening: Say <span style="color: green">"<b>start</b>"</span>
      when you are ready to begin!</p>
    <div>
      <!--<div id="info" style='display:none'>
      </div>-->

      <!--todo: add spinner-->
      <div id="loading">
        Loading the model...
      </div>
      <div id='main' style='display:none'>
        <video id="video" playsinline style=" -moz-transform: scaleX(-1);
              -o-transform: scaleX(-1);
              -webkit-transform: scaleX(-1);
              transform: scaleX(-1);
              display: none;">
        </video>
        <div>
          <canvas id="output"/>
          <div>
            <v-btn class="success start" v-on:click="start">Start</v-btn>
            <v-btn class="error" v-on:click="turnOffTracking">Stop</v-btn>
          </div>
          <p id="feedback" class="feedback"></p>
          <p class="listening" v-if="listening">Listening...</p>
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
        listening: true,
      }
    },
    components: {Speech,PoseDetection},
    mounted() {
      this.listening = true
      console.log("inTrainer is mounted! "+ this.inTrainer)
      this.initRecognition();
      this.startLoop(); // comment if testing speech (it will help)
    },
    methods: {
      initRecognition() {
        // let diagnostic = document.getElementById("speech"); // for testing

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
        } catch (e) {
          let info = document.getElementById('info');
          info.textContent = 'this browser does not support video capture,' +
            'or this device does not have a camera';
          info.style.display = 'block';
          throw e;
        }
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main').style.display = 'block';

        this.setupFPS();
        return video
      },
    },
    onEndFunction(recognition) {
      /*TODO: we moeten alleen herstarten als we in traner zitten en niet in tutorial*/
      recognition.onend = function () {
        this.listening = false
        console.log(inTrainer)
        if (inTrainer) {
          console.log("restart recognition")
          recognition.start();
          //this.changeListening(true)
          this.listening = true
        }
      };
    },
    stopFunction(recognition){
      inTrainer = false
      recognition.stop();
    },
    changeListening(bool) {
      this.listening = bool
    },
  }
</script>

<style scoped>
  .instructions {
    font-size: 2em !important
  }

  .title {
    font-size: 4em !important
  }

  .space {
    margin-top: 2%;
    margin-bottom: 2%;
  }

  .start {
    margin-right: 2%;
  }

  .feedback {
    padding-bottom: 30px;
    font-size: 3em;
    color: #5f24ff
  }

  .listening {
    padding-bottom: 30px;
    font-size: 3em;
    color: red
  }
</style>
