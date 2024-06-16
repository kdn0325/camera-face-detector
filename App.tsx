import {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, Button, View} from 'react-native';
import {
  Frame,
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useIsFocused} from '@react-navigation/core';
import {useAppState} from '@react-native-community/hooks';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {
  Camera,
  Face,
  FaceDetectionOptions,
} from 'react-native-vision-camera-face-detector';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Entry point component
 *
 * @return {JSX.Element} Component
 */
function Index(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <FaceDetection />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/**
 * Face detection component
 *
 * @return {JSX.Element} Component
 */
function FaceDetection(): JSX.Element {
  const [detectedFaces, setDetectedFaces] = useState<Face[]>([]);
  const {hasPermission, requestPermission} = useCameraPermission();
  const [cameraMounted, setCameraMounted] = useState<boolean>(false);
  const [cameraPaused, setCameraPaused] = useState<boolean>(false);
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode: 'fast',
    classificationMode: 'none',
    minFaceSize: 0.1,
    trackingEnabled: true,
    autoScale: true,
  }).current;
  const isFocused = useIsFocused();
  const appState = useAppState();
  const isCameraActive = !cameraPaused && isFocused && appState === 'active';
  const cameraDevice = useCameraDevice('back');
  //
  // vision camera ref
  //
  const camera = useRef<VisionCamera>(null);
  //
  // face rectangle position
  //
  // const aFaceW = useSharedValue(0);
  // const aFaceH = useSharedValue(0);
  // const aFaceX = useSharedValue(0);
  // const aFaceY = useSharedValue(0);
  // const animatedStyle = useAnimatedStyle(() => ({
  //   position: 'absolute',
  //   borderWidth: 4,
  //   borderLeftColor: 'rgb(0,255,0)',
  //   borderRightColor: 'rgb(0,255,0)',
  //   borderBottomColor: 'rgb(0,255,0)',
  //   borderTopColor: 'rgb(255,0,0)',
  //   width: withTiming(aFaceW.value, {
  //     duration: 100,
  //   }),
  //   height: withTiming(aFaceH.value, {
  //     duration: 100,
  //   }),
  //   left: withTiming(aFaceX.value, {
  //     duration: 100,
  //   }),
  //   top: withTiming(aFaceY.value, {
  //     duration: 100,
  //   }),
  // }));

  useEffect(() => {
    if (hasPermission) return;
    requestPermission();
  }, []);

  /**
   * Hanldes camera mount error event
   *
   * @param {any} error Error event
   */
  function handleCameraMountError(error: any) {
    console.error('camera mount error', error);
  }

  /**
   * Handle detection result
   *
   * @param {Face[]} faces Detection result
   * @param frame
   * @returns {void}
   */
  function handleFacesDetected(faces: Face[], frame: Frame): void {
    if (faces.length > 0) {
      console.log('faces', faces.length, 'frame', frame.toString());
    }
    // if no faces are detected we do nothing
    if (Object.keys(faces).length <= 0) return;

    const {bounds} = faces[0];
    const {width, height, x, y} = bounds;
    // aFaceW.value = width;
    // aFaceH.value = height;
    // aFaceX.value = x;
    // aFaceY.value = y;
    setDetectedFaces(faces);

    // only call camera methods if ref is defined
    if (camera.current) {
      // take photo, capture video, etc...
    }
  }

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
        {hasPermission && cameraDevice ? (
          <>
            {cameraMounted && (
              <>
                <Camera
                  ref={camera}
                  outputOrientation="device"
                  style={StyleSheet.absoluteFill}
                  isActive={isCameraActive}
                  device={cameraDevice}
                  onError={handleCameraMountError}
                  faceDetectionCallback={handleFacesDetected}
                  faceDetectionOptions={{
                    ...faceDetectionOptions,
                    autoScale,
                  }}
                />

                {detectedFaces &&
                  detectedFaces.map((face, index) => {
                    const {bounds} = face;
                    const {width, height, x, y} = bounds;

                    console.log(
                      'width:',
                      width,
                      'height:',
                      height,
                      'x:',
                      x,
                      'y:',
                      y,
                    );

                    return (
                      <Animated.View
                        key={index}
                        style={[
                          {
                            position: 'absolute',
                            backgroundColor: 'red',
                            width: width,
                            height: height,
                            left: x,
                            top: y,
                          },
                        ]}
                      />
                    );
                  })}

                {cameraPaused && (
                  <Text
                    style={{
                      width: '100%',
                      backgroundColor: 'rgb(0,0,255)',
                      textAlign: 'center',
                      color: 'white',
                    }}>
                    Camera is PAUSED
                  </Text>
                )}
              </>
            )}

            {!cameraMounted && (
              <Text
                style={{
                  width: '100%',
                  backgroundColor: 'rgb(255,255,0)',
                  textAlign: 'center',
                }}>
                Camera is NOT mounted
              </Text>
            )}
          </>
        ) : (
          <Text
            style={{
              width: '100%',
              backgroundColor: 'rgb(255,0,0)',
              textAlign: 'center',
              color: 'white',
            }}>
            No camera device or permission
          </Text>
        )}
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Button
          onPress={() => setAutoScale(current => !current)}
          title={`${autoScale ? 'Disable' : 'Enable'} scale`}
        />

        <Button
          onPress={() => setCameraPaused(current => !current)}
          title={`${cameraPaused ? 'Resume' : 'Pause'} Cam`}
        />

        <Button
          onPress={() => setCameraMounted(current => !current)}
          title={`${cameraMounted ? 'Unmount' : 'Mount'} Cam`}
        />
      </View>
    </>
  );
}

export default Index;
