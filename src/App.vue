<template>
  <!--<router-view/>-->
  <div id="app">
    <h1>Squat exercise</h1>
    <h2 class="space">Step 1. Watch Tutorial</h2>
    <!--TODO:<iframe class="border" width="640" height="360" src="https://www.youtube.com/embed/jGQ8_IMPQOY"></iframe>-->
    <h2 class="space">Step 2. Perform exercise</h2>
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
              display: none;
              ">
        </video>
        <canvas id="output"/>
      </div>
      <button @click="startLoop(true)">Start</button>
      <button @click="startLoop(false)">Stop</button>
    </div>

    <h2 class="space">Step 3. Get Feedback</h2>
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

  const factor = 200
  const videoWidth = 4 * factor
  const videoHeight = 3 * factor
  const stats = new Stats()

  const Keypoints = {
    nose: 0,
    leftEye: 1,
    rightEye: 2,
    leftEar: 3,
    rightEar: 4,
    leftShoulder: 5,
    rightShoulder: 6,
    leftElbow: 7,
    rightElbow: 8,
    leftWrist: 9,
    rightWrist: 10,
    leftHip: 11,
    rightHip: 12,
    leftKnee: 13,
    rightKnee: 14,
    leftAnkle: 15,
    rightAnkle: 16
  };

  export default {
    name: 'app',
    data() {
      return {}
    },
    components: {},
    mounted() {
      this.startLoop(false)
    },
    methods: {
      async startLoop(tracking) {
        //start camera
        const video = await this.startCamera()

        const resNetFactor = 0.5 //de helft van orginele grote (zelfde ratio)
        const resNetConfig = {
          architecture: 'ResNet50',
          outputStride: 32,
          inputResolution: {width: videoWidth * resNetFactor, height: videoHeight * resNetFactor},
          multiplier: 1,
          quantBytes: 4
        }

        const mobileNetFactor = 200 //orginele grote (zelfde ratio)
        const mobileNetConfig = {
          architecture: 'MobileNetV1',
          outputStride: 32,
          inputResolution: {width: 4 * factor, height: 3 * factor},
          multiplier: 0.5,
          quantBytes: 2
        }

        const defaultConfig = {
          architecture: 'MobileNetV1',
          outputStride: 32,
          //inputResolution: 257,
          multiplier: 0.75,
          quantBytes: 2
        }

        // Load posenet model
        const net = await posenet.load(resNetConfig);

        this.detectPoseInRealTime(video, net, tracking)
      },
      detectPoseInRealTime(video, net, tracking) {
        const canvas = document.getElementById('output');
        const ctx = canvas.getContext('2d');

        // since images are being fed from a webcam, we want to feed in the
        // original image and then just flip the keypoints' x coordinates. If instead
        // we flip the image, then correcting left-right keypoint pairs requires a
        // permutation on all the keypoints.
        const flipPoseHorizontal = true;

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        async function poseDetectionFrame(tracking) {
          // Begin monitoring code for frames per second
          stats.begin();

          let poses = [];
          let minPoseConfidence;
          let minPartConfidence;
          let pose;

          pose = await net.estimatePoses(video, {
            flipHorizontal: flipPoseHorizontal,
            decodingMethod: 'single-person'
          });
          poses = poses.concat(pose);
          minPoseConfidence = +0.1;
          minPartConfidence = +0.5;

          //show camera
          ctx.clearRect(0, 0, videoWidth, videoHeight);

          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-videoWidth, 0);
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          ctx.restore();

          // For each pose (i.e. person) detected in an image, loop through the poses
          // and draw the resulting skeleton and keypoints if over certain confidence
          // scores
          poses.forEach(({score, keypoints}) => {
            if (score >= minPoseConfidence && tracking) {

              //TODO hook to AI!
              //console.log(JSON.stringify(keypoints), minPartConfidence, ctx)

              // TODO: things to check

              // Horizontal checks
              var degrees
              var threshold = 5

              // leftHip and rightHip (horizontal)
              const leftHip = keypoints[Keypoints.leftHip].position
              const rightHip = keypoints[Keypoints.rightHip].position

              degrees = Math.atan(Math.abs(rightHip.y - leftHip.y) / Math.abs(rightHip.x - leftHip.x)) * 180 / Math.PI

              if (degrees > threshold) {
                console.log("Hips are not parallel to the floor:\nDegree of slope: " + degrees)
              }

              // leftShoulder and rightShoulder (horizontal)
              const leftShoulder = keypoints[Keypoints.leftShoulder].position
              const rightShoulder = keypoints[Keypoints.rightShoulder].position

              degrees = Math.atan(Math.abs(rightShoulder.y - leftShoulder.y) / Math.abs(rightShoulder.x - leftShoulder.x)) * 180 / Math.PI

              if (degrees > threshold) {
                console.log("Shoulders are not parallel to the floor:\nDegree of slope: " + degrees)
              }

              //TODO: implement the rest

              drawKeypoints(keypoints, minPartConfidence, ctx);
              drawSkeleton(keypoints, minPartConfidence, ctx);
            }
          });

          // End monitoring code for frames per second
          stats.end();

          requestAnimationFrame(function () {
            poseDetectionFrame(tracking)
          });
        }


        poseDetectionFrame(tracking)
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
