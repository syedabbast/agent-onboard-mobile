import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import * as haptics from '../../lib/haptics';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualLink, setManualLink] = useState('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanLineAnim]);

  function extractToken(data) {
    if (!data) return null;
    const match = data.match(/\/connect\/([a-zA-Z0-9]+)/);
    if (match) return match[1];
    if (/^[a-zA-Z0-9]{10,}$/.test(data)) return data;
    return null;
  }

  function handleBarCodeScanned(result) {
    if (scanned) return;
    setScanned(true);

    const token = extractToken(result.data);
    if (token) {
      haptics.success();
      navigation.navigate('Connect', { token });
    } else {
      haptics.error();
      Alert.alert(
        'Invalid QR',
        'This QR code does not contain a valid boarding pass.',
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );
    }
  }

  function handleManualSubmit() {
    const token = extractToken(manualLink.trim());
    if (token) {
      haptics.success();
      navigation.navigate('Connect', { token });
    } else {
      haptics.error();
      Alert.alert('Invalid Link', 'Please enter a valid connection link or token.');
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Requesting camera access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permDesc}>
            Agent OnBoard needs camera access to scan boarding pass QR codes at
            the gate.
          </Text>
          <TouchableOpacity
            style={styles.permBtn}
            onPress={() => {
              haptics.medium();
              requestPermission();
            }}
          >
            <Text style={styles.permBtnText}>Grant Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setShowManual(true)}
          >
            <Text style={styles.manualBtnText}>Enter Link Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showManual) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Enter Connection Link</Text>
          <Text style={styles.manualDesc}>
            Paste the boarding pass link or share token below.
          </Text>
          <TextInput
            style={styles.manualInput}
            value={manualLink}
            onChangeText={setManualLink}
            placeholder="https://agent-onboard.netlify.app/connect/abc123..."
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleManualSubmit}
          >
            <Text style={styles.submitBtnText}>Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backToScan}
            onPress={() => setShowManual(false)}
          >
            <Text style={styles.backToScanText}>Back to Scanner</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <View style={styles.scanContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.overlayTop}>
          <Text style={styles.scanTitle}>SCAN GATE</Text>
          <Text style={styles.scanDesc}>
            Point camera at a boarding pass QR code
          </Text>
        </View>

        <View style={styles.viewfinder}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineTranslate }] },
            ]}
          />
        </View>

        <View style={styles.overlayBottom}>
          {scanned ? (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => {
                haptics.light();
                setScanned(false);
              }}
            >
              <Text style={styles.rescanBtnText}>Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.manualEntryBtn}
              onPress={() => {
                haptics.light();
                setShowManual(true);
              }}
            >
              <Text style={styles.manualEntryText}>Enter Link Manually</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;
const VIEWFINDER_SIZE = 240;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    ...FONTS.body,
    color: COLORS.white,
  },
  permTitle: {
    ...FONTS.title,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  permDesc: {
    ...FONTS.body,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  permBtn: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  permBtnText: {
    ...FONTS.heading,
    color: COLORS.navy,
  },
  manualBtn: {
    padding: SPACING.sm,
  },
  manualBtnText: {
    ...FONTS.body,
    color: COLORS.amber,
    fontSize: 14,
  },
  scanContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayTop: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    backgroundColor: 'rgba(10,22,40,0.7)',
    alignSelf: 'stretch',
    paddingBottom: SPACING.lg,
  },
  scanTitle: {
    ...FONTS.label,
    color: COLORS.amber,
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  scanDesc: {
    ...FONTS.body,
    color: COLORS.white,
    fontSize: 14,
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: COLORS.amber,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: COLORS.amber,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: COLORS.amber,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: COLORS.amber,
  },
  scanLine: {
    position: 'absolute',
    left: CORNER_WIDTH,
    right: CORNER_WIDTH,
    height: 2,
    backgroundColor: COLORS.amber,
    opacity: 0.7,
  },
  overlayBottom: {
    backgroundColor: 'rgba(10,22,40,0.7)',
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  rescanBtn: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
  },
  rescanBtnText: {
    ...FONTS.heading,
    color: COLORS.navy,
    fontSize: 14,
  },
  manualEntryBtn: {
    padding: SPACING.sm,
  },
  manualEntryText: {
    ...FONTS.body,
    color: COLORS.amber,
    fontSize: 14,
  },
  manualContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  manualTitle: {
    ...FONTS.title,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  manualDesc: {
    ...FONTS.body,
    color: COLORS.muted,
    marginBottom: SPACING.lg,
  },
  manualInput: {
    ...FONTS.body,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.md,
  },
  submitBtn: {
    backgroundColor: COLORS.amber,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  submitBtnText: {
    ...FONTS.heading,
    color: COLORS.navy,
  },
  backToScan: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  backToScanText: {
    ...FONTS.body,
    color: COLORS.amber,
    fontSize: 14,
  },
});
