module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-iconify/plugin',
        {
          icons: [
            'solar:home-smile-bold',
            'solar:home-smile-linear',
            'solar:heart-bold',
            'solar:heart-linear',
            'solar:bell-bold',
            'solar:bell-linear',
            'solar:map-bold',
            'solar:map-linear',
            'solar:user-bold',
            'solar:user-linear',
          ],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
