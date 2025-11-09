/**
 * Safe Confetti Component
 * Lightweight celebration animation using only Animated API
 * No external libraries - crash-safe
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  color: string;
  startX: number;
  animatedValue: Animated.Value;
}

export const SafeConfetti: React.FC = () => {
  const particles = useRef<Particle[]>([]);

  // Create 20 particles with random colors and positions
  if (particles.current.length === 0) {
    const colors = ['#2EAADC', '#0F7B6C', '#9F7AEA', '#E91E63', '#FFD700', '#FF6B35'];
    particles.current = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      startX: Math.random() * SCREEN_WIDTH,
      animatedValue: new Animated.Value(0),
    }));
  }

  useEffect(() => {
    // Animate all particles
    const animations = particles.current.map((particle, index) => {
      return Animated.timing(particle.animatedValue, {
        toValue: 1,
        duration: 2000 + Math.random() * 1000, // 2-3 seconds
        delay: index * 50, // Stagger effect
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle) => {
        const translateY = particle.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, SCREEN_HEIGHT],
        });

        const opacity = particle.animatedValue.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        });

        const rotate = particle.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.startX,
                backgroundColor: particle.color,
                opacity,
                transform: [{ translateY }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
