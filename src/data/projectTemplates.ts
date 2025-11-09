/**
 * Pre-configured Project Templates
 * One-click templates for common project types
 */

import { ProjectConfig } from '../components/ProjectGeneratorModal';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'web' | 'mobile' | 'game' | 'fullstack';
  color: string;
  prompt: string;
  config: Omit<ProjectConfig, 'description'>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'portfolio',
    name: 'Portfolio Website',
    description: 'Modern portfolio with animations and dark mode',
    icon: 'briefcase',
    category: 'web',
    color: '#2EAADC',
    prompt: 'Create a modern, responsive portfolio website with a hero section, about section, projects showcase with cards, skills section with icons, and contact form. Include smooth scroll animations, dark mode toggle, and a clean minimal design. Use gradients and modern UI patterns.',
    config: {
      template: 'web',
      framework: 'vite',
      styling: 'tailwind',
      typescript: true,
      tests: false,
      git: true,
    },
  },
  {
    id: 'saas-landing',
    name: 'SaaS Landing Page',
    description: 'Conversion-optimized landing page',
    icon: 'rocket',
    category: 'web',
    color: '#9F7AEA',
    prompt: 'Create a high-converting SaaS landing page with: hero section with CTA, features grid with icons, pricing table with 3 tiers, testimonials carousel, FAQ accordion, and footer with links. Use modern design with gradients, shadows, and animations on scroll.',
    config: {
      template: 'web',
      framework: 'next',
      styling: 'tailwind',
      typescript: true,
      tests: false,
      git: true,
    },
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Full-featured todo app with filters',
    icon: 'checkmark-done',
    category: 'web',
    color: '#0F7B6C',
    prompt: 'Create a complete todo application with: add/edit/delete tasks, mark as complete, filter by status (all/active/completed), local storage persistence, clean UI with animations, and responsive design. Include task counter and clear completed button.',
    config: {
      template: 'react',
      framework: 'vite',
      styling: 'css',
      typescript: true,
      tests: true,
      git: true,
    },
  },
  {
    id: 'ecommerce-product',
    name: 'E-commerce Product Page',
    description: 'Product page with cart functionality',
    icon: 'cart',
    category: 'web',
    color: '#E91E63',
    prompt: 'Create an e-commerce product page with: image gallery with thumbnails, product details with ratings, size/color selectors, quantity picker, add to cart button, related products section, and reviews section. Include smooth animations and modern e-commerce UI patterns.',
    config: {
      template: 'react',
      framework: 'next',
      styling: 'tailwind',
      typescript: true,
      tests: false,
      git: true,
    },
  },
  {
    id: 'dashboard',
    name: 'Admin Dashboard',
    description: 'Analytics dashboard with charts',
    icon: 'bar-chart',
    category: 'fullstack',
    color: '#FF6B35',
    prompt: 'Create a modern admin dashboard with: sidebar navigation, header with user profile, stats cards with icons and trends, chart components (line, bar, pie), data table with sorting/filtering, and responsive layout. Use a clean, professional design with dark mode support.',
    config: {
      template: 'fullstack',
      framework: 'next',
      styling: 'tailwind',
      typescript: true,
      tests: false,
      git: true,
    },
  },
  {
    id: 'instagram-clone',
    name: 'Instagram Clone',
    description: 'Social media app for React Native',
    icon: 'camera',
    category: 'mobile',
    color: '#C13584',
    prompt: 'Create an Instagram-like React Native app with: bottom tab navigation (Feed, Search, Add, Likes, Profile), post feed with images, like/comment buttons, profile screen with grid layout, story circles at top, and modern mobile UI. Include smooth animations and native feel.',
    config: {
      template: 'react-native',
      framework: 'expo',
      styling: 'styled-components',
      typescript: true,
      tests: false,
      git: true,
    },
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe Game',
    description: 'Classic game with AI opponent',
    icon: 'game-controller',
    category: 'game',
    color: '#FFD700',
    prompt: 'Create a tic-tac-toe game with: 3x3 grid, player vs player mode, winner detection with highlighting, score tracking, reset button, smooth animations when placing X/O, and clean game UI. Include game state management and victory celebration animation.',
    config: {
      template: 'web',
      framework: 'vite',
      styling: 'css',
      typescript: true,
      tests: true,
      git: true,
    },
  },
];

export const getTemplateById = (id: string): ProjectTemplate | undefined => {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
};

export const getTemplatesByCategory = (category: string): ProjectTemplate[] => {
  return PROJECT_TEMPLATES.filter((t) => t.category === category);
};
