<template>
  <div>
    <p class="space title">Info</p>
  </div>
</template>

<script>
  import Speech from "./shared/Speech";
  import PoseDetection from "./shared/PoseDetection";

  export default {
    name: "Info",
    components: {Speech},
    mounted() {
      Speech.stopRecognition();
      PoseDetection.started = false
    },
  }
</script>

<style scoped>
  .title {
    font-size: 3em !important
  }

  .space {
    margin-top: 2%;
    margin-bottom: 2%;
  }
</style>
