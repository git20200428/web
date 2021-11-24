const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production',
    entry: './server/serverApp.js',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'release/bin/'),
        filename: 'serverApp.js'
    },
    node: {
        __dirname: true
    },
    module: {
        rules: [
            {
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [['@babel/preset-env', {
                            "targets": {
                                "node": true
                            }
                        }]]
                    }
                },
                include: path.resolve(__dirname, "./server"),
                test: /\.js$/
            }
        ]
    },
    optimization: {
        minimize: true
    },
    plugins: [
        new CopyPlugin({
                patterns: [
                    {from: "config/*.conf", to: "../"},
                    {from: "config/yang-*.json", to: "../"}
                ]
            }
        )
    ]
};
