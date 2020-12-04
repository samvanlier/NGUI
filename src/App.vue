<template>
  <!--<router-view/>-->
  <div id="app">
    <h1>Squat exercise</h1>
    <h2 class="space">Step 1. Watch Tutorial</h2>
    <iframe class="border" width="640" height="360" src="https://www.youtube.com/embed/jGQ8_IMPQOY"></iframe>
    <h2 class="space">Step 2. Perform exercise and get feedback</h2>
    <div>
      <div id="info" style='display:none'>
      </div>
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
        <canvas id="output"/>
        <textarea id="feedback" style="margin-left: 2%" name="feedback" rows="40" cols="60" readonly></textarea>
      </div>
      <!--TODO: start en stop implementatie
      <button @click="startLoop(true)">Start</button>
      <button @click="startLoop(false)">Stop</button>-->
    </div>
    <p id="speech"></p>
  </div>
</template>

<style>
  .space {
    margin-top: 5%;
  }

  .border {
    border: black 5px solid;
  }
</style>

<script>
  import * as posenet from '@tensorflow-models/posenet'
  import {drawKeypoints, drawSkeleton} from './scripts/util'
  import Stats from 'stats.js'

  import {detectPoseInRealTime} from './scripts/poseDetection';
  import {startRecognition} from './scripts/speech';

  const factor = 200
  const videoWidth = 4 * factor
  const videoHeight = 3 * factor
  const stats = new Stats()

  //ratios voor input
  const resNetFactorH = 0.5
  const resNetFactorW = 0.5
  const mobileNetFactorW = 0.25
  const mobileNetFactorH = 0.25

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
    name: 'app',
    data() {
      return {}
    },
    components: {},
    mounted() {
      this.initRecognition();
      this.startLoop(true); // comment if testing speech (it will help)
    },
    methods: {
      initRecognition(){
        let diagnostic = document.getElementById("speech"); // for testing

        // callback function that extracts the text that we want
        let onresult = function(event){
          let i = event.results.length - 1;
          let result = event.results[i][0];

          let command = result.transcript; // the word/sentence
          let confidence = result.confidence; // the confidence of the text version of the audio

          diagnostic.textContent = 'Result recieved: ' + command + ' with confidence '+ confidence +'.'; // print shit on screen
          console.log(event);
        };
        // callback fucntion for error handling
        let onnomatch = function(error){
          diagnostic.textContent = "I didn't recognize the command";
          console.log(error);
        };

        startRecognition(onresult, onnomatch);
      },
      async startLoop(tracking) {
        //start camera
        const video = await this.startCamera()
        // Load posenet model
        const net = await posenet.load(config.resNetConfig);
        //start detection
        await this.detectPoseIRT(video, net, tracking)
      },
      async detectPoseIRT(video, net, tracking) {
        const canvas = document.getElementById('output');
        const ctx = canvas.getContext('2d');

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        await detectPoseInRealTime(video, net, ctx, videoWidth, videoHeight, stats, tracking)
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

  li {
    display: inline;
    padding: 5px;
  }
</style>
