
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

  return {
    width: Math.max(Math.min(customConfig.window?.width || DEFAULT_WIDTH, maxWidth), MIN_WIDTH),
    height: Math.max(Math.min(customConfig.window?.height || DEFAULT_HEIGHT, maxHeight), MIN_HEIGHT),
    x: customConfig.window?.x,
    y: customConfig.window?.y,
  };
}

// Test cases
function runTests() {
  const configPath = path.join(app.getPath('userData'), 'ephemeral.json');

  // Test case 1: Normal window size
  let config = { window: { width: 1024, height: 768, x: 100, y: 100, maximized: false } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  let options = getWindowOptions(configPath);
  console.log('Test case 1 - Window options:', options);
  assert.deepStrictEqual(options, { width: 1024, height: 768, x: 100, y: 100 });

  // Test case 2: Window size smaller than minimum
  config = { window: { width: 100, height: 100, x: 0, y: 0, maximized: false } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 2 - Window options:', options);
  assert.deepStrictEqual(options, { width: MIN_WIDTH, height: MIN_HEIGHT, x: 0, y: 0 });

  // Test case 3: Window size larger than screen
  config = { window: { width: 2500, height: 1500, x: 0, y: 0, maximized: false } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 3 - Window options:', options);
  assert.deepStrictEqual(options, { width: 1920, height: 1080, x: 0, y: 0 });

  // Test case 4: No config file
  fs.unlinkSync(configPath);
  options = getWindowOptions(configPath);
  console.log('Test case 4 - Window options:', options);
  assert.deepStrictEqual(options, { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, x: undefined, y: undefined });

  console.log('All tests passed!');
}

runTests();
