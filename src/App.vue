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
        <textarea id="feedback" style="margin-left: 2%" name="feedback" rows="40" cols="60" readonly></textarea>
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
        //TODO: tweak this
        const numberOfFrames = 100;
        const percentage = 0.50
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
          minPartConfidence = +0.7;

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
                    const angle = Math.atan((rightHip.position.y - leftHip.position.y) / (rightHip.position.x - leftHip.position.x)) * 180 / Math.PI
                    const threshold = 5

                    if (leftHip.score > minPartConfidence && rightHip.score > minPartConfidence)
                      if (Math.abs(angle) > threshold)
                        horizontalPose1++
                  }

                    // leftShoulder and rightShoulder (horizontal)
                    function horizontalShoulders() {
                      const angle = Math.atan((rightShoulder.position.y - leftShoulder.position.y) / (rightShoulder.position.x - leftShoulder.position.x)) * 180 / Math.PI
                      const threshold = 5

                      if (leftShoulder.score > minPartConfidence && rightShoulder.score > minPartConfidence)
                        if (Math.abs(angle) > threshold)
                          horizontalPose2++
                    }

                    horizontalHips()
                    horizontalShoulders()
                  }

                  //feet shoulder width apart
                  function neutralPosition(leftShoulder, rightShoulder, leftAnkle, rightAnkle) {
                    // leftShoulder and leftAnkle (vertical - angle of 95-85)
                    function leftSide() {
                      const angle = Math.atan((leftAnkle.position.y - leftShoulder.position.y) / (leftAnkle.position.x - leftShoulder.position.x)) * 180 / Math.PI

                      if (leftAnkle.score > minPartConfidence && leftShoulder.score > minPartConfidence)
                        if (Math.abs(angle) > 90 || Math.abs(angle) < 88)
                          neutralPosition1++
                    }

                    // rightShoulder and rightFoot (vertical - angle of 95-85)
                    function rightSide() {
                      const angle = Math.atan((rightShoulder.position.y - rightAnkle.position.y) / (rightShoulder.position.x - rightAnkle.position.x)) * 180 / Math.PI

                      if (rightShoulder.score > minPartConfidence && rightAnkle.score > minPartConfidence)
                        if (angle < 0 && angle > -88)
                          neutralPosition2++
                    }

                    leftSide()
                    rightSide()
                  }

                  //between -87 and 87?
                  function kneeAnkleAlignment(leftKnee, rightKnee, leftAnkle, rightAnkle) {
                    // leftKnee and leftAnkle (vertical)
                    function leftSide() {
                      const angle = Math.atan((leftAnkle.position.y - leftKnee.position.y) / (leftAnkle.position.x - leftKnee.position.x)) * 180 / Math.PI

                      if (leftAnkle.score > minPartConfidence && leftKnee.score > minPartConfidence)
                        if (angle < 0 && angle > -85 || angle > 0 && angle < 85) {
                          kneeAnkleAlignment1++
                      }
                    }

                    // rightKnee and rightFoot (vertical)
                    function rightSide() {
                      const angle = Math.atan((rightKnee.position.y - rightAnkle.position.y) / (rightKnee.position.x - rightAnkle.position.x)) * 180 / Math.PI

                      if (rightKnee.score > minPartConfidence && rightAnkle.score > minPartConfidence)
                        if (angle < 0 && angle > -85 || angle > 0 && angle < 85)
                          kneeAnkleAlignment2++
                    }

                    leftSide()
                    rightSide()
                  }

                  //checks if squat is too low
                  function hipHeight(leftKnee, rightKnee, leftHip, rightHip) {
                    const hipX = (leftHip.position.x + rightHip.position.x) / 2
                    const hipY = (leftHip.position.y + rightHip.position.y) / 2
                    const kneeX = (leftKnee.position.x + rightKnee.position.x) / 2
                    const kneeY = (leftKnee.position.y + rightKnee.position.y) / 2

                    const distance = Math.sqrt(Math.pow(kneeX - hipX, 2) + Math.pow(kneeY - hipY, 2))

                    if (leftKnee.score > minPartConfidence && leftKnee.score > minPartConfidence && leftHip.score > minPartConfidence && rightHip.score > minPartConfidence)
                      if (distance < 20)
                        hipHeightToLow++
                  }

                  function checkErrors() {
                    var feedback = ""
                    if (horizontalPose1 === nrOfOccurances) {
                      feedback += "Hips are not parallel to the floor!\n"
                      horizontalPose1 = 0
                    }

                    if (horizontalPose2 === nrOfOccurances) {
                      feedback += "Shoulders are not parallel to the floor!\n"
                      horizontalPose2 = 0
                    }

                    if (neutralPosition1 === nrOfOccurances) {
                      feedback += "Left ankle not in the correct position!\n"
                      neutralPosition1 = 0
                    }
                    if (neutralPosition2 === nrOfOccurances) {
                      feedback += "Right ankle not in the correct position!\n"
                      neutralPosition2 = 0
                    }
                    if (kneeAnkleAlignment1 === nrOfOccurances) {
                      feedback += "Left knee ankle alignment is wrong!\n"
                      kneeAnkleAlignment1 = 0
                    }
                    if (kneeAnkleAlignment2 === nrOfOccurances) {
                      feedback +=  "Right knee ankle alignment is wrong!\n"
                      kneeAnkleAlignment2 = 0
                    }
                    if (hipHeightToLow === nrOfOccurances) {
                      feedback +=  "You squat is too low!\n"
                      hipHeightToLow = 0
                    }

                    var feedbackText = document.getElementById('feedback').textContent
                    document.getElementById('feedback').textContent = feedbackText + feedback
                  }

                  // HEURISTICS
                  neutralPosition(keypoints[Keypoints.leftShoulder],
                    keypoints[Keypoints.rightShoulder],
                    keypoints[Keypoints.leftAnkle],
                    keypoints[Keypoints.rightAnkle])

                  horizontalPose(keypoints[Keypoints.leftShoulder],
                    keypoints[Keypoints.rightShoulder],
                    keypoints[Keypoints.leftHip],
                    keypoints[Keypoints.rightHip])

                  kneeAnkleAlignment(keypoints[Keypoints.leftKnee],
                    keypoints[Keypoints.rightKnee],
                    keypoints[Keypoints.leftAnkle],
                    keypoints[Keypoints.rightAnkle])

                  hipHeight(keypoints[Keypoints.leftKnee],
                    keypoints[Keypoints.rightKnee],
                    keypoints[Keypoints.leftHip],
                    keypoints[Keypoints.rightHip])

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

                checkHeuristics(keypoints, minPartConfidence,
                  [horizontalPose1,
                    horizontalPose2,
                    neutralPosition1,
                    neutralPosition2,
                    kneeAnkleAlignment1,
                    kneeAnkleAlignment2]);

                drawKeypoints(keypoints, minPartConfidence, ctx);
                drawSkeleton(keypoints, minPartConfidence, ctx);
              }
            }
          );

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
