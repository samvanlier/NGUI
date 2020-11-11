<template>
  <!--<router-view/>-->
  <div id="app">
    <h1>Squat exercise</h1>
    <h2 class="space">Step 1. Watch Tutorial</h2>
    <iframe class="border" width="640" height="360" src="https://www.youtube.com/embed/jGQ8_IMPQOY" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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
        <canvas id="output" />
      </div>
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
  import * as tf from '@tensorflow/tfjs'
  import * as posenet from '@tensorflow-models/posenet'
  import {WebCam} from 'vue-web-cam'
  import Util from './scripts/util'
  import Stats from 'stats.js'
  import dat from 'dat.gui'

  const videoWidth = 640
  const videoHeight = 480
  const stats = new Stats()

  const defaultQuantBytes = 2
  const defaultMobileNetStride = 16
  const defaultMobileNetInputResolution = 500
  const defaultMobileNetMultiplier = 0.75
  const defaultResNetMultiplier = 1.0
  const defaultResNetStride = 32
  const defaultResNetInputResolution = 250

  const guiState = {
    algorithm: 'multi-pose',
    input: {
      architecture: 'MobileNetV1',
      outputStride: defaultMobileNetStride,
      inputResolution: defaultMobileNetInputResolution,
      multiplier: defaultMobileNetMultiplier,
      quantBytes: defaultQuantBytes
    },
    singlePoseDetection: {
      minPoseConfidence: 0.1,
      minPartConfidence: 0.5,
    },
    multiPoseDetection: {
      maxPoseDetections: 5,
      minPoseConfidence: 0.15,
      minPartConfidence: 0.1,
      nmsRadius: 30.0,
    },
    output: {
      showVideo: true,
      showSkeleton: true,
      showPoints: true,
      showBoundingBox: false,
    },
    net: null,
  };

  export default {
    name: 'app',
    data () {
      return {
        deviceId: null,
        video: null,
        net: null
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
      // gebruik als setup video?
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio:false }).then(stream => {
          console.log(stream)
        })
      }

      this.onMounted();
    },
    methods: {
      detectPoseInRealTime(video, net) {
        const canvas = document.getElementById('output');
        const ctx = canvas.getContext('2d');
        // since images are being fed from a webcam
        const flipHorizontal = true;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        async function poseDetectionFrame() {
          if (guiState.changeToArchitecture) {
            // Important to purge variables and free up GPU memory
            guiState.net.dispose();
            // Load the PoseNet model weights for either the 0.50, 0.75, 1.00, or 1.01
            // version
            guiState.net = await posenet.load(+guiState.changeToArchitecture);
            guiState.changeToArchitecture = null;
          }
          // Begin monitoring code for frames per second
          stats.begin();
          // Scale an image down to a certain factor. Too large of an image will slow
          // down the GPU
          const imageScaleFactor = guiState.input.imageScaleFactor;
          const outputStride = +guiState.input.outputStride;
          let poses = [];
          let minPoseConfidence;
          let minPartConfidence;
          switch (guiState.algorithm) {
            case 'single-pose':
              const pose = await guiState.net.estimateSinglePose(
                video, imageScaleFactor, flipHorizontal, outputStride);
              poses.push(pose);
              minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
              minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
              break;
            case 'multi-pose':
              poses = await guiState.net.estimateMultiplePoses(
                video, imageScaleFactor, flipHorizontal, outputStride,
                guiState.multiPoseDetection.maxPoseDetections,
                guiState.multiPoseDetection.minPartConfidence,
                guiState.multiPoseDetection.nmsRadius);
              minPoseConfidence = +guiState.multiPoseDetection.minPoseConfidence;
              minPartConfidence = +guiState.multiPoseDetection.minPartConfidence;
              break;
          }
          ctx.clearRect(0, 0, videoWidth, videoHeight);
          if (guiState.output.showVideo) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-videoWidth, 0);
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
            ctx.restore();
          }
          // For each pose (i.e. person) detected in an image, loop through the poses
          // and draw the resulting skeleton and keypoints if over certain confidence
          // scores

          //TODO: write hook for AI!
          poses.forEach(({
            score,
            keypoints
          }) => {
            if (score >= minPoseConfidence) {
            
              console.log(JSON.stringify(keypoints), minPartConfidence, ctx)
              if (guiState.output.showPoints) {
                Util.drawKeypoints(keypoints, minPartConfidence, ctx);
              }
              if (guiState.output.showSkeleton) {
                Util.drawSkeleton(keypoints, minPartConfidence, ctx);
              }
            }
          });
          // End monitoring code for frames per second
          stats.end();
          requestAnimationFrame(poseDetectionFrame);
        }
        poseDetectionFrame();
      },
      async setupCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
        }
        const video = document.getElementById('video');
        video.width = videoWidth;
        video.height = videoHeight;
        const mobile = this.isMobile();
        const stream = await navigator.mediaDevices.getUserMedia({
          'audio': false,
          'video': {
            facingMode: 'user',
            width: mobile ? undefined : videoWidth,
            height: mobile ? undefined : videoHeight,
          }
        });
        video.srcObject = stream;
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
      /**
       * Sets up a frames per second panel on the top-left of the window
       */
      setupFPS() {
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);
      },
      /**
       * Sets up dat.gui controller on the top-right of the window
       */
      setupGui(cameras, net) {
        guiState.net = net;

        if (cameras.length > 0) {
          guiState.camera = cameras[0].deviceId;
        }

        const gui = new dat.GUI({width: 300});

        let architectureController = null;
        // guiState[tryResNetButtonName] = function() {
        //   architectureController.setValue('ResNet50')
        // };
        // gui.add(guiState, tryResNetButtonName).name(tryResNetButtonText);
        // updateTryResNetButtonDatGuiCss();

        // The single-pose algorithm is faster and simpler but requires only one
        // person to be in the frame or results will be innaccurate. Multi-pose works
        // for more than 1 person
        const algorithmController =
            gui.add(guiState, 'algorithm', ['single-pose', 'multi-pose']);

        // The input parameters have the most effect on accuracy and speed of the
        // network
        let input = gui.addFolder('Input');
        // Architecture: there are a few PoseNet models varying in size and
        // accuracy. 1.01 is the largest, but will be the slowest. 0.50 is the
        // fastest, but least accurate.
        architectureController =
            input.add(guiState.input, 'architecture', ['MobileNetV1', 'ResNet50']);
        guiState.architecture = guiState.input.architecture;
        // Input resolution:  Internally, this parameter affects the height and width
        // of the layers in the neural network. The higher the value of the input
        // resolution the better the accuracy but slower the speed.
        let inputResolutionController = null;
        function updateGuiInputResolution(
            inputResolution,
            inputResolutionArray,
        ) {
          if (inputResolutionController) {
            inputResolutionController.remove();
          }
          guiState.inputResolution = inputResolution;
          guiState.input.inputResolution = inputResolution;
          inputResolutionController =
              input.add(guiState.input, 'inputResolution', inputResolutionArray);
          inputResolutionController.onChange(function(inputResolution) {
            guiState.changeToInputResolution = inputResolution;
          });
        }

        // Output stride:  Internally, this parameter affects the height and width of
        // the layers in the neural network. The lower the value of the output stride
        // the higher the accuracy but slower the speed, the higher the value the
        // faster the speed but lower the accuracy.
        let outputStrideController = null;
        function updateGuiOutputStride(outputStride, outputStrideArray) {
          if (outputStrideController) {
            outputStrideController.remove();
          }
          guiState.outputStride = outputStride;
          guiState.input.outputStride = outputStride;
          outputStrideController =
              input.add(guiState.input, 'outputStride', outputStrideArray);
          outputStrideController.onChange(function(outputStride) {
            guiState.changeToOutputStride = outputStride;
          });
        }

        // Multiplier: this parameter affects the number of feature map channels in
        // the MobileNet. The higher the value, the higher the accuracy but slower the
        // speed, the lower the value the faster the speed but lower the accuracy.
        let multiplierController = null;
        function updateGuiMultiplier(multiplier, multiplierArray) {
          if (multiplierController) {
            multiplierController.remove();
          }
          guiState.multiplier = multiplier;
          guiState.input.multiplier = multiplier;
          multiplierController =
              input.add(guiState.input, 'multiplier', multiplierArray);
          multiplierController.onChange(function(multiplier) {
            guiState.changeToMultiplier = multiplier;
          });
        }

        // QuantBytes: this parameter affects weight quantization in the ResNet50
        // model. The available options are 1 byte, 2 bytes, and 4 bytes. The higher
        // the value, the larger the model size and thus the longer the loading time,
        // the lower the value, the shorter the loading time but lower the accuracy.
        let quantBytesController = null;
        function updateGuiQuantBytes(quantBytes, quantBytesArray) {
          if (quantBytesController) {
            quantBytesController.remove();
          }
          guiState.quantBytes = +quantBytes;
          guiState.input.quantBytes = +quantBytes;
          quantBytesController =
              input.add(guiState.input, 'quantBytes', quantBytesArray);
          quantBytesController.onChange(function(quantBytes) {
            guiState.changeToQuantBytes = +quantBytes;
          });
        }

        function updateGui() {
          if (guiState.input.architecture === 'MobileNetV1') {
            updateGuiInputResolution(
                defaultMobileNetInputResolution,
                [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]);
            updateGuiOutputStride(defaultMobileNetStride, [8, 16]);
            updateGuiMultiplier(defaultMobileNetMultiplier, [0.50, 0.75, 1.0]);
          } else {  // guiState.input.architecture === "ResNet50"
            updateGuiInputResolution(
                defaultResNetInputResolution,
                [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]);
            updateGuiOutputStride(defaultResNetStride, [32, 16]);
            updateGuiMultiplier(defaultResNetMultiplier, [1.0]);
          }
          updateGuiQuantBytes(defaultQuantBytes, [1, 2, 4]);
        }

        updateGui();
        input.open();
        // Pose confidence: the overall confidence in the estimation of a person's
        // pose (i.e. a person detected in a frame)
        // Min part confidence: the confidence that a particular estimated keypoint
        // position is accurate (i.e. the elbow's position)
        let single = gui.addFolder('Single Pose Detection');
        single.add(guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
        single.add(guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);

        let multi = gui.addFolder('Multi Pose Detection');
        multi.add(guiState.multiPoseDetection, 'maxPoseDetections')
            .min(1)
            .max(20)
            .step(1);
        multi.add(guiState.multiPoseDetection, 'minPoseConfidence', 0.0, 1.0);
        multi.add(guiState.multiPoseDetection, 'minPartConfidence', 0.0, 1.0);
        // nms Radius: controls the minimum distance between poses that are returned
        // defaults to 20, which is probably fine for most use cases
        multi.add(guiState.multiPoseDetection, 'nmsRadius').min(0.0).max(40.0);
        multi.open();

        let output = gui.addFolder('Output');
        output.add(guiState.output, 'showVideo');
        output.add(guiState.output, 'showSkeleton');
        output.add(guiState.output, 'showPoints');
        output.add(guiState.output, 'showBoundingBox');
        output.open();


        architectureController.onChange(function(architecture) {
          // if architecture is ResNet50, then show ResNet50 options
          updateGui();
          guiState.changeToArchitecture = architecture;
        });

        algorithmController.onChange(function(value) {
          switch (guiState.algorithm) {
            case 'single-pose':
              multi.close();
              single.open();
              break;
            case 'multi-pose':
              single.close();
              multi.open();
              break;
          }
        });
        gui.domElement.style.visibility ="hidden"
      },
      async onMounted() {
        // Load the PoseNet model weights with architecture 0.75
        const net = await posenet.load();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main').style.display = 'block';
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
        this.setupGui([], net);
        this.setupFPS();
        this.detectPoseInRealTime(video, net);
        Util.drawSkeleton(points, confidence, ctx);
      },
      isAndroid() {
        return /Android/i.test(navigator.userAgent);
      },
      isiOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
      },
      isMobile() {
        return this.isAndroid() || this.isiOS();
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
