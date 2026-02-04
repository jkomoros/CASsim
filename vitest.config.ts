import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'happy-dom',
		include: ['test/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			exclude: [
				'**/*.GENERATED.*',
				'build/**',
				'tools/**',
				'node_modules/**',
				'test/**'
			]
		}
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
	}
});
