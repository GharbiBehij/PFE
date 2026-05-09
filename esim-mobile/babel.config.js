module.exports = function (api) {
  // Cache per NODE_ENV so test and production configs are cached separately.
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = api.env('test');
  return {
    presets: [
      // Disable reanimated babel plugin in tests: it requires react-native-worklets
      // native code that cannot run in a Node/Jest environment.
      ['babel-preset-expo', { reanimated: false }],
      // Disable nativewind in tests: its babel transform wraps all createElement
      // calls with _ReactNativeCSSInterop, which jest.mock() factories reject as
      // an out-of-scope variable reference.
      ...(!isTest ? ['nativewind/babel'] : []),
    ],
  };
};
