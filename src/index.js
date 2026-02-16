const { getAllWholegoods } = require('./utils/pull_rimss_wholegoods.js');
const { getAllEquipment } = require('./utils/pull_mx_equipment.js');
const { syncWholegoodsToEquipment } = require('./utils/match_wholegoods_with_equipment.js');
const {updateEquipment, createEquipment} = require('./utils/edit_equipment.js');

if (require.main === module) {
	(async () => {
		try {
			const wholegoods = await getAllWholegoods();
			console.log(`Fetched wholegoods:`, wholegoods);
			console.log(`Is array?`, Array.isArray(wholegoods));
			console.log(`Type:`, typeof wholegoods);
			console.log(`Fetched ${wholegoods?.length} wholegoods.`);

			const equipment = await getAllEquipment();
			console.log(`Fetched equipment:`, equipment);
			console.log(`Is array?`, Array.isArray(equipment));
			console.log(`Fetched ${equipment?.length} equipment records.`);

			const results = await syncWholegoodsToEquipment({
				wholegoods,
				equipmentList: equipment,
				updateEquipment,
				createEquipment,
			});
			console.log('Sync results:', results);
		} catch (error) {
			console.error(error);
			process.exitCode = 1;
		}
	})();
}
