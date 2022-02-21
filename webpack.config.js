
const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        background: './src/background',
        content: './src/content'
    },
    output: {
        filename: 'lain-[name].js',
        path: path.resolve(__dirname, 'build')
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    optimization: {
        minimize: false,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'manifest.json' },
            ]
        })
    ]
};
