module.exports = {
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/node_modules/'],
	collectCoverageFrom: [
		'src/**/*.js',
		'!src/index.js',
	],
};