module.exports = function (api) {
  api.cache(true);

  const expoPreset = [
    "babel-preset-expo",
    {
      // Transform `import.meta` for the web build.
      // Required for modern ESM deps like Zustand 5 that use import.meta.env on web.
      unstable_transformImportMeta: true,
    },
  ];

  return {
    presets: [expoPreset],
    plugins: [
      [
        "react-native-unistyles/plugin",
        {
          root: "src",
        },
      ],
    ],
  };
};
