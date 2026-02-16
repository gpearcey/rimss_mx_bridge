const normalizeId = (value) => {
	if (value === null || value === undefined) {
		return null;
	}

	const normalized = String(value).trim();
	return normalized.length ? normalized : null;
};

const findEquipmentMatch = (equipmentList, wholegood) => {
	const wholegoodId = normalizeId(wholegood.systemID);
	if (!wholegoodId) {
		return { equipment: null, index: -1 };
	}

	for (let i = 0; i < equipmentList.length; i += 1) {
		const equipment = equipmentList[i];
		const equipmentRimssId = normalizeId(equipment.rimssId);

		if (equipmentRimssId && equipmentRimssId === wholegoodId) {
			return { equipment, index: i };
		}
	}

	return { equipment: null, index: -1 };
};

const syncWholegoodsToEquipment = async ({
	wholegoods,
	equipmentList,
	updateEquipment,
	createEquipment,
}) => {
	if (!Array.isArray(wholegoods)) {
		throw new Error('wholegoods must be an array');
	}

	if (!Array.isArray(equipmentList)) {
		throw new Error('equipmentList must be an array');
	}

	if (typeof updateEquipment !== 'function') {
		throw new Error('updateEquipment must be a function');
	}

	if (typeof createEquipment !== 'function') {
		throw new Error('createEquipment must be a function');
	}

	const results = {
		updated: 0,
		created: 0,
		remainingEquipment: equipmentList,
	};

	for (const wholegood of wholegoods) {
		const match = findEquipmentMatch(results.remainingEquipment, wholegood);

		if (match.equipment) {
			await updateEquipment(wholegood, match.equipment);
			results.updated += 1;

			// Remove matched equipment from the list to track leftovers
			results.remainingEquipment.splice(match.index, 1);
		} else {
			await createEquipment(wholegood);
			results.created += 1;
		}
	}

	return results;
};

module.exports = {
	syncWholegoodsToEquipment,
};
