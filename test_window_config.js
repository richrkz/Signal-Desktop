
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock Electron's app and screen modules
const app = {
  getPath: () => '/home/user/.config/Signal'
};

const screen = {
  getPrimaryDisplay: () => ({
    workAreaSize: { width: 1920, height: 1080 }
  })
};

// Constants from the main app
const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 700;
const MIN_WIDTH = 680;
const MIN_HEIGHT = 550;

function getWindowOptions(configPath) {
  let customConfig = {};
  try {
    customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('Failed to load custom config:', error);
  }

  const { width: maxWidth, height: maxHeight } = screen.getPrimaryDisplay().workAreaSize;

  const width = parseInt(customConfig.window?.width) || DEFAULT_WIDTH;
  const height = parseInt(customConfig.window?.height) || DEFAULT_HEIGHT;
  const x = parseInt(customConfig.window?.x);
  const y = parseInt(customConfig.window?.y);

  // Adjust position if window is outside visible area
  const adjustedX = x !== undefined ? Math.max(0, Math.min(x, maxWidth - width)) : undefined;
  const adjustedY = y !== undefined ? Math.max(0, Math.min(y, maxHeight - height)) : undefined;

  return {
    width: Math.max(Math.min(width, maxWidth), MIN_WIDTH),
    height: Math.max(Math.min(height, maxHeight), MIN_HEIGHT),
    x: adjustedX,
    y: adjustedY,
    maximized: customConfig.window?.maximized || false
  };
}

// Test cases
function runTests() {
  const configPath = path.join(app.getPath('userData'), 'ephemeral.json');

  // ... [previous test cases remain the same]

  // Test case 8: Window position outside visible area
  config = { window: { width: 800, height: 600, x: 2000, y: 1500, maximized: false } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 8 - Window options:', options);
  assert.deepStrictEqual(options, { width: 800, height: 600, x: 1120, y: 480, maximized: false });

  console.log('All tests passed!');
}

runTests();
