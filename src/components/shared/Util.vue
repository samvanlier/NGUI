<template></template>

<script>
  /**
   * Source : https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/demo_util.js
   */
  /**
   * @license
   * Copyright 2019 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * https://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   */
  import * as posenet from '@tensorflow-models/posenet';
  import * as tf from '@tensorflow/tfjs';

  // let color = 'green';
  const boundingBoxColor = 'red';
  const lineWidth = 2;

  export default {
    name: "Util",
    methods: {
      /**
       * Used by the drawHeatMapValues method to draw heatmap points on to
       * the canvas
       */
      drawPoints(ctx, points, radius, color) {
        const data = points.buffer().values;

        for (let i = 0; i < data.length; i += 2) {
          const pointY = data[i];
          const pointX = data[i + 1];

          if (pointX !== 0 && pointY !== 0) {
            ctx.beginPath();
            ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }
        }
      },
    },
    toTuple({y, x}) {
      return [y, x];
    },
    drawPoint(ctx, y, x, r, color) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    /**
     * Draws a line on a canvas, i.e. a joint
     */
    drawSegment([ay, ax], [by, bx], color, scale, ctx) {
      ctx.beginPath();
      ctx.moveTo(ax * scale, ay * scale);
      ctx.lineTo(bx * scale, by * scale);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.stroke();
    },
    /**
     * Draws a pose skeleton by looking up all adjacent keypoints/joints
     * @param color Give the color of the skeleton
     */
    drawSkeleton(keypoints, minConfidence, ctx, colors = [], scale = 1) {
      const adjacentKeyPoints =
        posenet.getAdjacentKeyPoints(keypoints, minConfidence);

      for (let i = 0; i < adjacentKeyPoints.length; i++) {
        const keypoints = adjacentKeyPoints[i];
        const color = colors[i];

        this.drawSegment(
          this.toTuple(keypoints[0].position), this.toTuple(keypoints[1].position), color,
          scale, ctx);
      }
    },
    /**
     * Draw pose keypoints onto a canvas
     */
    drawKeypoints(keypoints, minConfidence, ctx, colors = [], scale = 1) {
      for (let i = 0; i < keypoints.length; i++) {
        const color = colors[i];
        //const color = 'green';

        const keypoint = keypoints[i];

        if (keypoint.score < minConfidence) {
          continue;
        }

        const {y, x} = keypoint.position;
        this.drawPoint(ctx, y * scale, x * scale, 3, color);
      }
    },
    /**
     * Draw the bounding box of a pose. For example, for a whole person standing
     * in an image, the bounding box will begin at the nose and extend to one of
     * ankles
     */
    drawBoundingBox(keypoints, ctx) {
      const boundingBox = posenet.getBoundingBox(keypoints);

      ctx.rect(
        boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX,
        boundingBox.maxY - boundingBox.minY);

      ctx.strokeStyle = boundingBoxColor;
      ctx.stroke();
    },
    /**
     * Converts an arary of pixel data into an ImageData object
     */
    async renderToCanvas(a, ctx) {
      const [height, width] = a.shape;
      const imageData = new ImageData(width, height);

      const data = await a.data();

      for (let i = 0; i < height * width; ++i) {
        const j = i * 4;
        const k = i * 3;

        imageData.data[j + 0] = data[k + 0];
        imageData.data[j + 1] = data[k + 1];
        imageData.data[j + 2] = data[k + 2];
        imageData.data[j + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    },
    /**
     * Draw an image on a canvas
     */
    renderImageToCanvas(image, size, canvas) {
      canvas.width = size[0];
      canvas.height = size[1];
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0);
    },
    /**
     * Draw heatmap values, one of the model outputs, on to the canvas
     * Read our blog post for a description of PoseNet's heatmap outputs
     * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
     */
    drawHeatMapValues(heatMapValues, outputStride, canvas) {
      const ctx = canvas.getContext('2d');
      const radius = 5;
      const scaledValues = heatMapValues.mul(tf.scalar(outputStride, 'int32'));

      this.drawPoints(ctx, scaledValues, radius, color);
    },
    /**
     * Used by the drawHeatMapValues method to draw heatmap points on to
     * the canvas
     */
    drawPoints(ctx, points, radius, color) {
      const data = points.buffer().values;

      for (let i = 0; i < data.length; i += 2) {
        const pointY = data[i];
        const pointX = data[i + 1];

        if (pointX !== 0 && pointY !== 0) {
          ctx.beginPath();
          ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
    },
    /**
     * Draw offset vector values, one of the model outputs, on to the canvas
     * Read our blog post for a description of PoseNet's offset vector outputs
     * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
     */
    drawOffsetVectors(heatMapValues, offsets, outputStride, scale = 1, ctx) {
      const offsetPoints =
        posenet.singlePose.getOffsetPoints(heatMapValues, outputStride, offsets);

      const heatmapData = heatMapValues.buffer().values;
      const offsetPointsData = offsetPoints.buffer().values;

      for (let i = 0; i < heatmapData.length; i += 2) {
        const heatmapY = heatmapData[i] * outputStride;
        const heatmapX = heatmapData[i + 1] * outputStride;
        const offsetPointY = offsetPointsData[i];
        const offsetPointX = offsetPointsData[i + 1];

        this.drawSegment(
          [heatmapY, heatmapX], [offsetPointY, offsetPointX], color, scale, ctx);
      }
    }
  }
</script>

<style scoped>

</style>
