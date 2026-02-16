const { buildUrl } = require('../../src/utils/pull_rimss_wholegoods');

describe('Test wholegoods buildUrl', () => {
    it('should build the correct URL with specified parameters', () => {
        const baseUrl = 'http://example.com/WNSAPI/';
        const params = {
            APIName: "TestDameonService",
            LocationID: "3",
            CreatedDate: "01/09/2000",
            UpdatedDate: "1/14/2000",
        };
        const limit = 100;
        const offset = 0;
        
        const url = buildUrl({ baseUrl, params, limit, offset });
        expect(url.toString()).toBe('http://example.com/WNSAPI/api/WNSWholegood?APIName=TestDameonService&LocationID=3&CreatedDate=01%2F09%2F2000&UpdatedDate=1%2F14%2F2000&Limit=100&Offset=0');
    });
});

