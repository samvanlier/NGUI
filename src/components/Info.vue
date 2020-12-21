<template>
  <div class="info-text">
    <p class="space title">Info</p>
    <h4>What is Virtual trainer?</h4>
    <p>Virtual Trainer is your own personal trainer that is always ready to help you perform your exercise correctly.
      It will analyse your pose (the position in which you hold your body) and check if you are performing your exercise
      in the correct and intended way. If you are doing something wrong it will make you attentive of this, so that you
      can then correct your pose while exercising.</p>

    <h4>How will you know you are doing something wrong?</h4>
    <p>Your Virtual Trainer has two ways of notifying you that you could be doing something better to improve your
      exercise.<br>
      Once you have started you will show some coloured lines that are mapped on your body. Similarly to what you can
      see in the picture below. Body parts that are in the wrong position will be coloured red. When you are doing
      everything correctly all body parts will be green, this means you are doing good!</p>

    <img class="center-img" src="../assets/pose_example.png" alt="pose estimation example">
    <p>As we can see in the picture, this person’s shoulders are in a wrong position, this is marked by a red line. His
      hips are correctly parallel though, so they are marked by a green line.</p>

    <p>Please be aware that this is experimental technology, so that it is possible that some body parts will briefly
      turn red, even if they are in the right position.</p>

    <p>Your Virtual Trainer can also talk to you. When you are doing something wrong the application will also notify
      you of this through your speakers. So make sure your sound is turned on. This means you don’t have to look at the
      screen the whole time, but you can listen to the feedback your Virtual Trainer is telling you.</p>

    <h4>Let’s get started</h4>
    <p>First of all it is important that you are completely visible for the camera, what you see on your screen is also
      what your Virtual Trainer sees. You will be notified if you are not visible enough.<br>
      We also ask that you face forward towards the camera, so your complete front side is visible.</p>

    <p>Say “start” to let your Virtual Trainer know that you are ready to begin your exercise. You will see the coloured
      lines appear on your body in the camera feed. This means your Virtual Trainer is detecting your pose and is all
      set-up.<br>
      You can say “stop” when you are done exercising or at any other time, this will disable all forms of feedback the
      application was giving you before.<br>
      Alternatively, if you can not use a microphone, you can use the “start” and “stop” buttons.</p>

    <h4>Privacy Concerns</h4>
    <p>Please know that neither your microphone input nor your camera feed is recorded or stored anywhere by us. However the
      voice recognition is send to google's cloud service.</p>
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
    font-size: 3em !important;
    text-align: center;
  }

  .space {
    margin-top: 2%;
    margin-bottom: 2%;
  }

  .info-text {
    margin-left: 25%;
    width: 50%;
    text-align: left;
    margin-bottom: 5%;
  }

  .center-img {
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1%;
  }
</style>
