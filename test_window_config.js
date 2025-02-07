
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

  return {
    width: Math.max(Math.min(width, maxWidth), MIN_WIDTH),
    height: Math.max(Math.min(height, maxHeight), MIN_HEIGHT),
    x: isNaN(x) ? undefined : x,
    y: isNaN(y) ? undefined : y,
    maximized: customConfig.window?.maximized || false
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
  assert.deepStrictEqual(options, { width: 1024, height: 768, x: 100, y: 100, maximized: false });

  // Test case 2: Window size smaller than minimum
  config = { window: { width: 100, height: 100, x: 0, y: 0, maximized: false } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 2 - Window options:', options);
  assert.deepStrictEqual(options, { width: MIN_WIDTH, height: MIN_HEIGHT, x: 0, y: 0, maximized: false });

  // Test case 3: Window size larger than screen
  config = { window: { width: 2500, height: 1500, x: 0, y: 0, maximized: false } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 3 - Window options:', options);
  assert.deepStrictEqual(options, { width: 1920, height: 1080, x: 0, y: 0, maximized: false });

  // Test case 4: No config file
  fs.unlinkSync(configPath);
  options = getWindowOptions(configPath);
  console.log('Test case 4 - Window options:', options);
  assert.deepStrictEqual(options, { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, x: undefined, y: undefined, maximized: false });

  // Test case 5: Maximized window
  config = { window: { width: 1024, height: 768, x: 100, y: 100, maximized: true } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 5 - Window options:', options);
  assert.deepStrictEqual(options, { width: 1024, height: 768, x: 100, y: 100, maximized: true });

  // Test case 6: Partial config (only width and height)
  config = { window: { width: 1200, height: 900 } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 6 - Window options:', options);
  assert.deepStrictEqual(options, { width: 1200, height: 900, x: undefined, y: undefined, maximized: false });

  // Test case 7: Invalid config (non-numeric values)
  config = { window: { width: 'invalid', height: 'invalid', x: 'invalid', y: 'invalid' } };
  fs.writeFileSync(configPath, JSON.stringify(config));
  options = getWindowOptions(configPath);
  console.log('Test case 7 - Window options:', options);
  assert.deepStrictEqual(options, { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, x: undefined, y: undefined, maximized: false });

  console.log('All tests passed!');
}

runTests();
