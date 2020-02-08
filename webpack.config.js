const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

function p(f) {
    return path.join(__dirname, f);
}

function f(f) {
    return fs.readFileSync(p(f), 'utf8').toString();
}

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    devtool: 'inline-source-map',
    entry: {
        main: p('./src/main.ts')
    },
    output: {
        path: p('./dist'),
        filename: './github-events.user.js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader'],
                exclude: /node_modules/
            },
            {
                test: /\.html$/,
                use: 'text-loader',
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.css', '.sass', '.scss']
    },
    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: f('./src/etc/banner.js')
        })
    ]
}