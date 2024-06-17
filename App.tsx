import React, {useCallback, useEffect, useState} from 'react';
import {
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  Camera,
  CameraPosition,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useSkiaFrameProcessor,
} from 'react-native-vision-camera';
import {
  Contours,
  useFaceDetector,
} from 'react-native-vision-camera-face-detector';
import {ClipOp, Skia, TileMode} from '@shopify/react-native-skia';

function App(): React.JSX.Element {
  const {hasPermission, requestPermission} = useCameraPermission();
  const [position, setPosition] = useState<CameraPosition>('back');
  const device = useCameraDevice(position);
  const format = useCameraFormat(device, [
    {
      videoResolution: Dimensions.get('window'),
    },
    {
      fps: 60,
    },
  ]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const {detectFaces} = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'none',
  });

  const blurRadius = 25;
  const blurFilter = Skia.ImageFilter.MakeBlur(
    blurRadius,
    blurRadius,
    TileMode.Repeat,
    null,
  );
  const paint = Skia.Paint();
  paint.setImageFilter(blurFilter);

  const frameProcessor = useSkiaFrameProcessor(frame => {
    'worklet';
    frame.render();

    const faces = detectFaces(frame);

    for (const face of faces) {
      if (face.contours != null) {
        // this is a foreground face, draw precise mask with edges
        const path = Skia.Path.Make();

        const necessaryContours: (keyof Contours)[] = [
          'FACE',
          'LEFT_CHEEK',
          'RIGHT_CHEEK',
        ];
        for (const key of necessaryContours) {
          const points = face.contours[key];
          points.forEach((point, index) => {
            if (index === 0) {
              // it's a starting point
              path.moveTo(point.x, point.y);
            } else {
              // it's a continuation
              path.lineTo(point.x, point.y);
            }
          });
          path.close();
        }

        frame.save();
        frame.clipPath(path, ClipOp.Intersect, true);
        frame.render(paint);
        frame.restore();
      } else {
        // this is a background face, just use a simple blur circle
        const path = Skia.Path.Make();
        console.log(`Face at ${face.bounds.x}, ${face.bounds.y}`);

        const rect = Skia.XYWHRect(
          face.bounds.x,
          face.bounds.y,
          face.bounds.width,
          face.bounds.height,
        );
        path.addOval(rect);

        frame.save();
        frame.clipPath(path, ClipOp.Intersect, true);
        frame.render(paint);
        frame.restore();
      }
    }
  }, []);

  const flipCamera = useCallback(() => {
    setPosition(pos => (pos === 'front' ? 'back' : 'front'));
  }, []);

  return (
    <View style={styles.container} onTouchEnd={flipCamera}>
      {hasPermission ? (
        device != null ? (
          <Camera
            style={styles.camera}
            isActive={true}
            device={device}
            format={format}
            frameProcessor={frameProcessor}
            fps={format?.maxFps}
            pixelFormat="rgb"
            exposure={0}
          />
        ) : (
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              Your phone does not have a {position} Camera.
            </Text>
          </View>
        )
      ) : (
        <View style={styles.textContainer}>
          <Text style={styles.text} numberOfLines={5}>
            FaceBlurApp needs Camera permission.{' '}
            <Text style={styles.link} onPress={Linking.openSettings}>
              Grant
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    maxWidth: '60%',
    fontWeight: 'bold',
    fontSize: 15,
    color: 'black',
  },
  link: {
    color: 'rgb(80, 80, 255)',
  },
});

export default App;
