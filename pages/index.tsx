import React, { useRef, useEffect, useState, useCallback } from "react";
import findAngle from "angle-between-landmarks"; // ES6
import Webcam from "react-webcam";
import { Pose, POSE_CONNECTIONS, POSE_LANDMARKS } from "@mediapipe/pose/";
import { Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils/";
import { Camera } from "@mediapipe/camera_utils/";
import { Box, Container, Flex } from "@chakra-ui/react";

const MPPose = () => {
  const webcamRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [repCount, setRepCount] = useState({ l: 0, r: 0 });
  const [armStates, setArmStates] = useState({ l: "DOWN", r: "DOWN" });
  const [angles, setAngles] = useState({ l: 0, r: 0 });

  useEffect(() => {
    if (!Pose) return;
    const pose = new Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      // enableSelfieMode: true,
      enableSegmentation: true,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults(onResults);

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await pose.send({ image: webcamRef.current.video });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  }, []);

  useEffect(() => {
    if (angles.l > 150 && armStates.l === "DOWN") {
      setArmStates((p) => ({ ...p, l: "UP" }));
      setRepCount((p) => ({ ...p, l: p.l + 1 }));
    }
    if (angles.l < 50) {
      setArmStates((p) => ({ ...p, l: "DOWN" }));
    }
    if (angles.r > 150 && armStates.r === "DOWN") {
      setArmStates((p) => ({ ...p, r: "UP" }));
      setRepCount((p) => ({ ...p, r: p.r + 1 }));
    }
    if (angles.r < 50) {
      setArmStates((p) => ({ ...p, r: "DOWN" }));
    }
  }, [angles, armStates.l, armStates.r]);

  const onResults = useCallback((results: Results) => {
    if (
      !results.poseLandmarks ||
      !webcamRef.current ||
      !webcamRef.current.video ||
      !canvasRef.current ||
      !canvasRef.current?.width
    )
      return;
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    const canvasElement: any = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    calc(results);

    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
    canvasCtx.restore();
  }, []);
  const calc = (results: any) => {
    const leftAngle =
      findAngle(
        results.poseLandmarks[11],
        results.poseLandmarks[13],
        results.poseLandmarks[15]
      ) - 180;

    const rightAngle =
      findAngle(
        results.poseLandmarks[12],
        results.poseLandmarks[14],
        results.poseLandmarks[16]
      ) - 180;
    setAngles({ l: leftAngle, r: rightAngle });
  };

  return (
    <Container minW={{ base: "100vw", md: "90vw", lg: "4xl" }}>
      <Flex w={"100%"} direction={"column"} alignItems={"center"}>
        <Box w={"100%"}>
          <Webcam
            audio={false}
            mirrored={true}
            ref={webcamRef}
            style={{ display: "none" }}
          />
          <canvas
            ref={canvasRef}
            style={{
              // width: "100%",
              // height: "auto",
              width: "auto",
              height: "100%",
            }}
          ></canvas>
        </Box>
        <Box>
          left:
          <br />
          {repCount.l} : {angles.l} : {armStates.l}
          <br />
          right:
          <br />
          {repCount.r} : {angles.r} : {armStates.r}
        </Box>
      </Flex>
    </Container>
  );
};

export default MPPose;
