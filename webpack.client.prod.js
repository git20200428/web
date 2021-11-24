const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
    context: path.resolve(__dirname, "client"),
    entry: {
        index: "./jsx/index.jsx"
    },
    output: {
        filename: "js/[name].js",
        chunkFilename: "js/[name].js",
        publicPath: "/static/",
        path: path.resolve(__dirname, "release/static")
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
                    filename: "img/[hash:4][ext][query]"
                }
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                include: path.resolve(__dirname, "./client/font"),
                type: "asset/resource",
                generator: {
                    filename: "font/[hash:4][ext][query]"
                }
            }
        ]
    },
    resolve: {
        extensions: [".js", ".jsx"]
    },
    plugins: [
        new CleanWebpackPlugin(),
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
        ),
        new CompressionPlugin({
            test: /\.js$|\.css$|\.html$|\.json$|\.png$/
        })
    ],
    optimization: {
        splitChunks: {
            chunks: "all"
        },
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin()
        ],
        runtimeChunk: "single"
    },
    externals: {
        canvg: "canvg",
        html2canvas: "html2canvas",
        dompurify: "dompurify"
    },
    stats: "minimal",
    mode: "production"
};