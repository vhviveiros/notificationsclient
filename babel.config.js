module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['module:@react-native/babel-preset'],
        plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            ['@babel/plugin-proposal-private-methods', { loose: true }],
            ['@babel/plugin-transform-flow-strip-types'],
            ['@babel/plugin-transform-class-static-block'],
            'babel-plugin-transform-typescript-metadata',
        ],
    };
};
