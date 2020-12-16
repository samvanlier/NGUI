<template>
  <div id="app">
    <v-app id="inspire">
      <router-view></router-view>
      <v-bottom-navigation class="nav" background-color="teal" v-model="value" color="white" grow fixed>
        <v-btn :to="{ name: 'tutorial'}" value="tutorial">
          <span>Tutorial</span>
          <v-icon>mdi-help-circle-outline</v-icon>
        </v-btn>
        <v-btn :to="{ name: 'trainer'}" value="trainer">
          <span>Trainer</span>
          <v-icon>mdi-account-circle-outline</v-icon>
        </v-btn>
        <v-btn :to="{ name: 'info'}" value="info">
          <span>Info</span>
          <v-icon>mdi-alert-circle-outline</v-icon>
        </v-btn>
      </v-bottom-navigation>
    </v-app>
  </div>
</template>

<script>
  import PoseDetection from "./components/shared/PoseDetection";
  import Speech from "./components/shared/Speech";
  import Heuristics from "./components/shared/Heuristics";
  import Feedback from "./components/shared/Feedback";
  import Util from "./components/shared/Util";

  export default {
    components: {Speech, PoseDetection, Heuristics, Util, Feedback},
    data() {
      return {
        value: this.$route.name
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
    height: 100%;
  }

  li {
    display: inline;
    padding: 5px;
  }

  html, body {
    height: 100%;
  }

  .nav {
    /*padding-top: 0.6%;*/
    height: 100%;
  }
</style>
