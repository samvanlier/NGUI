<template>
  <!--<router-view/>-->
  <div id="app">
    <h1>Squat exercise</h1>
    <h2 class="space">Step 1. Watch Tutorial</h2>
    <iframe class="border" width="640" height="360" src="https://www.youtube.com/embed/jGQ8_IMPQOY"></iframe>
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
              display: none;">
        </video>
        <canvas id="output"/>
      </div>
      <!--TODO: start en stop implementatie
      <button @click="startLoop(true)">Start</button>
      <button @click="startLoop(false)">Stop</button>-->
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
      this.startLoop(true)
    },
    methods: {
      async startLoop(tracking) {
        //start camera
        const video = await this.startCamera()

        // Load posenet model
        const net = await posenet.load(config.resNetConfig);
        //start detection
        await this.detectPoseInRealTime(video, net, tracking)
      },
      async detectPoseInRealTime(video, net, tracking) {
        const canvas = document.getElementById('output');
        const ctx = canvas.getContext('2d');

        //TODO: use stats for this? (easy fast method for now)
        let frames = 0;

        //per numberOfFrames we check if a given percentage is in a wrong position
        //if this is the case we print feedback and reset
        const numberOfFrames = 100;
        const percentage = 25/100
        const nrOfOccurances = numberOfFrames * percentage

        //checks occurances
        var horizontalPose1 = 0;
        var horizontalPose2 = 0;
        var neutralPosition1 = 0;
        var neutralPosition2 = 0;
        var kneeAnkleAlignment1 = 0;
        var kneeAnkleAlignment2 = 0;
        var hipHeightToLow = 0;

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
          frames++;

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

              function checkHeuristics(keypoints) {

                //horizontal straight pose
                function horizontalPose(leftShoulder, rightShoulder, leftHip, rightHip) {
                  // leftHip and rightHip (horizontal)
                  function horizontalHips() {
                    const angle = Math.atan((rightHip.y - leftHip.y) / (rightHip.x - leftHip.x)) * 180 / Math.PI
                    const threshold = 5

                    if (Math.abs(angle) > threshold) {
                      horizontalPose1++
                    }
                  }

                  // leftShoulder and rightShoulder (horizontal)
                  function horizontalShoulders() {
                    const angle = Math.atan((rightShoulder.y - leftShoulder.y) / (rightShoulder.x - leftShoulder.x)) * 180 / Math.PI
                    const threshold = 5

                    if (Math.abs(angle) > threshold) {
                      horizontalPose2++
                    }
                  }

                  horizontalHips()
                  horizontalShoulders()
                }

                //feet shoulder width apart
                function neutralPosition(leftShoulder, rightShoulder, leftAnkle, rightAnkle) {
                  // leftShoulder and leftAnkle (vertical - angle of 95-85)
                  function leftSide() {
                    const angle = Math.atan((leftAnkle.y - leftShoulder.y) / (leftAnkle.x - leftShoulder.x)) * 180 / Math.PI

                    if (Math.abs(angle) > 90 || Math.abs(angle) < 88) {
                      neutralPosition1++
                    }
                  }

                  // rightShoulder and rightFoot (vertical - angle of 95-85)
                  function rightSide() {
                    const angle = Math.atan((rightShoulder.y - rightAnkle.y) / (rightShoulder.x - rightAnkle.x)) * 180 / Math.PI

                    if (angle < 0 && angle > -88) {
                      neutralPosition2++
                    }
                  }

                  leftSide()
                  rightSide()
                }

                //between -87 and 87?
                function kneeAnkleAlignment(leftKnee, rightKnee, leftAnkle, rightAnkle) {
                  // leftKnee and leftAnkle (vertical)
                  function leftSide() {
                    const angle = Math.atan((leftAnkle.y - leftKnee.y) / (leftAnkle.x - leftKnee.x)) * 180 / Math.PI

                    if (angle < 0 && angle > -87 || angle > 0 && angle < 87) {
                      kneeAnkleAlignment1++
                      //console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++: " + angle)
                    }
                  }

                  // rightKnee and rightFoot (vertical)
                  function rightSide() {
                    const angle = Math.atan((rightKnee.y - rightAnkle.y) / (rightKnee.x - rightAnkle.x)) * 180 / Math.PI

                    if (angle < 0 && angle > -87 || angle > 0 && angle < 87) {
                      kneeAnkleAlignment2++
                      //console.log("++++: " + angle)
                    }
                  }

                  leftSide()
                  rightSide()
                }

                //checks if squat is too low
                function hipHeight(leftKnee, rightKnee,leftHip, rightHip){
                  const hipX = (leftHip.x + rightHip.x) / 2
                  const hipY = (leftHip.y + rightHip.y) / 2
                  const kneeX = (leftKnee.x + rightKnee.x) / 2
                  const kneeY = (leftKnee.y + rightKnee.y) / 2

                  const distance = Math.sqrt(Math.pow(kneeX - hipX,2) + Math.pow(kneeY - hipY,2))
                  if (distance < 20){
                    //console.log("TEST HIP TO LOW: "+distance)
                    hipHeightToLow++
                  }
                }

                function checkErrors() {
                  if (horizontalPose1 === nrOfOccurances) {
                    console.log("Hips are not parallel to the floor:")
                    horizontalPose1 = 0
                  }

                  if (horizontalPose2 === nrOfOccurances) {
                    console.log("Shoulders are not parallel to the floor")
                    horizontalPose2 = 0
                  }

                  if (neutralPosition1 === nrOfOccurances) {
                    console.log("Left ankle not in the correct position:")
                    neutralPosition1 = 0
                  }
                  if (neutralPosition2 === nrOfOccurances) {
                    console.log("Right ankle not in the correct position:")
                    neutralPosition2 = 0
                  }
                  if (kneeAnkleAlignment1 === nrOfOccurances) {
                    console.log("Left knee ankle alignment is wrong:")
                    kneeAnkleAlignment1 = 0
                  }
                  if (kneeAnkleAlignment2 === nrOfOccurances) {
                    console.log("Right knee ankle alignment is wrong:")
                    kneeAnkleAlignment2 = 0
                  }
                  if (hipHeightToLow === nrOfOccurances){
                    console.log("You squat is too low!")
                    hipHeightToLow = 0
                  }
                }

                // HEURISTICS
                neutralPosition(keypoints[Keypoints.leftShoulder].position,
                  keypoints[Keypoints.rightShoulder].position,
                  keypoints[Keypoints.leftAnkle].position,
                  keypoints[Keypoints.rightAnkle].position)

                horizontalPose(keypoints[Keypoints.leftShoulder].position,
                  keypoints[Keypoints.rightShoulder].position,
                  keypoints[Keypoints.leftHip].position,
                  keypoints[Keypoints.rightHip].position)

                kneeAnkleAlignment(keypoints[Keypoints.leftKnee].position,
                  keypoints[Keypoints.rightKnee].position,
                  keypoints[Keypoints.leftAnkle].position,
                  keypoints[Keypoints.rightAnkle].position)

                hipHeight(keypoints[Keypoints.leftKnee].position,
                  keypoints[Keypoints.rightKnee].position,
                  keypoints[Keypoints.leftHip].position,
                  keypoints[Keypoints.rightHip].position)

                checkErrors()

                //END AI STUFF
              }

              if (frames % numberOfFrames === 0) {
                horizontalPose1 = 0;
                horizontalPose2 = 0;
                neutralPosition1 = 0;
                neutralPosition2 = 0;
                kneeAnkleAlignment1 = 0;
                kneeAnkleAlignment2 = 0;
              }

              checkHeuristics(keypoints,
                [horizontalPose1,
                  horizontalPose2,
                  neutralPosition1,
                  neutralPosition2,
                  kneeAnkleAlignment1,
                  kneeAnkleAlignment2]);

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

        //wacht 3 seconden
        await new Promise(r => setTimeout(r, 2000)).then(() => {
          poseDetectionFrame(tracking)
        })

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
