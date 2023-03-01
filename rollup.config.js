import typescript from 'rollup-plugin-typescript2';
// import pkg from './package.json';
export default [
    {
        input: 'src/plugins/pulldown-infinity-scroll/index.ts', // 打包入口
        output: { // 打包出口
            name: 'reverseInfinity',
            file: 'dist/index.js', // 最终打包出来的文件路径和文件名，这里是在package.json的browser: 'dist/index.js'字段中配置的
            format: 'umd', // umd是兼容amd/cjs/iife的通用打包格式，适合浏览器
        },
        plugins: [ // 打包插件
            typescript({
                "include": ["src/plugins/pulldown-infinity-scroll/**/*.ts"],
            }), // 解析TypeScript
        ],
        // 指出哪些模块需要被视为外部引入
        external: ['@better-scroll']
    },
    // CommonJS for Node and ES module for bundlers build
    {
        input: 'src/plugins/pulldown-infinity-scroll/index.ts',
        external: ['@better-scroll'],
        plugins: [
            typescript({
                "include": ["src/plugins/pulldown-infinity-scroll/**/*.ts"],
            }), // 解析TypeScript
        ],
        output: [
            { file: 'dist/index.cjs.js', format: 'cjs', exports: 'auto' },
            { file: 'dist/index.esm.js', format: 'es', exports: 'auto' }
        ]
    }
]