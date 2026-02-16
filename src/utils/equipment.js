require("dotenv").config();

const getMxApiUrl = (endpoint) => {
	return `https://api.getmaintainx.com/v1/${endpoint}`;
};

const getMxHeaders = () => {
	return {
		headers: {
			Authorization: `Bearer ${process.env.MX_API_KEY}`,
			'Content-Type': 'application/json',
		},
	};
};

/**
 * Fetch all equipment/assets from MaintainX
 * @param {string} rimssCustomFieldName - The name of the custom field in MaintainX that stores the RIMSS ID
 * @returns {Promise<Array>} Array of equipment with id and rimssId
 */
const getAllEquipment = async (rimssCustomFieldName = 'RIMSS ID') => {
	const equipment = [];
	let cursor = null;
	const limit = 100; // Max allowed by API

	try {
		while (true) {
			let url = getMxApiUrl('assets');
			const params = new URLSearchParams({
				limit: limit.toString(),
				expand: 'extra_fields',
			});

			if (cursor) {
				params.append('cursor', cursor);
			}

			url += `?${params.toString()}`;

			console.log(`Fetching equipment page from: ${url}`);

			const response = await fetch(url, getMxHeaders());

			if (!response.ok) {
				const body = await response.text();
				throw new Error(`MaintainX API request failed (${response.status}): ${body}`);
			}

			const data = await response.json();

			if (!data.assets || !Array.isArray(data.assets)) {
				throw new Error('Invalid response format: assets array not found');
			}

			// Extract equipment ID and RIMSS ID from each asset
			for (const asset of data.assets) {
				const rimssId = asset.extraFields && asset.extraFields[rimssCustomFieldName]
					? asset.extraFields[rimssCustomFieldName]
					: null;

				equipment.push({
					equipmentId: asset.id,
					rimssId: rimssId,
					name: asset.name,
					description: asset.description || null,
				});

				console.log(
					`Found equipment: ID=${asset.id}, Name=${asset.name}, RIMSS ID=${rimssId || 'N/A'}`
				);
			}

			// Check if there are more pages
			if (!data.nextCursor) {
				break;
			}

			cursor = data.nextCursor;
		}

		console.log(`✓ Successfully fetched ${equipment.length} total equipment records`);
		return equipment;
	} catch (error) {
		console.error('Error fetching equipment from MaintainX:', error);
		throw error;
	}
};

module.exports = {
	getAllEquipment,
};
