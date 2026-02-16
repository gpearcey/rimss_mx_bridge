const { getAllWholegoods } = require('./pull_rimss_wholegoods.js');

if (require.main === module) {
	getAllWholegoods()
		.then((wholegoods) => {
			console.log(`Fetched ${wholegoods.length} wholegoods.`);
		})
		.catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
}
