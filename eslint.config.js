import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
	// Base recommended config
	js.configs.recommended,

	// Global ignores (must be a separate config object with only ignores)
	{
		ignores: [
			'build/**',
			'**/*.GENERATED.*',
			'dist/**',
			'node_modules/**',
			'src/**/*.js',
			'src/**/*.d.ts',
			'src/**/*.map',
			'tools/**/*.js',
			'tools/**/*.d.ts',
			'tools/**/*.map',
			'screenshots/**'
		]
	},

	// Main configuration
	{
		files: ['**/*.ts', '**/*.js'],

		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			},
			globals: {
				...globals.browser,
				...globals.es2021,
				...globals.mocha,
				...globals.node
			}
		},

		plugins: {
			'@typescript-eslint': typescriptEslint
		},

		rules: {
			// TypeScript recommended rules
			...typescriptEslint.configs.recommended.rules,

			// Custom rules from .eslintrc.json
			'indent': ['error', 'tab'],
			'linebreak-style': ['error', 'unix'],
			'semi': ['error', 'always'],
			'no-console': 'off',
			'no-case-declarations': 'off',
			'no-fallthrough': 'off',
			'prefer-const': ['error', {
				destructuring: 'all'
			}],
			// Allow unused vars that start with underscore
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_'
			}],
			// Disable base no-redeclare for TypeScript overloads
			'no-redeclare': 'off',
			'@typescript-eslint/no-redeclare': 'error'
		}
	}
];
