require('@testing-library/jest-dom')

// Mock Node.js globals for Jest environment
global.setImmediate = global.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args))
global.clearImmediate = global.clearImmediate || clearTimeout

// Mock Web APIs for Next.js server components testing
global.Request = global.Request || class MockRequest {}
global.Response = global.Response || class MockResponse {}
global.Headers = global.Headers || class MockHeaders {}
global.fetch = global.fetch || jest.fn()

// Mock TransformStream for Playwright compatibility  
global.TransformStream = global.TransformStream || class MockTransformStream {}