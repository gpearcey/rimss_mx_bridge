const axios = require('axios');
const { 
	createEquipmentRecord, 
	getLocationId, 
	updateEquipment, 
	createEquipment 
} = require('../../src/utils/edit_equipment');

jest.mock('axios');

describe('edit_equipment utilities', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.MX_API_KEY = 'test-key-123';
	});

	describe('createEquipmentRecord', () => {
		it('should create equipment record with name from make and model', () => {
			const wholegood = {
				make: 'Caterpillar',
				model: '320D',
				serialNumber: 'CAT320D123456',
			};

			const result = createEquipmentRecord(wholegood);

			expect(result.name).toBe('Caterpillar 320D');
		});

		it('should include serial number in extraFields', () => {
			const wholegood = {
				make: 'Komatsu',
				model: 'PC200',
				serialNumber: 'KOM123ABC',
			};

			const result = createEquipmentRecord(wholegood);

			expect(result.extraFields).toEqual({
				'Serial Number': 'KOM123ABC',
				'Eq Make': 'Komatsu',
                'Model': 'PC200',
			});
		});

		it('should filter out null or undefined values from extraFields', () => {
			const wholegood = {
				make: 'JCB',
				model: '3CX',
				serialNumber: undefined,
			};

			const result = createEquipmentRecord(wholegood);

			expect(result.extraFields).toEqual({
				'Eq Make': 'JCB',
                'Model': '3CX',
			});
		});

		it('should handle missing serial number gracefully', () => {
			const wholegood = {
				make: 'Volvo',
				model: 'L220H',
				serialNumber: null,
			};

			const result = createEquipmentRecord(wholegood);

			expect(result.extraFields).toEqual({
				'Eq Make': 'Volvo',
				'Model': 'L220H',
			});
		});
	});

	describe('getLocationId', () => {
		it('should return location ID when location name matches', async () => {
			const wholegood = {
				systemID: '5905',
				wgUserDefinedField4: 'Warehouse A',
			};

			axios.get.mockResolvedValue({
				data: [{ id: 852, name: 'Warehouse A' }],
			});

			const result = await getLocationId(wholegood);

			expect(result).toBe(852);
			expect(axios.get).toHaveBeenCalledWith(
				expect.stringContaining('locations?name=Warehouse%20A'),
				expect.any(Object)
			);
		});

		it('should return undefined when no location found', async () => {
			const wholegood = {
				systemID: '5907',
				wgUserDefinedField4: 'Non-existent Location',
			};

			axios.get.mockResolvedValue({
				data: [],
			});

			const result = await getLocationId(wholegood);

			expect(result).toBeUndefined();
		});

		it('should return undefined when wgUserDefinedField4 is missing', async () => {
			const wholegood = {
				systemID: '5911',
			};

			const result = await getLocationId(wholegood);

			expect(result).toBeUndefined();
			expect(axios.get).not.toHaveBeenCalled();
		});

		it('should handle API errors gracefully and return undefined', async () => {
			const wholegood = {
				systemID: '5912',
				wgUserDefinedField4: 'Warehouse B',
			};

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			axios.get.mockRejectedValue(new Error('API Error'));

			const result = await getLocationId(wholegood);

			expect(result).toBeUndefined();
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Error fetching location for RIMSS ID 5912'),
				'API Error'
			);
			consoleSpy.mockRestore();
		});

		it('should handle API 404 response with error', async () => {
			const wholegood = {
				systemID: '5913',
				wgUserDefinedField4: 'Invalid Location',
			};

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			axios.get.mockRejectedValue({
				response: { status: 404, data: { errors: ['Not found'] } },
			});

			const result = await getLocationId(wholegood);

			expect(result).toBeUndefined();
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Error fetching location for RIMSS ID 5913'),
				expect.objectContaining({ errors: ['Not found'] })
			);
			consoleSpy.mockRestore();
		});
	});

	describe('updateEquipment', () => {
		it('should send PATCH request with correct data', async () => {
			const wholegood = {
				systemID: '5905',
				make: 'Caterpillar',
				model: '320D',
				serialNumber: 'CAT320D123456',
			};

			const equipment = {
				id: 963,
				name: 'Old Equipment',
			};

			axios.patch.mockResolvedValue({
				data: { asset: { id: 963 } },
			});

			await updateEquipment(wholegood, equipment);

			expect(axios.patch).toHaveBeenCalledWith(
				expect.stringContaining('assets/963'),
				expect.objectContaining({
					name: 'Caterpillar 320D',
					extraFields: {
						'Serial Number': 'CAT320D123456',
						'Eq Make': 'Caterpillar',
                        'Model': '320D',
					},
				}),
				expect.any(Object)
			);
		});

		it('should handle update errors gracefully', async () => {
			const wholegood = { systemID: '5907', make: 'JCB', model: '3CX', serialNumber: 'JCB123' };
			const equipment = { id: 123 };

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			axios.patch.mockRejectedValue(new Error('Update failed'));

			await updateEquipment(wholegood, equipment);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Error updating equipment with MX ID 123 and RIMSS ID 5907'),
				'Update failed'
			);
			consoleSpy.mockRestore();
		});
	});

	describe('createEquipment', () => {
		it('should create equipment with location ID when location exists', async () => {
			const wholegood = {
				systemID: '5911',
				make: 'Komatsu',
				model: 'PC200',
				serialNumber: 'KOM456DEF',
				wgUserDefinedField4: 'Main Warehouse',
			};

			axios.get.mockResolvedValue({
				data: [{ id: 852, name: 'Main Warehouse' }],
			});

			axios.post.mockResolvedValue({
				data: { id: 1000 },
			});

			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			await createEquipment(wholegood);

			expect(axios.post).toHaveBeenCalledWith(
				expect.stringContaining('assets'),
				expect.objectContaining({
					name: 'Komatsu PC200',
					locationId: 852,
					extraFields: {
						'Serial Number': 'KOM456DEF',
						'Eq Make': 'Komatsu',
                        'Model': 'PC200',
					},
				}),
				expect.any(Object)
			);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Assigned location ID 852')
			);

			consoleSpy.mockRestore();
		});

		it('should create equipment without location ID when location not found', async () => {
			const wholegood = {
				systemID: '5912',
				make: 'Volvo',
				model: 'L220H',
				serialNumber: 'VOL789GHI',
				wgUserDefinedField4: 'Unknown Location',
			};

			axios.get.mockResolvedValue({
				data: [],
			});

			axios.post.mockResolvedValue({
				data: { id: 1001 },
			});

			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			await createEquipment(wholegood);

			expect(axios.post).toHaveBeenCalledWith(
				expect.stringContaining('assets'),
				expect.objectContaining({
					name: 'Volvo L220H',
					extraFields: {
						'Serial Number': 'VOL789GHI',
						'Eq Make': 'Volvo',
                        'Model': 'L220H',
					},
				}),
				expect.any(Object)
			);

			// Verify locationId is not set in the request
			const callArgs = axios.post.mock.calls[0][1];
			expect(callArgs.locationId).toBeUndefined();

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('No location assigned')
			);

			consoleSpy.mockRestore();
		});

		it('should handle creation errors gracefully', async () => {
			const wholegood = {
				systemID: '5913',
				make: 'JCB',
				model: '3CX',
				serialNumber: 'JCB999',
			};

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			axios.post.mockRejectedValue(new Error('Creation failed'));

			await createEquipment(wholegood);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Error creating equipment for RIMSS ID 5913'),
				'Creation failed'
			);

			consoleSpy.mockRestore();
		});

		it('should log error when location lookup fails', async () => {
			const wholegood = {
				systemID: '5914',
				make: 'CAT',
				model: '320',
				serialNumber: 'CAT123',
				wgUserDefinedField4: 'Warehouse C',
			};

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			axios.get.mockRejectedValue(new Error('Location lookup failed'));

			axios.post.mockResolvedValue({
				data: { id: 1002 },
			});

			await createEquipment(wholegood);

			// Should still create equipment even if location lookup fails
			expect(axios.post).toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Error fetching location for RIMSS ID 5914'),
				'Location lookup failed'
			);

			consoleSpy.mockRestore();
		});
	});

	describe('RIMSS data overwriting MaintainX data', () => {
		it('updateEquipment should overwrite MaintainX serial number with RIMSS data', async () => {
			const wholegood = {
				systemID: '5905',
				make: 'NEW_MAKE',
				model: 'NEW_MODEL',
				serialNumber: 'NEW_SERIAL_123',
			};

			const equipment = {
				id: 963,
				name: 'Old Equipment',
				serialNumber: 'OLD_SERIAL',
				extraFields: { 'Eq Make': 'OLD_MAKE' },
			};

			axios.patch.mockResolvedValue({
				data: { asset: { id: 963 } },
			});

			await updateEquipment(wholegood, equipment);

			const patchData = axios.patch.mock.calls[0][1];
			expect(patchData.extraFields['Serial Number']).toBe('NEW_SERIAL_123');
			expect(patchData.extraFields['Eq Make']).toBe('NEW_MAKE');
		});

		it('createEquipment should set RIMSS serial number and make as primary fields', async () => {
			const wholegood = {
				systemID: '5911',
				make: 'RIMSS_MAKE',
				model: 'RIMSS_MODEL',
				serialNumber: 'RIMSS_SERIAL_XYZ',
			};

			axios.post.mockResolvedValue({
				data: { id: 1003 },
			});

			await createEquipment(wholegood);

			const postData = axios.post.mock.calls[0][1];
			expect(postData.extraFields['Serial Number']).toBe('RIMSS_SERIAL_XYZ');
			expect(postData.extraFields['Eq Make']).toBe('RIMSS_MAKE');
			expect(postData.extraFields['Model']).toBe('RIMSS_MODEL');
		});
	});
});
