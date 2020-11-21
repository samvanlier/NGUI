import * as posenet from '@tensorflow-models/posenet';
import {drawKeypoints, drawSkeleton} from './util';
import Stats from 'stats.js';
import { checkHeuristics, Keypoints } from './heuristics';
import { createFeedback } from './feedback';

/**
 * Render the video feed in a 2D canvas
 * @param {CanvasRenderingContext2D} ctx 
 * @param {*} video An video element that has to be displayed
 * @param {Number} videoWidth The width of the video
 * @param {Number} videoHeight The height of the video
 */
function showCamera(ctx, video, videoWidth, videoHeight){
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-videoWidth, 0);
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    ctx.restore();
}

/**
 * Create a new clean userPose-object
 * @returns a new userPose object
 */
function resetUserPose(){
    return {
        horizontalHips: 0,
        horizontalShoulders: 0,
        neutralPositionLeft: 0,
        neutralPositionRight: 0,
        kneeAnkleAlignmentLeft: 0,
        kneeAnkleAlignmentRight: 0,
        hipHeightToLow: 0 //todo rename?
    };
}

/**
 * Gives the feedback to the user
 * @param {*} fb A feedback collection
 */
function giveFeedback(fb){
    function toString(){
        let text = [];

        if (fb.horizontalHips != null || fb.horizontalHips !== ""){
            text.push(fb.horizontalHips);
        }

        if(fb.horizontalShoulders != null || fb.horizontalShoulders !== ""){
            text.push(fb.horizontalShoulders);
        }

        if(fb.neutralPositionLeft != null || fb.neutralPositionLeft !== ""){
            text.push(fb.neutralPositionLeft);
        }

        if(fb.neutralPositionRight != null || fb.neutralPositionRight !== ""){
            text.push(fb.neutralPositionRight);
        }

        if(fb.kneeAnkleAlignmentLeft != null || fb.kneeAnkleAlignmentLeft !== ""){
            text.push(fb.kneeAnkleAlignmentLeft);
        }

        if(fb.kneeAnkleAlignmentRight != null || fb.kneeAnkleAlignmentRight !== ""){
            text.push(fb.kneeAnkleAlignmentRight);
        }

        if(fb.hipHeightToLow != null || fb.hipHeightToLow !== ""){
            text.push(fb.hipHeightToLow);
        }

        text = text.filter(x => x != null);
        if (text.length > 0){
            return text.join("!\n");
        }
        return "";
    }

    let ta = document.getElementById('feedback');
    let prev = ta.textContent;
    let current = toString();

    if(current != null && current !== ""){
        ta.textContent = prev + "\n"
                    + current;
    }
}

function getIndex(points, part1, part2){
    let i = -1;

    for (let j = 0; j < points.length; j++) {
        if ( i < 0 && i !== j){
            const arr = points[j];
        
            if (arr[0].part === part1 && arr[1].part === part2
                || arr[0].part === part2 && arr[1].part === part1 ){
                i = j;
            }
        }
    }
    return i;
}

function createColors(keypoints, minPartConfidence, feedback, hasFeedback){
    let good = "green";
    let bad = "red";
    let adKeypoints = posenet.getAdjacentKeyPoints(keypoints, minPartConfidence);
    let kpColors = keypoints.map(_ => good);
    let adKpColors = adKeypoints.map(_ => good)

    if (!hasFeedback){
        return {
            kpColors: kpColors,
            adKpColors: adKpColors
        }
    }

    if(feedback.horizontalHips != null && feedback.horizontalHip !== ""){
        kpColors[Keypoints.leftHip] = bad;
        kpColors[Keypoints.rightHip] = bad;

        let i = getIndex(adKeypoints, "leftHip", "rightHip");
        adKpColors[i] = bad;
    }

    if(feedback.horizontalShoulders != null && feedback.horizontalShoulders !== ""){
        kpColors[Keypoints.leftShoulder] = bad;
        kpColors[Keypoints.rightShoulder] = bad;

        let i = getIndex(adKeypoints, "leftShoulder", "rightShoulder");
        adKpColors[i] = bad;
    }

    if (feedback.neutralPositionLeft != null && feedback.neutralPositionLeft !== ""){
        kpColors[Keypoints.leftAnkle] = bad;
        kpColors[Keypoints.leftShoulder] = bad;

        let i = getIndex(adKeypoints, "leftAnkle", "rightAnkle");
        adKpColors[i] = bad;
    }

    if (feedback.neutralPositionRight != null && feedback.neutralPositionRight !== ""){
        kpColors[Keypoints.rightAnkle] = bad;
        kpColors[Keypoints.rightShoulder] = bad;

        let i = getIndex(adKeypoints, "rightAnkle", "rightShoulder");
        adKpColors[i] = bad;
    }

    if (feedback.kneeAnkleAlignmentLeft != null && feedback.kneeAnkleAlignmentLeft !== ""){
        kpColors[Keypoints.leftKnee] = bad;
        kpColors[Keypoints.leftAnkle] = bad;

        let i = getIndex(adKeypoints, "leftKnee", "leftAnkle");
        adKpColors[i] = bad;
    }
    
    if (feedback.kneeAnkleAlignmentRight != null && feedback.kneeAnkleAlignmentRight !== ""){
        kpColors[Keypoints.rightKnee] = bad;
        kpColors[Keypoints.rightAnkle] = bad;

        let i = getIndex(adKeypoints, "rightKnee", "rightAnkle");
        adKpColors[i] = bad;
    }

    if (feedback.hipHeightToLow != null && feedback.hipHeightToLow !== ""){
        kpColors[Keypoints.leftKnee] = bad;
        kpColors[Keypoints.rightKnee] = bad;
        kpColors[Keypoints.leftHip] = bad;
        kpColors[Keypoints.rightHip] = bad;

        let i = getIndex(adKeypoints, "leftKnee", "leftHip");
        adKpColors[i] = bad;
        let j = getIndex(adKeypoints, "rightKnee", "rightHip");
        adKpColors[j] = bad;
    }

    return {
        kpColors: kpColors,
        adKpColors: adKpColors
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
export async function detectPoseInRealTime(video, net, ctx, videoWidth, videoHeight, stats, tracking = true){
    //TODO: use stats for this? (easy fast method for now)
    let frames = 0;

    //per numberOfFrames we check if a given percentage is in a wrong position
    //if this is the case we print feedback and reset
    //TODO: tweak this
    const numberOfFrames = 100;
    const percentage = 0.50
    const nrOfOccurrences = numberOfFrames * percentage

    //check occurrences
    // todo rename poses
    let userPose = resetUserPose();
    let keypointColors = new Array(17).fill("green");
    let adjacentKeypointColors = new Array(12).fill("green");

    // since images are being fed from a webcam, we want to feed in the original image and then just flip the keypoints' x coordinates.
    // If instead we flip the image, then correcting left-right keypoint pairs requires a permutation on all the keypoints.
    const flipPoseHorizontal = true;
    async function poseDetectionFrame(tracking){
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
            if(score >= minPoseConfidence && tracking){
                if (frames % numberOfFrames === 0){
                    userPose = resetUserPose();
                    keypointColors = new Array(17).fill("green");
                    adjacentKeypointColors = new Array(12).fill("green");
                }

                userPose = checkHeuristics(keypoints, minPartConfidence, userPose);

                let temp = createFeedback(userPose, nrOfOccurrences);
                userPose = temp.userPose;
                let feedback = temp.result;
                let hasFeedback = temp.hasFeedback;
                
                giveFeedback(feedback); // return feedback to user
                if(hasFeedback){
                    let c = createColors(keypoints, minPartConfidence, feedback, hasFeedback);
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
