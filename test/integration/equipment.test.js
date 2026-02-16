const { getAllEquipment } = require('../../src/utils/equipment');

	// Note: These tests make real API calls and require valid MX_API_KEY in .env
	// Use describe.skip to prevent running in CI pipelines
	// Run locally with: npm run test:integration

	describe('getAllEquipment', () => {
		it('should fetch all equipment from MaintainX', async () => {
			const equipment = await getAllEquipment();

			expect(Array.isArray(equipment)).toBe(true);
			expect(equipment.length).toBeGreaterThan(0);
		});

		it('should return equipment with required fields', async () => {
			const equipment = await getAllEquipment();

			expect(equipment.length).toBeGreaterThan(0);

			const firstEquipment = equipment[0];
			expect(firstEquipment).toHaveProperty('equipmentId');
			expect(firstEquipment).toHaveProperty('rimssId');
		});

		it('should have valid data types', async () => {
			const equipment = await getAllEquipment();

			expect(equipment.length).toBeGreaterThan(0);

			equipment.slice(0, 5).forEach(item => {
				expect(typeof item.equipmentId).toBe('number');
				expect(item.rimssId === null || typeof item.rimssId === 'string').toBe(true);
			});
		});

		it('should support custom field names', async () => {
			const customFieldName = 'RIMSS ID';
			const equipment = await getAllEquipment(customFieldName);

			expect(Array.isArray(equipment)).toBe(true);
			expect(equipment.length).toBeGreaterThan(0);
		});
	});

	describe('Equipment data validation', () => {
		it('should fetch equipment with and without RIMSS ID', async () => {
			const equipment = await getAllEquipment();

			const withRimssId = equipment.filter(e => e.rimssId !== null);
			const withoutRimssId = equipment.filter(e => e.rimssId === null);

			console.log(
				`📊 Equipment Summary: Total=${equipment.length}, With RIMSS ID=${withRimssId.length}, Without=${withoutRimssId.length}`
			);

			expect(equipment.length).toBeGreaterThan(0);
			// At least some equipment should exist
			expect(withRimssId.length + withoutRimssId.length).toBe(equipment.length);
		});

		it('should have consistent equipment IDs', async () => {
			const equipment = await getAllEquipment();

			const equipmentIds = equipment.map(e => e.equipmentId);
			const uniqueIds = new Set(equipmentIds);

			// All equipment IDs should be unique
			expect(equipmentIds.length).toBe(uniqueIds.size);
		});
	});

