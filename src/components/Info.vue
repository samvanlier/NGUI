<template>
  <div>
    <p class="space title">Info</p>
  </div>
</template>

<script>
  import Speech from "./shared/Speech";

  export default {
    name: "Info",
    components: {Speech},
    mounted() {
      Speech.stopRecognition();
    },
  }
</script>

<style scoped>
  .title {
    font-size: 4em !important
  }

  .space {
    margin-top: 2%;
    margin-bottom: 2%;
  }
</style>
