const fs = require('fs');
const path = require('path');
const PACKAGE = require('./package.json');
const webpack = require('webpack');

function p(f) {
    return path.join(__dirname, f);
}

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    devtool: 'cheap-module-source-map',
    // devtool: 'inline-module-source-map',
    entry: {
        main: p('./src/content_script.ts')
    },
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src')
        },
        extensions: ['.ts', '.tsx', '.js', '.css', '.sass', '.scss']
    },
    output: {
        path: p('./dist'),
        filename: './github-events.user.js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
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
    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: (() => {
                var filename = p('./src/etc/banner.js');
                content = fs.readFileSync(filename, 'utf8').toString();
                content = content.replace(/@@title/g, PACKAGE.title);
                content = content.replace(/@@version/g, PACKAGE.version)
                content = content.replace(/@@description/g, PACKAGE.description);
                content = content.replace(/@@author/g, PACKAGE.author);
                content = content.replace(/@@copyright/g, PACKAGE.copyright);
                return content;
            })()
        })
    ]
}