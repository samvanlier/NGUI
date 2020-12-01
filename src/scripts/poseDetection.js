import * as posenet from '@tensorflow-models/posenet';
import {drawKeypoints, drawSkeleton} from './util';
import {checkHeuristics} from './heuristics';
import {createFeedback, giveFeedback} from './feedback';

/**
 * Render the video feed in a 2D canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} video An video element that has to be displayed
 * @param {Number} videoWidth The width of the video
 * @param {Number} videoHeight The height of the video
 */
function showCamera(ctx, video, videoWidth, videoHeight) {
  ctx.clearRect(0, 0, videoWidth, videoHeight);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-videoWidth, 0);
  ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
  ctx.restore();
}

/**
 *
 * @param {*} keypoints Array of key points
 * @param {*} minPartConfidence
 * @param check
 * @param {Boolean} hasFeedback If false then there is no feedback and all points and lines are green; otherwise points and line need to be colored
 */
function createColors(keypoints, check, hasFeedback, minPartConfidence) {
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
    for (var i = 0; i < check.length; i++) {
      for (let j = 0; j < check[i].keypoints.length; j++) {
        kpColors[check[i].keypoints[j].id] = bad
        for (let k = 0; k < check[i].keypoints.length; k++) {
          if (j !== k) { //&& j < k?
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
}


/**
 * Do the detection of the user's position and provide feedback
 * @param {*} video The video feed of the camera used
 * @param {*} net A poseNet object that contains the computer vision elements
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} videoWidth The width of the video
 * @param {Number} videoHeight The height of the video
 * @param {*} stats
 * @param {boolean} tracking A boolean indication if tracking has to be done
 */
export async function detectPoseInRealTime(video, net, ctx, videoWidth, videoHeight, stats, tracking = true) {
  let frames = 0;

  //per numberOfFrames we check if a given percentage is in a wrong position
  //if this is the case we print feedback and reset
  //TODO: tweak this
  const numberOfFrames = 100;
  const percentage = 0.75 //0.5
  const nrOfOccurrences = numberOfFrames * percentage

  //list of feedbacks (per feedback an array)
  //init with one check for one feedback
  let checks = [[]]

  let keypointColors = new Array(17).fill("green");
  let adjacentKeypointColors = new Array(12).fill("green");

  // since images are being fed from a webcam, we want to feed in the original image and then just flip the keypoints' x coordinates.
  // If instead we flip the image, then correcting left-right keypoint pairs requires a permutation on all the keypoints.
  const flipPoseHorizontal = true;

  async function poseDetectionFrame(tracking) {
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

    showCamera(ctx, video, videoWidth, videoHeight);
    poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence && tracking) {

        if (frames % numberOfFrames === 0) {
          keypointColors = new Array(17).fill("green");
          adjacentKeypointColors = new Array(12).fill("green");
        }

        var newCheck = checkHeuristics(keypoints, checks[checks.length - 1], minPartConfidence);
        let temp = createFeedback(newCheck, nrOfOccurrences);

        checks[checks.length - 1] = temp.check;
        //multiple strings possible
        let feedback = temp.results;
        let hasFeedback = temp.hasFeedback;

        giveFeedback(feedback); // return feedback to user

        if (hasFeedback) {
          let c = createColors(keypoints, checks[checks.length - 1], hasFeedback, minPartConfidence);
          keypointColors = c.kpColors;
          adjacentKeypointColors = c.adKpColors
        }

        // draw user
        drawKeypoints(keypoints, minPartConfidence, ctx, keypointColors);
        drawSkeleton(keypoints, minPartConfidence, ctx, adjacentKeypointColors);
      }
    });

    stats.end();

    // is a function of the default js api
    // link to docs: https://developer.mozilla.org/nl/docs/Web/API/Window/requestAnimationFrame
    requestAnimationFrame(function () {
      poseDetectionFrame(tracking)
    });
  }

  poseDetectionFrame(tracking);
}
