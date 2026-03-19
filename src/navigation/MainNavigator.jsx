import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';

import DashboardScreen from '../screens/Main/DashboardScreen';
import ScanScreen from '../screens/Main/ScanScreen';
import DirectoryScreen from '../screens/Main/DirectoryScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import ConnectScreen from '../screens/Main/ConnectScreen';
import SessionScreen from '../screens/Main/SessionScreen';
import AuditScreen from '../screens/Main/AuditScreen';
import RegisterScreen from '../screens/Onboarding/RegisterScreen';

const Tab = createBottomTabNavigator();
const TerminalStack = createNativeStackNavigator();
const ScanStack = createNativeStackNavigator();
const DirectoryStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TerminalStackScreen() {
  return (
    <TerminalStack.Navigator screenOptions={{ headerShown: false }}>
      <TerminalStack.Screen name="Dashboard" component={DashboardScreen} />
      <TerminalStack.Screen name="Session" component={SessionScreen} />
      <TerminalStack.Screen name="Connect" component={ConnectScreen} />
      <TerminalStack.Screen name="Audit" component={AuditScreen} />
      <TerminalStack.Screen name="Register" component={RegisterScreen} />
    </TerminalStack.Navigator>
  );
}

function ScanStackScreen() {
  return (
    <ScanStack.Navigator screenOptions={{ headerShown: false }}>
      <ScanStack.Screen name="Scanner" component={ScanScreen} />
      <ScanStack.Screen name="Connect" component={ConnectScreen} />
    </ScanStack.Navigator>
  );
}

function DirectoryStackScreen() {
  return (
    <DirectoryStack.Navigator screenOptions={{ headerShown: false }}>
      <DirectoryStack.Screen name="DirectoryList" component={DirectoryScreen} />
      <DirectoryStack.Screen name="Connect" component={ConnectScreen} />
    </DirectoryStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="MyProfile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function TabIcon({ label, focused }) {
  const icons = {
    Terminal: focused ? '■' : '□',
    'Scan Gate': focused ? '◉' : '○',
    Directory: focused ? '◆' : '◇',
    'My Pass': focused ? '●' : '○',
  };
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icons[label] || '●'}
    </Text>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.navy,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Terminal" component={TerminalStackScreen} />
      <Tab.Screen name="Scan Gate" component={ScanStackScreen} />
      <Tab.Screen name="Directory" component={DirectoryStackScreen} />
      <Tab.Screen name="My Pass" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    paddingTop: 4,
    height: 88,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabIcon: {
    fontSize: 20,
    color: COLORS.muted,
  },
  tabIconActive: {
    color: COLORS.navy,
  },
});
