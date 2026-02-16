const { getMxApiUrl, getMxHeaders } = require('../../src/utils/mx_api');

describe('mx_api utilities', () => {
	describe('getMxApiUrl', () => {
		it('should construct a valid MaintainX API URL with endpoint', () => {
			const url = getMxApiUrl('assets');
			expect(url).toBe('https://api.getmaintainx.com/v1/assets');
		});

		it('should handle nested endpoints with query parameters', () => {
			const url = getMxApiUrl('assets/123');
			expect(url).toBe('https://api.getmaintainx.com/v1/assets/123');
		});

		it('should work with empty endpoint string', () => {
			const url = getMxApiUrl('');
			expect(url).toBe('https://api.getmaintainx.com/v1/');
		});

		it('should handle endpoints with special characters', () => {
			const url = getMxApiUrl('assets?limit=10&offset=0');
			expect(url).toBe('https://api.getmaintainx.com/v1/assets?limit=10&offset=0');
		});
	});

	describe('getMxHeaders', () => {
		const originalApiKey = process.env.MX_API_KEY;

		beforeEach(() => {
			process.env.MX_API_KEY = 'test-api-key-12345';
		});

		afterEach(() => {
			process.env.MX_API_KEY = originalApiKey;
		});

		it('should return headers object with required properties', () => {
			const headers = getMxHeaders();
			expect(headers).toBeDefined();
			expect(headers.headers).toBeDefined();
		});

		it('should include Authorization header with Bearer token', () => {
			const headers = getMxHeaders();
			expect(headers.headers.Authorization).toBe('Bearer test-api-key-12345');
		});

		it('should include Content-Type header', () => {
			const headers = getMxHeaders();
			expect(headers.headers['Content-Type']).toBe('application/json');
		});

		it('should include the MX_API_KEY from environment', () => {
			process.env.MX_API_KEY = 'custom-key-xyz';
			const headers = getMxHeaders();
			expect(headers.headers.Authorization).toBe('Bearer custom-key-xyz');
		});

		it('should have proper header structure for axios/fetch', () => {
			const headers = getMxHeaders();
			expect(Object.keys(headers.headers)).toContain('Authorization');
			expect(Object.keys(headers.headers)).toContain('Content-Type');
		});
	});
});
