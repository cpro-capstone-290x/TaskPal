export default {
  // 🧪 Ensure Jest runs in Node environment
  testEnvironment: "node",

  // 🧭 Look for all tests inside backend/test
  testMatch: ["**/test/**/*.test.js"],

  // 🧩 Don't transform ESM modules
  transform: {},

  // 🛠️ Fix “Cannot find module '../controllers/authController.js'” by resolving from backend root
  moduleDirectories: ["node_modules", "backend"],

  // 🕒 Increase default timeout
  testTimeout: 30000,
};
