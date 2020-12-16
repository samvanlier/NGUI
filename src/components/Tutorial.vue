<template>
  <div>
    <p class="space title">Tutorial</p>
    <iframe class="border" width="960" height="540" src="https://www.youtube.com/embed/jGQ8_IMPQOY"></iframe>
  </div>
</template>

<script>
  import Speech from "./shared/Speech";
  import PoseDetection from "./shared/PoseDetection";
  export default {
    name: "Tutorial",
    mounted() {
      Speech.stopRecognition();
      PoseDetection.started = false
    },
  }
</script>

<style scoped>
  .space {
    margin-top: 2%;
    margin-bottom: 2%;
  }

  .border {
    border: black 5px solid;
  }

  .title {
    font-size: 3em !important;
  }
</style>
