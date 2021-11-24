const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
    context: path.resolve(__dirname, "client"),
    entry: {
        index: "./jsx/index.jsx"
    },
    devtool: "eval-source-map",
    output: {
        filename: "js/[name].js",
        chunkFilename: "js/[name].js",
        publicPath: "/static/",
        path: path.resolve(__dirname, "static")
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                include: path.resolve(__dirname, "./client"),
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                            "@babel/preset-react"
                        ],
                        plugins: [
                            "@babel/plugin-proposal-class-properties"
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                include: path.resolve(__dirname, "./client"),
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.(png|jpg|gif)$/,
                include: path.resolve(__dirname, "./client/img"),
                type: "asset/resource",
                generator: {
                    filename: "img/[name][ext][query]"
                }
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                include: path.resolve(__dirname, "./client/font"),
                type: "asset/resource",
                generator: {
                    filename: "font/[name][ext][query]"
                }
            }
        ]
    },
    resolve: {
        extensions: [".js", ".jsx"]
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: false
        }),
        new HtmlWebpackPlugin({
            template: "./index.html"
        }),
        new MiniCssExtractPlugin({
            filename: "css/main.css"
        }),
        new CopyPlugin({
                patterns: [
                    {from: "css/theme/*.css"},
                    {from: "../config/*.json", to: "config/"}
                ]
            }
        )
    ],
    externals: {
        canvg: "canvg",
        html2canvas: "html2canvas",
        dompurify: "dompurify"
    },
    optimization: {
        splitChunks: {
            chunks: "all"
        }
    },
    // stats: "minimal",
    mode: "development",
    watch: true
};