<template>

</template>

<script>
  /**
   * An Enum for the keypoints of the body
   */
  export const Keypoints = {
    nose: 0,
    leftEye: 1,
    rightEye: 2,
    leftEar: 3,
    rightEar: 4,
    leftShoulder: 5,
    rightShoulder: 6,
    leftElbow: 7,
    rightElbow: 8,
    leftWrist: 9,
    rightWrist: 10,
    leftHip: 11,
    rightHip: 12,
    leftKnee: 13,
    rightKnee: 14,
    leftAnkle: 15,
    rightAnkle: 16
  };

  export default {
    name: "Heuristics",
    //===============================================IMPLEMENT EXERCISE HERE==============================================
    checkFrontSideSquat(keypoints, mpc) {
      var feedbackArray = []

      // Hips need to be horizontal
      feedbackArray.push(this.horizontal(keypoints, Keypoints.leftHip, Keypoints.rightHip, 5, "Your hips need to be parallel to the ground", mpc))

      // Shoulders need to be horizontal
      feedbackArray.push(this.horizontal(keypoints, Keypoints.leftShoulder, Keypoints.rightShoulder, 5, "Your shoulders need to be parallel to the ground", mpc))

      // Squat can not go lower then 20 (experimentally determined)
      feedbackArray.push(this.distanceBetween2Lines(keypoints, Keypoints.leftHip, Keypoints.rightHip, Keypoints.leftKnee, Keypoints.rightKnee, 20, "You are going to low.", mpc))

      // Check neutral pose
      // left side
      feedbackArray.push(
        this.verticalRange(keypoints, Keypoints.leftShoulder, Keypoints.leftAnkle, -85, 90,
          "Move your left foot more to the right",
          "Move your left foot more to the left", mpc)
      )

      // right side
      feedbackArray.push(this.verticalRange(keypoints, Keypoints.rightShoulder, Keypoints.rightAnkle, 85, 90,
        "Move your right foot more to the right",
        "Move your right foot more to the left", mpc))

      let KneeFootThreshold = 10

      // knee-ankle alignment
      // left side
      feedbackArray.push(this.vertical(keypoints, Keypoints.leftKnee, Keypoints.leftAnkle, KneeFootThreshold,
        "Move your left knee more to the right",
        "Move your left knee more to the left", mpc))

      // right side
      feedbackArray.push(this.vertical(keypoints, Keypoints.rightKnee, Keypoints.rightAnkle, KneeFootThreshold,
        "Move your right knee more to the right",
        "Move your right knee more to the left", mpc))

      return feedbackArray
    },
    lunges(keypoints, mpc) {
      var feedbackArray = []
      feedbackArray.push(this.angleRange(keypoints, Keypoints.leftHip, Keypoints.leftKnee, Keypoints.leftAnkle, 90, 180, "Left knee bended", "Left knee is bended too much", mpc))
      feedbackArray.push(this.angleRange(keypoints, Keypoints.rightHip, Keypoints.rightKnee, Keypoints.rightAnkle, 90, 180, "Rightknee bended", "Right knee is bended too much", mpc))

      return feedbackArray
    },
    plank(keypoints, mpc) {
      var feedbackArray = []
      feedbackArray.push(this.vertical(keypoints, Keypoints.leftShoulder, Keypoints.leftElbow, 5, "ai", "ey", mpc))
      feedbackArray.push(this.vertical(keypoints, Keypoints.rightShoulder, Keypoints.rightElbow, 5, "ai", "ey", mpc))
      feedbackArray.push(this.angle(keypoints, Keypoints.leftWrist, Keypoints.leftElbow, Keypoints.leftShoulder, 90, 5, "wait a sec", "Left elbow is bended too much", mpc))
      feedbackArray.push(this.angle(keypoints, Keypoints.rightWrist, Keypoints.rightElbow, Keypoints.rightShoulder, 90, 5, "wat is dadde", "Right elbow is bended too much", mpc))


      return feedbackArray
    },
    lateralLegRaises() {
      var array = []
      array.push(this.angle(keypoints, Keypoints.leftAnkle, Keypoints.leftHip, Keypoints.rightAnkle, 45, 5, "", "Right elbow is bended too much", mpc))
      return array
    },
    /**
     * Checks if person is fully in screen
     * @param kps keypoints
     * @param feedback given feedback text when person is not fully in screen
     * @param mpc minimum part confidence
     * @return {Object} with feedback text and the keypoints that it applies to
     */
    inScreen(kps, feedback, mpc) {
      let count = 0
      for (let i = 0; i < kps.length; i++) {
        if (kps[i] === null || kps[i].score < mpc)
          count++
      }
      if (count !== 17) {
        return feedbackWrapper(feedback, [])
      }
      return feedbackWrapper("", [])
    },
    //===============================================HELPERS==============================================================
    // calculated distance between 2 points
    distanceBetween2Points(point1, point2) { //length of line
      var a = point2.position.x - point1.position.x;
      var b = point2.position.y - point1.position.y;
      return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
    },

    //wrapper function for text and affected keypooints
    feedbackWrapper(text, keypoints) {
      return {text: text, keypoints: keypoints}
    },

    //angle between 3 points, calculate angle of the pivot point
    angleBetween3Points(point1, pivot, point2) {
      const b = this.distanceBetween2Points(point1, pivot);
      const a = this.distanceBetween2Points(pivot, point2);
      const c = this.distanceBetween2Points(point1, point2);

      const pivotAngleInRadians = Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b));
      const pivotAngleInDegrees = pivotAngleInRadians * 180 / Math.PI;

      return pivotAngleInDegrees
    },

    //checks wheter the keypoints are useable (not null and score > mpc)
    useableKeypoints(kps, mpc) {
      for (let i = 0; i < kps.length; i++) {
        if (kps[i] === null || kps[i].score < mpc) {
          return false
        }
      }
      return true
    },

    //===============================================BUILDING BLOCKS=====================================================

    /*
    * General explenation of angles:
    * Angles that are given with the functions are in degrees
    * North is 90° ( we don't use South because we can calculate all South with North)
    * East & West are 0°
    * North-East is negative (-89 till 0)
    * North-West is positive (89 till 0)
    * */

    /**
     * Checks if distance between 2 lines, calculated from 4 points,
     * line1: point1 and point2
     * line2: point3 and point4
     * are higher then given distance parameter
     * @param kps keypoints
     * @param mpc minimum part confidence
     * @return {Object} with feedback text and the keypoints that it applies to
     */
    distanceBetween2Lines(kps, point1, point2, point3, point4, distance, feedback, mpc) {
      const p1 = kps[point1]
      const p2 = kps[point2]
      const p3 = kps[point3]
      const p4 = kps[point4]

      if (this.useableKeypoints([p1, p2, p3, p4], mpc)) {
        const aX = (p1.position.x + p2.position.x) / 2
        const aY = (p1.position.y + p2.position.y) / 2
        const bX = (p3.position.x + p4.position.x) / 2
        const bY = (p3.position.y + p4.position.y) / 2

        const d = Math.sqrt(Math.pow(bX - aX, 2) + Math.pow(bY - aY, 2));

        if (d < distance) {
          return this.feedbackWrapper(feedback, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
            id: point3,
            part: p3.part
          }, {id: point4, part: p4.part}]);
        }
      }

      return this.feedbackWrapper("", [])
    },

    /**
     * Check if the 2 given keypoints are horizontal.
     * @param kps keypoints
     * @param threshold gives us a margin in degrees, to combat the lack of reliability
     * @param mpc minimum part confidence
     * @return {Object} with feedback text and the keypoints that it applies to
     */
    horizontal(kps, point1, point2, threshold, feedback, mpc) {
      const p1 = kps[point1]
      const p2 = kps[point2]

      if (this.useableKeypoints([p1, p2], mpc)) {
        const angle = Math.atan((p1.position.y - p2.position.y) / (p2.position.x - p1.position.x)) * 180 / Math.PI;

        if (Math.abs(angle) > threshold) {
          return this.feedbackWrapper(feedback, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        }
      }
      return this.feedbackWrapper("", [])
    },

    /**
     * Check if 2 given keypoints are vertical.
     * @param kps keypoints
     * @param threshold gives us a margin in degrees, to combat the lack of reliability
     * @param feedback1 given feedback text when angle is to much to the right
     * @param feedback2 given feedback text when angle is to much to the left
     * @param mpc minimum part confidence
     * @return {Object} with feedback text and the keypoints that it applies to
     */
    vertical(kps, point1, point2, threshold, feedback1, feedback2, mpc) {
      const p1 = kps[point1]
      const p2 = kps[point2]

      if (this.useableKeypoints([p1, p2], mpc)) {
        const angle = Math.atan((p2.position.y - p1.position.y) / (p2.position.x - p1.position.x)) * 180 / Math.PI;

        if (angle < 0 && angle > -90 + threshold) {
          return this.feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        } else if (angle > 0 && angle < 90 - threshold) {
          //too much to the left (need to move right)
          return this.feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        }
      }
      return this.feedbackWrapper("", [])
    },

    /**
     * Check if 2 given keypoints are vertical between angle1 and angle2.
     * @param kps keypoints
     * @param angle1 angle2 these angles describe the allowed range
     * @param feedback1 given feedback text when angle is to much to the right
     * @param feedback2 given feedback text when angle is to much to the left
     * @param mpc minimum part confidence
     * @return {Object} with feedback text and the keypoints that it applies to
     */
    verticalRange(kps, point1, point2, angle1, angle2, feedback1, feedback2, mpc) {
      const p1 = kps[point1]
      const p2 = kps[point2]

      if (this.useableKeypoints([p1, p2], mpc)) {
        const a = Math.atan((p1.position.y - p2.position.y) / (p1.position.x - p2.position.x)) * 180 / Math.PI;

        // we hebben 4 mogelijkheden! (N, E, S, W)
        let a1 = angle1
        let a2 = angle2

        if (p1.position.y < p2.position.y) {
          if (a1 < 0 && a2 > 0) { // - to +
            if (a < 0 && a > a1) {
              return this.feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
            } else if (a > 0 && a < a2) {
              return this.feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
            }
          } else if (a1 < 0 && a2 < 0) { // - to -
            if (a > a1) {
              return this.feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
            } else if (a < a2) {
              return this.feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
            }
          } else if (a1 > 0 && a2 > 0) { // + to +
            if (a < a1) {
              return this.feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
            } else if (a > a2) {
              return this.feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
            }
          }
        } else {
          return this.feedbackWrapper("bad orientation", [{id: point1, part: p1.part}, {id: point2, part: p2.part}]);
        }


      }
      return this.feedbackWrapper("", [])
    },

    /**
     * Checks if angle formed between 2 lines, defined from 3 points is equal to given angle +- threshold
     * @param kps keypoints
     * @param point1, pivot, point2 form a triangle. We calculate the angle of the pivot
     * @param threshold gives us a margin in degrees, to combat the lack of reliability
     * @param feedback1 given feedback text when angle is to much to the right
     * @param feedback2 given feedback text when angle is to much to the left
     * @param mpc minimum part confidence
     * @return {Object} with feedback text and the keypoints that it applies to
     */
    angle(kps, point1, pivot, point2, angle, threshold = 1,
          feedback1 = "Angle is too small.",
          feedback2 = "Angle is too big.", mpc) {
      const p1 = kps[point1]
      const p2 = kps[point2]
      const p3 = kps[pivot]

      if (this.useableKeypoints([p1, p2, p3], mpc)) {
        const a = angleBetween3Points(p1, p3, p2)
        console.log(a);
        if (a < angle - threshold) { //undershoot
          return this.feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
            id: pivot,
            part: p3.part
          }]);
        } else if (a > angle + threshold) { //overshoot
          return this.feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
            id: pivot,
            part: p3.part
          }]);
        }
      }
      return this.feedbackWrapper("", [])
    },


    /**
     * Checks if angle formed between 2 lines, defined from 3 points, needs to be between angle1 and angle2
     * @param kps keypoints
     * @param point1, pivot, point2 form a triangle. We calculate the angle of the pivot
     * @param angle1 angle2 these angles describe the allowed range
     * @param feedback1 given feedback text when angle is to much to the right
     * @param feedback2 given feedback text when angle is to much to the left
     * @param mpc minimum part confidence
     * @return {Object} with feedback text and the keypoints that it applies to
     */
    angleRange(kps, point1, pivot, point2, angle1, angle2,
               feedback1 = "Angle is too small.",
               feedback2 = "Angle is too big.", mpc) {
      const p1 = kps[point1]
      const p2 = kps[point2]
      const p3 = kps[pivot]

      if (this.useableKeypoints([p1, p2, p3], mpc)) {
        const a = angleBetween3Points(p1, p3, p2)
        if (a < angle1) { //undershoot
          return this.feedbackWrapper(feedback1, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
            id: pivot,
            part: p3.part
          }]);
        } else if (a > angle2) { //overshoot
          return this.feedbackWrapper(feedback2, [{id: point1, part: p1.part}, {id: point2, part: p2.part}, {
            id: pivot,
            part: p3.part
          }]);
        }
      }
      return this.feedbackWrapper("", [])
    },
    /**
     * Check the pose of the user
     * @param keypoints An array of key-points of the user
     * @param check
     * @param mpc minPartConfidence
     * @return {Object} Check, contains the feedback with the affected keypoints
     */
    checkHeuristics(keypoints, check, mpc) {
      // get in screen (init)
      var feedbackArray = []
      // feedbackArray.push(inScreen(keypoints, "Move more in screen.", 0.5))
      // exercise checks
      feedbackArray = feedbackArray.concat(this.checkFrontSideSquat(keypoints, mpc))

      //per check gaan we een entry in onze array bijvoegen
      for (var i = 0; i < feedbackArray.length; i++) {
        var fb = {occurances: 0, text: feedbackArray[i].text, keypoints: feedbackArray[i].keypoints}

        //if object not found then init object!
        if (check[i]) {
          fb.occurances = check[i].occurances
        }

        if (fb.text !== "") {
          fb.occurances += 1
        }

        if (check[i] === null) {
          check.push(fb)
        } else {
          check[i] = fb
        }
      }
      return check
    }
  }
</script>

<style scoped>

</style>
