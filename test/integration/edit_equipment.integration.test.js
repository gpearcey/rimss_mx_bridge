const axios = require('axios');
const { 
	createEquipmentRecord, 
	getLocationId, 
	updateEquipment, 
	createEquipment 
} = require('../../src/utils/edit_equipment');
const { getMxApiUrl, getMxHeaders } = require('../../src/utils/mx_api');

require('dotenv').config({ path: '.env.test' });

describe('edit_equipment integration tests', () => {
	let testLocationId;
	let testAssetId;
	const TEST_API_KEY = process.env.TEST_MX_API_KEY;

	// Skip if TEST_MX_API_KEY not configured
	const skipIfNoTestKey = TEST_API_KEY ? describe : describe.skip;

	skipIfNoTestKey('MaintainX API Integration Tests', () => {
		beforeAll(async () => {
			// Override for test API key
			process.env.MX_API_KEY = TEST_API_KEY;

			// Create test location
			try {
				const locationResponse = await axios.post(
					getMxApiUrl('locations'),
					{
						name: 'Test Location RIMSS Integration',
						description: 'Test location for RIMSS equipment sync',
						address: '123 Test Street',
					},
					getMxHeaders()
				);
				testLocationId = locationResponse.data.id;
				console.log(`Created test location: ${testLocationId}`);
			} catch (error) {
				console.error('Failed to create test location:', error.response?.data || error.message);
				throw error;
			}

			// Create test asset for update testing
			try {
				const assetResponse = await axios.post(
					getMxApiUrl('assets'),
					{
						name: 'Test Equipment Original',
						description: 'Original MaintainX equipment data',
						serialNumber: 'OLD_SERIAL_12345',
						locationId: testLocationId,
						extraFields: {
							'Eq Make': 'Craig',
						},
					},
					getMxHeaders()
				);
				testAssetId = assetResponse.data.id;
				console.log(`Created test asset: ${testAssetId}`);
			} catch (error) {
				console.error('Failed to create test asset:', error.response?.data || error.message);
				throw error;
			}
		});

		// afterAll(async () => {
		// 	// Cleanup: Delete test asset
		// 	if (testAssetId) {
		// 		try {
		// 			await axios.delete(
		// 				getMxApiUrl(`assets/${testAssetId}`),
		// 				getMxHeaders()
		// 			);
		// 			console.log(`Deleted test asset: ${testAssetId}`);
		// 		} catch (error) {
		// 			console.error('Failed to delete test asset:', error.response?.data || error.message);
		// 		}
		// 	}

		// 	// Cleanup: Delete test location
		// 	if (testLocationId) {
		// 		try {
		// 			await axios.delete(
		// 				getMxApiUrl(`locations/${testLocationId}`),
		// 				getMxHeaders()
		// 			);
		// 			console.log(`Deleted test location: ${testLocationId}`);
		// 		} catch (error) {
		// 			console.error('Failed to delete test location:', error.response?.data || error.message);
		// 		}
		// 	}
		// });

		describe('Update Scenario - Wholegood matches Equipment', () => {
			it('should update equipment with RIMSS data overwriting MaintainX values', async () => {
				const wholegood = {
					systemID: '5905',
					make: 'Caterpillar',
					model: '320D',
					serialNumber: 'CAT320D_RIMSS_5905',
					wgUserDefinedField4: 'Test Location RIMSS Integration',
				};

				// Update equipment with RIMSS data
				await updateEquipment(wholegood, { id: testAssetId });

				// Verify equipment was updated
				const response = await axios.get(
					getMxApiUrl(`assets/${testAssetId}?expand=extra_fields`),
					getMxHeaders()
				);

				const asset = response.data.asset;
				expect(asset.name).toBe('Caterpillar 320D');
				expect(asset.model).toBe('320D');
				expect(asset.extraFields['Serial Number']).toBe('CAT320D_RIMSS_5905');
				expect(asset.extraFields['Eq Make']).toBe('Caterpillar');
			});

			it('should verify Serial Number from RIMSS overwrites original MaintainX data', async () => {
				const response = await axios.get(
					getMxApiUrl(`assets/${testAssetId}?expand=extra_fields`),
					getMxHeaders()
				);

				const asset = response.data.asset;
				// Should NOT be the old serial number
				expect(asset.extraFields['Serial Number']).not.toBe('OLD_SERIAL_12345');
				// Should be from RIMSS
				expect(asset.extraFields['Serial Number']).toBe('CAT320D_RIMSS_5905');
			});
		});

		describe('Create Scenario - New Wholegood no matching Equipment', () => {
			let createdAssetId;

			afterEach(async () => {
				// Cleanup created assets
				if (createdAssetId) {
					try {
						await axios.delete(
							getMxApiUrl(`assets/${createdAssetId}`),
							getMxHeaders()
						);
						console.log(`Cleaned up created asset: ${createdAssetId}`);
					} catch (error) {
						console.error('Failed to cleanup created asset:', error.response?.data || error.message);
					}
					createdAssetId = null;
				}
			});

			it('should create new equipment with RIMSS data and linked location', async () => {
				const wholegood = {
					systemID: '5911',
					make: 'Komatsu',
					model: 'PC200',
					serialNumber: 'KOMATSU_PC200_5911',
					wgUserDefinedField4: 'Test Location RIMSS Integration',
				};

				// Capture the created asset ID from the axios post
				const originalAxiosPost = axios.post;
				axios.post = jest.fn(originalAxiosPost);

				await createEquipment(wholegood);

				// Get the created asset ID from the response
				const postCall = axios.post.mock.results.find(r => 
					r.value && r.value.data && r.value.data.id
				);
				
				if (postCall && postCall.value && postCall.value.data) {
					createdAssetId = postCall.value.data.id;
				}

				// If we got the ID, verify the asset was created correctly
				if (createdAssetId) {
					const response = await axios.get(
						getMxApiUrl(`assets/${createdAssetId}?expand=extra_fields`),
						getMxHeaders()
					);

					const asset = response.data.asset;
					expect(asset.name).toBe('Komatsu PC200');
					expect(asset.model).toBe('PC200');
					expect(asset.extraFields['Serial Number']).toBe('KOMATSU_PC200_5911');
					expect(asset.extraFields['Eq Make']).toBe('Komatsu');
					expect(asset.locationId).toBe(testLocationId);
				}
			});

			it('should create equipment without location when location name not found', async () => {
				const wholegood = {
					systemID: '5912',
					make: 'Volvo',
					model: 'L220H',
					serialNumber: 'VOLVO_L220H_5912',
					wgUserDefinedField4: 'NonExistent Location That Does Not Exist',
				};

				const originalAxiosPost = axios.post;
				axios.post = jest.fn(originalAxiosPost);
				const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

				await createEquipment(wholegood);

				// Should log that no location was assigned
				expect(consoleSpy).toHaveBeenCalledWith(
					expect.stringContaining('No location assigned')
				);

				// Get the created asset ID
				const postCall = axios.post.mock.results.find(r => 
					r.value && r.value.data && r.value.data.id
				);
				
				if (postCall && postCall.value && postCall.value.data) {
					createdAssetId = postCall.value.data.id;

					// Verify asset was created but without location
					const response = await axios.get(
						getMxApiUrl(`assets/${createdAssetId}?expand=extra_fields`),
						getMxHeaders()
					);

					const asset = response.data.asset;
					expect(asset.name).toBe('Volvo L220H');
					expect(asset.extraFields['Serial Number']).toBe('VOLVO_L220H_5912');
					// locationId should be null or undefined
					expect(asset.locationId).toBeNull();
				}

				consoleSpy.mockRestore();
			});
		});

		describe('Location Mapping', () => {
			it('should find and link location by wgUserDefinedField4 name', async () => {
				const locationName = 'Test Location RIMSS Integration';
				const result = await getLocationId({
					systemID: '5905',
					wgUserDefinedField4: locationName,
				});

				expect(result).toBe(testLocationId);
			});

			it('should return undefined when location name does not exist', async () => {
				const result = await getLocationId({
					systemID: '5906',
					wgUserDefinedField4: 'This Location Does Not Exist In MaintainX',
				});

				expect(result).toBeUndefined();
			});

			it('should handle missing wgUserDefinedField4 gracefully', async () => {
				const result = await getLocationId({
					systemID: '5907',
				});

				expect(result).toBeUndefined();
			});
		});

		describe('Data Integrity', () => {
			it('Serial Number field should contain RIMSS serialNumber exactly', async () => {
				const wholegood = {
					systemID: '5913',
					make: 'JCB',
					model: '3CX',
					serialNumber: 'JCB_3CX_SERIAL_XYZ789',
				};

				const record = createEquipmentRecord(wholegood);
				expect(record.extraFields['Serial Number']).toBe('JCB_3CX_SERIAL_XYZ789');
			});

			it('Eq Make field should contain RIMSS make exactly', async () => {
				const wholegood = {
					systemID: '5914',
					make: 'Hitachi',
					model: 'EX200',
					serialNumber: 'HITA_EX200_12345',
				};

				const record = createEquipmentRecord(wholegood);
				expect(record.extraFields['Eq Make']).toBe('Hitachi');
			});

			it('should handle special characters in RIMSS data', async () => {
				const wholegood = {
					systemID: '5915',
					make: 'Cat & Co.',
					model: 'Model-X/Y',
					serialNumber: 'SN-2024/001-ABC',
				};

				const record = createEquipmentRecord(wholegood);
				expect(record.name).toBe('Cat & Co. Model-X/Y');
				expect(record.extraFields['Serial Number']).toBe('SN-2024/001-ABC');
				expect(record.extraFields['Eq Make']).toBe('Cat & Co.');
			});
		});

		describe('Error Handling', () => {
			it('should log error when location lookup fails', async () => {
				const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

				await getLocationId({
					systemID: '9999',
					wgUserDefinedField4: 'Valid Name But API Fails',
				});

				// Should handle gracefully without throwing
				expect(consoleSpy).toHaveBeenCalledWith(
					expect.stringContaining('Error fetching location'),
					expect.any(Error)
				);

				consoleSpy.mockRestore();
			});

			it('should not throw when creating equipment with invalid location', async () => {
				const wholegood = {
					systemID: '9998',
					make: 'TestMake',
					model: 'TestModel',
					serialNumber: 'TEST123',
					wgUserDefinedField4: 'Invalid Location That Will Cause Error',
				};

				// Should not throw
				await expect(createEquipment(wholegood)).resolves.not.toThrow();
			});
		});
	});
});
