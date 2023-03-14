import React, { useRef, useEffect, useState, useCallback } from "react";
import findAngle from "angle-between-landmarks"; // ES6
import Webcam from "react-webcam";
import {
  Pose,
  POSE_CONNECTIONS,
  POSE_LANDMARKS,
  POSE_LANDMARKS_LEFT,
  POSE_LANDMARKS_RIGHT,
} from "@mediapipe/pose/";
import { Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils/";
import { Camera } from "@mediapipe/camera_utils/";
import { Box, Container, Flex } from "@chakra-ui/react";

interface I {
  l: number;
  r: number;
}
const MPOverheadPress = () => {
  const webcamRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [repCount, setrepCount] = useState<number>(0);
  const [elbowY, setElbowY] = useState<I>({ l: 0, r: 0 });
  const [wristY, setWristY] = useState<I>({ l: 0, r: 0 });
  const [shoulderY, setShoulderY] = useState<I>({ l: 0, r: 0 });
  const [noseY, setNoseY] = useState<number>(0);
  const [armStates, setArmStates] = useState<"DOWN" | "UP">("DOWN");

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
    if (elbowY.l > noseY && elbowY.r > noseY && armStates === "DOWN") {
      console.log("UP", repCount, elbowY.l, noseY);
      setArmStates("UP");
      setrepCount((p) => p + 1);
    }
    if (wristY.l < noseY && wristY.r < noseY && armStates === "UP") {
      console.log("DOWN", repCount, wristY.l, noseY);
      setArmStates("DOWN");
    }
  }, [elbowY, wristY, shoulderY, noseY]);

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
        color: "#0000FF",
        lineWidth: 3,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
    canvasCtx.restore();
  }, []);
  const calc = (results: Results) => {
    // console.log(typeof results.poseLandmarks[11].y);
    setNoseY(+(1 - results.poseLandmarks[0].y).toFixed(3));
    setWristY({
      l: +(1 - results.poseLandmarks[POSE_LANDMARKS_LEFT.LEFT_WRIST].y).toFixed(
        3
      ),
      r: +(
        1 - results.poseLandmarks[POSE_LANDMARKS_RIGHT.RIGHT_WRIST].y
      ).toFixed(3),
    });
    setElbowY({
      l: +(1 - results.poseLandmarks[POSE_LANDMARKS_LEFT.LEFT_ELBOW].y).toFixed(
        3
      ),
      r: +(
        1 - results.poseLandmarks[POSE_LANDMARKS_RIGHT.RIGHT_ELBOW].y
      ).toFixed(3),
    });
    setShoulderY({
      l: +(
        1 - results.poseLandmarks[POSE_LANDMARKS_LEFT.LEFT_SHOULDER].y
      ).toFixed(3),
      r: +(
        1 - results.poseLandmarks[POSE_LANDMARKS_RIGHT.RIGHT_SHOULDER].y
      ).toFixed(3),
    });
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
        {repCount}
        <Flex w={"100%"} justifyContent="space-around">
          <Box>
            <h1>Left: </h1>
            <h1>{shoulderY.l}</h1>
            <h1>{elbowY.l}</h1>
            <h1>{wristY.l}</h1>
          </Box>
          <Box>
            <h1>Right</h1>
            <h1>{shoulderY.r}</h1>
            <h1>{elbowY.r}</h1>
            <h1>{wristY.r}</h1>
          </Box>
        </Flex>
        {/* <Box>
          left:
          <br />
          {repCount.l} : {angles.l} : {armStates.l}
          <br />
          right:
          <br />
          {repCount.r} : {angles.r} : {armStates.r}
        </Box> */}
      </Flex>
    </Container>
  );
};

export default MPOverheadPress;
