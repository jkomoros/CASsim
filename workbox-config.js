/*eslint-env node*/

module.exports = {
	globDirectory: 'build',
	swDest: 'build/service-worker.js',
	globPatterns: [
		'manifest.json',
		'src/**/*',
	],
	skipWaiting: true,
	runtimeCaching: [
		{
			urlPattern: /\/@webcomponents\/webcomponentsjs\//,
			handler: 'StaleWhileRevalidate'
		},
		{
			urlPattern: /^https:\/\/fonts.gstatic.com\//,
			handler: 'StaleWhileRevalidate'
		}
	]
};
