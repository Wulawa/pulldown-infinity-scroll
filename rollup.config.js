import typescript from 'rollup-plugin-typescript2';
// import resolve from '@rollup/plugin-node-resolve';
import {babel,getBabelOutputPlugin} from '@rollup/plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';
// import pkg from './package.json';
export default [
    // CommonJS for Node and ES module for bundlers build
    {
        input: 'src/plugins/pulldown-infinity-scroll/index.ts',
        external: ['@better-scroll/shared-utils'],
        plugins: [
            typescript({
                "include": ["src/plugins/pulldown-infinity-scroll/**/*.ts"],
            }), // 解析TypeScript
            babel({
                exclude: 'node_modules/**',
                babelHelpers: 'bundled', // 开启体积优化
                extensions: [
                    // 默认不包含ts文件，所以需要将ts后缀加上才会处理
                    ...DEFAULT_EXTENSIONS,
                    '.ts',
                    '.tsx'
                ]
            }),
        ],
        output: [
            { file: 'dist/index.cjs.js', format: 'cjs', exports: 'auto' },
            { file: 'dist/index.esm.js', format: 'es', exports: 'auto' },
            { // 打包出口
                name: 'reverseInfinity',
                file: 'dist/index.min.js', // 最终打包出来的文件路径和文件名，这里是在package.json的browser: 'dist/index.js'字段中配置的
                format: 'umd', // umd是兼容amd/cjs/iife的通用打包格式，适合浏览器
                // plugins: [getBabelOutputPlugin({ presets: ['@babel/preset-env', "@babel/preset-typescript"] })]
            },
        ]
    }
]