/**
 * Web worker for estimation
 * =========================
 * 
 * The worker gets the video and posenet model from the caller
 * To do this (as a caller):
 * - create a worker: <code>let worker = new Worker("path/to/this/file.js")</code>
 * - add an event listener on the worker: <code>worker.addEventListener('message', function(e){
 * // do stuff with e.data
 * }, false)</code>
 * - to start the worker, call: <code>worker.postMessage({'video':videoEl, 'net':poseNetEl})</code>
 * 
 * Please note: workers need to be disposed of after the view/component closes
 */

function getEstimation(video, net) {
    net.estimatePoses(video, {
        decodingMethod: 'single-person',
        flipHorizontal: true // see https://github.com/tensorflow/tfjs-models/blob/708e3911fb01d0dfe70448acc3e8ca736fae82d3/posenet/demos/camera.js#L294
    }).then(pose => postMessage(pose))

    //loop
    getEstimation(video, net)
}

self.addEventListener('message', function(e){
    let net = e.data.net
    let video = e.data.video

    getEstimation(video, net)
})

