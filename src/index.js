const { getAllWholegoods } = require('./pull_rimss_wholegoods.js');
const { getAllEquipment } = require('./utils/pull_mx_equipment.js');

if (require.main === module) {
	getAllWholegoods()
		.then((wholegoods) => {
			console.log(`Fetched ${wholegoods.length} wholegoods.`);
		})
		.catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});
	
	getAllEquipment()
		.then((equipment) => {
			console.log(`Fetched ${equipment.length} equipment records.`);
		})
		.catch((error) => {
			console.error(error);
			process.exitCode = 1;
		});

	
}
