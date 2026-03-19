import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

import DashboardScreen from '../screens/Main/DashboardScreen';
import ScanScreen from '../screens/Main/ScanScreen';
import DirectoryScreen from '../screens/Main/DirectoryScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import ConnectScreen from '../screens/Main/ConnectScreen';
import SessionScreen from '../screens/Main/SessionScreen';
import AuditScreen from '../screens/Main/AuditScreen';
import RegisterScreen from '../screens/Onboarding/RegisterScreen';

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const ScanStack = createNativeStackNavigator();
const DirectoryStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="Session" component={SessionScreen} />
      <DashboardStack.Screen name="Connect" component={ConnectScreen} />
      <DashboardStack.Screen name="Audit" component={AuditScreen} />
      <DashboardStack.Screen name="Register" component={RegisterScreen} />
    </DashboardStack.Navigator>
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
    Dashboard: focused ? '⬛' : '⬜',
    Scan: focused ? '📷' : '📷',
    Directory: focused ? '🔍' : '🔎',
    Profile: focused ? '👤' : '👤',
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
      <Tab.Screen name="Dashboard" component={DashboardStackScreen} />
      <Tab.Screen name="Scan" component={ScanStackScreen} />
      <Tab.Screen name="Directory" component={DirectoryStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
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
    fontSize: 18,
    color: COLORS.muted,
  },
  tabIconActive: {
    color: COLORS.navy,
  },
});
