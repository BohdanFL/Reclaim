import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';

export const DigitalDetoxIcon = () => (
  <Svg width="160" height="160" viewBox="0 0 160 160">
    <Rect width="160" height="160" fill="#E8F5E9"/>
    <G transform="translate(40, 40)">
      <Path d="M40 0C17.909 0 0 17.909 0 40s17.909 40 40 40 40-17.909 40-40S62.091 0 40 0z" fill="#4CAF50" opacity="0.2"/>
      <Path d="M40 10c-16.569 0-30 13.431-30 30 0 16.569 13.431 30 30 30 16.569 0 30-13.431 30-30 0-16.569-13.431-30-30-30zm0 5c13.807 0 25 11.193 25 25s-11.193 25-25 25-25-11.193-25-25 11.193-25 25-25z" fill="#4CAF50"/>
      <Rect x="20" y="35" width="40" height="10" rx="2" fill="#4CAF50"/>
    </G>
  </Svg>
);

export const AppUsageLimitIcon = () => (
  <Svg width="160" height="160" viewBox="0 0 160 160">
    <Rect width="160" height="160" fill="#FCE4EC"/>
    <G transform="translate(40, 40)">
      <Path d="M40 0C17.909 0 0 17.909 0 40s17.909 40 40 40 40-17.909 40-40S62.091 0 40 0z" fill="#E91E63" opacity="0.2"/>
      <Path d="M55 20H25c-2.761 0-5 2.239-5 5v30c0 2.761 2.239 5 5 5h30c2.761 0 5-2.239 5-5V25c0-2.761-2.239-5-5-5z" fill="#E91E63"/>
      <Path d="M40 30c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 15c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" fill="white"/>
    </G>
  </Svg>
);

export const FocusModeIcon = () => (
  <Svg width="160" height="160" viewBox="0 0 160 160">
    <Rect width="160" height="160" fill="#E3F2FD"/>
    <G transform="translate(40, 40)">
      <Path d="M40 0C17.909 0 0 17.909 0 40s17.909 40 40 40 40-17.909 40-40S62.091 0 40 0z" fill="#2196F3" opacity="0.2"/>
      <Path d="M40 15c-13.807 0-25 11.193-25 25s11.193 25 25 25 25-11.193 25-25-11.193-25-25-25zm0 45c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z" fill="#2196F3"/>
      <Path d="M41 25v14.5l8.5 8.5-3.5 3.5-10-10V25h5z" fill="#2196F3"/>
    </G>
  </Svg>
); 