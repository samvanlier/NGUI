<template></template>

<script>
  import * as posenet from '@tensorflow-models/posenet';
  import Heuristics from "./Heuristics";
  import Feedback from "./Feedback";
  import Util from "./Util";
  import Speech from "./Speech";

  export default {
    name: "PoseDetection",
    data() {
      return {
        started: true
      }
    },
    created() {
      this.started = true
    },
    /**
     * Render the video feed in a 2D canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {*} video An video element that has to be displayed
     * @param {Number} videoWidth The width of the video
     * @param {Number} videoHeight The height of the video
     */
    showCamera(ctx, video, videoWidth, videoHeight) {
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    },
    /**
     * Creates the arrays of colors for the Keypoints and for the adjacent Keypoints (lines)
     * @param {*} keypoints Array of key points
     * @param {*} check Collection of possible mistakes and occurrences
     * @param {Boolean} hasFeedback If false then there is no feedback and all points and lines are green; otherwise points and line need to be colored
     * @param {*} minPartConfidence
     */
    createColors(keypoints, check, hasFeedback, minPartConfidence) {
      /**
       * Find the index in the Array of the adjacent points between the two parts
       * @param {[Object]} points Array of adjacent points
       * @param {String} part1 String name of a key point
       * @param {String} part2 String name of a key point
       */
      function getIndex(points, part1, part2) {
        let i = -1;

        for (let j = 0; j < points.length; j++) {
          if (i < 0 && i !== j) {
            const arr = points[j];

            if (arr[0].part === part1 && arr[1].part === part2
              || arr[0].part === part2 && arr[1].part === part1) {
              i = j;
            }
          }
        }
        return i;
      }

      let good = "green";
      let bad = "red";
      let adKeypoints = posenet.getAdjacentKeyPoints(keypoints, minPartConfidence);
      let kpColors = keypoints.map(_ => good);
      let adKpColors = adKeypoints.map(_ => good);

      if (!hasFeedback) {
        return {
          kpColors: kpColors,
          adKpColors: adKpColors
        }
      } else {
        for (let i = 0; i < check.length; i++) {
          for (let j = 0; j < check[i].keypoints.length; j++) {
            kpColors[check[i].keypoints[j].id] = bad;
            for (let k = 0; k < check[i].keypoints.length; k++) {
              if (j !== k) {
                let index = getIndex(adKeypoints, check[i].keypoints[j].part, check[i].keypoints[k].part);
                if (index !== -1) {
                  adKpColors[index] = bad;
                }
              }
            }
          }
        }

        return {
          kpColors: kpColors,
          adKpColors: adKpColors
        }
      }
    },
    changeDetection(bool) {
      this.started = bool
    },
    /**
     * Do the detection of the user's position and provide feedback
     * @param {*} video The video feed of the camera used
     * @param {*} net A poseNet object that contains the computer vision elements
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} videoWidth The width of the video
     * @param {Number} videoHeight The height of the video
     */
    async detectPoseInRealTime(video, net, ctx, videoWidth, videoHeight) {
      let firstTime = true;

      // every pose detection is one frame
      let frames = 0;
      // every numberOfFrames is one cycle
      let cycles = 0;

      /*per numberOfFrames we check if a given percentage is in a wrong position
      if this is the case we print feedback and reset*/
      const numberOfFrames = 100;
      const percentage = 0.75;
      const nrOfOccurrences = numberOfFrames * percentage;

      /* number of cycles before a possible positive feedback is given */
      const ratioNormalPositive = 3;

      // list of feedback given per frame
      let checks = [[]];

      //default keypoint colors
      let keypointColors = new Array(17).fill("green");
      //default keypoint line colors
      let adjacentKeypointColors = new Array(12).fill("green");

      /* since images are being fed from a webcam, we want to feed in the original image and then just flip the keypoints' x coordinates.
      If instead we flip the image, then correcting left-right keypoint pairs requires a permutation on all the keypoints. */
      const flipPoseHorizontal = true;

      // loop for continuous detection of the pose
      async function poseDetectionFrame(env) {
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

        env.showCamera(ctx, video, videoWidth, videoHeight);

        if (firstTime) {
          Speech.speak("I'm listening, say start when you want to begin!");
          firstTime = false
        }

        poses.forEach(({score, keypoints}) => {
          if (score >= minPoseConfidence && env.started) {

            // retrieve last check
            let lastCheck = checks[checks.length - 1];
            let newCheck = Heuristics.checkHeuristics(keypoints, lastCheck, minPartConfidence);

            // every numberOfFrames we give back the feedback if we have feedback
            if ((frames % numberOfFrames) === 0) {
              cycles++;

              let temp;

              if (cycles === ratioNormalPositive) {
                cycles = 0;
                temp = Feedback.createFeedback(newCheck, nrOfOccurrences, true);
              } else {
                temp = Feedback.createFeedback(newCheck, nrOfOccurrences, false);
              }

              let feedback = temp.results;
              checks[checks.length - 1] = temp.check;
              Feedback.giveFeedback(feedback);
            } else {
              //update last check with new check (but you can also add to the checks array if we want to store more checks)
              //but here we store only one check
              checks[checks.length - 1] = newCheck;
            }

            // check if we have some feedback that we need to give back to the user
            let hasFeedback = Feedback.checkFeedBack(checks[checks.length - 1]);

            // get coloring of keypoints and lines
            let c = env.createColors(keypoints, checks[checks.length - 1], hasFeedback, minPartConfidence);

            keypointColors = c.kpColors;
            adjacentKeypointColors = c.adKpColors;

            // draw user keypoints and lines
            Util.drawKeypoints(keypoints, minPartConfidence, ctx, keypointColors);
            Util.drawSkeleton(keypoints, minPartConfidence, ctx, adjacentKeypointColors);
          }
        });

        // is a function of the default js api
        // link to docs: https://developer.mozilla.org/nl/docs/Web/API/Window/requestAnimationFrame
        requestAnimationFrame(function () {
          poseDetectionFrame(env)
        });
      }

      // initiate pose detection loop + camera
      poseDetectionFrame(this);
    }
  }
</script>

<style scoped>

</style>
