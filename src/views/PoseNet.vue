<template>
    <div class="posenet">
        <video id="video" playsinline class="feed"/>
        <canvas id="output"/>
    </div>
</template>

<style scoped>
.feed{
    display: inline;
}
</style>

<script lang="ts">
import Vue from 'vue'
import * as ft from '@tensorflow/tfjs'
import * as posenet from '@tensorflow-models/posenet'
import dat from 'dat.gui'
import Stats from 'stats.js'

async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        throw new Error('No camera available');
    }

    const video: HTMLVideoElement = document.getElementsByTagName('video')[0];

    const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': true
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = ()=> {resolve(video)}
    });
}

//todo afwerken
//srcs : posenet (github)
//     : https://github.com/xunxdd/Posenet-Demo--In-My-Feelings-Challenge-AI/blob/master/src/components/Camera.vue

export default class PoseNet extends Vue {
}

</script>
