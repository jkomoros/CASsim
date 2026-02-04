import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import summary from 'rollup-plugin-summary';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

// Handle both CommonJS and ES module exports
const minifyHTMLPlugin = minifyHTML.default || minifyHTML;
const copyPlugin = copy.default || copy;
const summaryPlugin = summary.default || summary;

export default {
	input: 'src/components/my-app.js',
	output: {
		dir: 'build/src/components',
		format: 'es',
	},
	plugins: [
		minifyHTMLPlugin(),
		dynamicImportVars(),
		copyPlugin({
			targets: [
				{ src: 'data', dest: 'build' },
				{ src: 'images', dest: 'build' },
				{ src: 'fonts', dest: 'build' },
				{ src: 'manifest.json', dest: 'build' },
				{ src: 'index.html', dest: 'build' },
			],
		}),
		resolve(),
		terser({
			format: {
				comments: false,
			}
		}),
		commonjs(),
		summaryPlugin(),
	],
	preserveEntrySignatures: 'strict',
};