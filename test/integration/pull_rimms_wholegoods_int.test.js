const { fetchWholegoodsPage, getAllWholegoods, buildAuthHeader } = require('../../src/pull_rimss_wholegoods');

describe('Integration Tests for WNS Wholegoods API', () => {
	// Note: These tests make real API calls and require valid credentials in .env
	// Run locally with: npm run test:integration
	
	const testParams = {
		APIName: "TestDameonService",
		LocationID: "3",
		CreatedDate: "01/09/2000",
		UpdatedDate: "1/14/2000",
	};

	const testBaseUrl = "http://192.168.45.10/WNSAPI/";

	const requiredFields = [
		'systemID', 'inactive', 'stockNumber', 'company', 'locationId',
		'owningLocation', 'location', 'make', 'model', 'description',
		'serialNumber', 'type', 'salesStatus', 'taxStatus', 'fleetNumber',
		'newUsed', 'category', 'group', 'class', 'miles', 'hours',
		'orderDate', 'arrivalDate', 'inServiceDate', 'soldDate', 'dueDate',
		'owningCustomer', 'billingCustomer', 'engine', 'cylinders', 'horsePower',
		'displacement', 'fuelDelivery', 'compressionRatio', 'torque', 'fuelType',
		'transmission', 'gearRatio', 'driveType', 'rearPTORPM', 'rearPTOHP',
		'midPTORPM', 'midPTOHP', 'numberOfRemotes', 'length', 'width',
		'height', 'dryWeight', 'wetWeight', 'wheelBase', 'rops',
		'hitchCategory', 'hitchLiftCapacity', 'hitchLiftCapacityAt24',
		'frontTires', 'rearTires', 'brakes', 'wgUserDefinedField1',
		'wgUserDefinedField2', 'wgUserDefinedField3', 'wgUserDefinedField4',
		'wgUserDefinedField5', 'wgUserDefinedField6', 'wgUserDefinedField7',
		'wgUserDefinedField8', 'wgUserDefinedField9', 'wgUserDefinedField10',
		'wgUserDefinedField11', 'wgUserDefinedField12', 'wgUserDefinedField13',
		'wgUserDefinedField14', 'wgUserDefinedField15', 'wholegoodCustomField1',
		'wholegoodCustomField2', 'wholegoodCustomField3', 'wholegoodCustomField4',
		'wholegoodCustomField5', 'wholegoodCustomField6', 'wholegoodCustomField7',
		'wholegoodCustomField8', 'wholegoodCustomField9', 'wholegoodCustomField10',
		'wholegoodCustomField11', 'wholegoodCustomField12', 'wholegoodCustomField13',
		'wholegoodCustomField14', 'wholegoodCustomField15', 'wholegoodCustomField16',
		'wholegoodCustomField17', 'wholegoodCustomField18', 'wholegoodCustomField19',
		'wholegoodCustomField20', 'costTotal', 'liabilityAmount', 'msrp',
		'askingPrice', 'mfgCost', 'estimatedPDI', 'minSellingPrice',
		'inventoryAccount', 'liabilityAccount', 'revenueAccount', 'cogsAccount',
		'onOrder', 'year', 'createdDate', 'updatedDate', 'costDetailDocuments',
		'liabilityDetailDocuments', 'workInProcessDetailDocuments'
	];

	describe('fetchWholegoodsPage', () => {
		it('should fetch wholegoods and not exceed the specified limit', async () => {
			const limit = 10;
			const offset = 0;
			const authHeader = buildAuthHeader();
			
			const data = await fetchWholegoodsPage({
				baseUrl: testBaseUrl,
				params: testParams,
				limit,
				offset,
				authHeader,
			});

			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeLessThanOrEqual(limit);
		});

		it('should return wholegoods with all required fields', async () => {
			const limit = 5;
			const offset = 0;
			const authHeader = buildAuthHeader();
			
			const data = await fetchWholegoodsPage({
				baseUrl: testBaseUrl,
				params: testParams,
				limit,
				offset,
				authHeader,
			});

			expect(data.length).toBeGreaterThan(0);
			
			const firstWholegood = data[0];
			requiredFields.forEach(field => {
				expect(firstWholegood).toHaveProperty(field);
			});
		});

		it('should respect the offset parameter and return different data', async () => {
			const limit = 5;
			const offset1 = 0;
			const offset2 = 5;
			const authHeader = buildAuthHeader();
			
			const page1 = await fetchWholegoodsPage({
				baseUrl: testBaseUrl,
				params: testParams,
				limit,
				offset: offset1,
				authHeader,
			});

			const page2 = await fetchWholegoodsPage({
				baseUrl: testBaseUrl,
				params: testParams,
				limit,
				offset: offset2,
				authHeader,
			});

			// Both pages should have data
			expect(page1.length).toBeGreaterThan(0);
			expect(page2.length).toBeGreaterThan(0);
			
			// First items should be different (offset worked)
			expect(page1[0].systemID).not.toBe(page2[0].systemID);
		});

		it('should return valid wholegoods data with expected structure', async () => {
			const authHeader = buildAuthHeader();
			
			const data = await fetchWholegoodsPage({
				baseUrl: testBaseUrl,
				params: testParams,
				limit: 1,
				offset: 0,
				authHeader,
			});

			expect(data.length).toBeGreaterThan(0);
			
			const wholegood = data[0];
			
			// Validate data types for key fields
			expect(typeof wholegood.systemID).toBe('number');
			expect(typeof wholegood.inactive).toBe('boolean');
			expect(typeof wholegood.stockNumber).toBe('string');
			expect(typeof wholegood.company).toBe('string');
			expect(typeof wholegood.locationId).toBe('number');
			expect(Array.isArray(wholegood.costDetailDocuments)).toBe(true);
			expect(Array.isArray(wholegood.liabilityDetailDocuments)).toBe(true);
			expect(Array.isArray(wholegood.workInProcessDetailDocuments)).toBe(true);
		});
	});

	describe('getAllWholegoods', () => {
		it('should fetch all wholegoods data', async () => {
			const data = await getAllWholegoods({
				params: testParams,
				limit: 10,
				maxPages: 2, // Limit to 2 pages for integration test speed
			});

			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeGreaterThan(0);
		});

		it('should return wholegoods with all required fields', async () => {
			const data = await getAllWholegoods({
				params: testParams,
				limit: 10,
				maxPages: 1,
			});

			expect(data.length).toBeGreaterThan(0);
			
			const firstWholegood = data[0];
			requiredFields.forEach(field => {
				expect(firstWholegood).toHaveProperty(field);
			});
		});

		it('should respect maxPages parameter', async () => {
			const limit = 5;
			const maxPages = 2;
			
			const data = await getAllWholegoods({
				params: testParams,
				limit,
				maxPages,
			});

			// With a limit of 5 and maxPages of 2, we should have at most 10 items
			expect(data.length).toBeLessThanOrEqual(limit * maxPages);
		});

		it('should return consistently unique wholegoods across multiple pages', async () => {
			const data = await getAllWholegoods({
				params: testParams,
				limit: 5,
				maxPages: 2,
			});

			if (data.length > 1) {
				// Check that all systemIDs are unique (no duplicates across pages)
				const systemIds = data.map(w => w.systemID);
				const uniqueSystemIds = new Set(systemIds);
				expect(uniqueSystemIds.size).toBe(systemIds.length);
			}
		});

		it('should validate data structure across all returned wholegoods', async () => {
			const data = await getAllWholegoods({
				params: testParams,
				limit: 5,
				maxPages: 1,
			});

			expect(data.length).toBeGreaterThan(0);
			
			data.forEach(wholegood => {
				// Validate key fields exist and have expected types
				expect(typeof wholegood.systemID).toBe('number');
				expect(typeof wholegood.inactive).toBe('boolean');
				expect(typeof wholegood.stockNumber).toBe('string');
				expect(typeof wholegood.company).toBe('string');
				expect(Array.isArray(wholegood.costDetailDocuments)).toBe(true);
			});
		});
	});
});
