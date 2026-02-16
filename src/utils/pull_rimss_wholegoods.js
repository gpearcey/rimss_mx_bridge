require("dotenv").config();

const DEFAULT_BASE_URL = "http://192.168.45.10/WNSAPI/";
const DEFAULT_PARAMS = {
	APIName: "TestDameonService",
	LocationID: "3",
	CreatedDate: "01/09/2000",
	UpdatedDate: "1/14/2000",
};

const DEFAULT_LIMIT = 100;
const DEFAULT_MAX_PAGES = 10000;

const buildAuthHeader = () => {
	const username = process.env.WNS_API_USERNAME;
	const password = process.env.WNS_API_PASSWORD;

	if (!username || !password) {
		return null;
	}

	const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
	return `Basic ${token}`;
};

const buildUrl = ({ baseUrl, params, limit, offset }) => {
	const url = new URL("api/WNSWholegood", baseUrl);
	const query = new URLSearchParams({
		...params,
		Limit: String(limit),
		Offset: String(offset),
	});

	url.search = query.toString();
	return url;
};

const fetchWholegoodsPage = async ({ baseUrl, params, limit, offset, authHeader }) => {
	const url = buildUrl({ baseUrl, params, limit, offset });
	console.log('Requesting URL:', url.toString());
	const headers = {
		Accept: "application/json",
	};

	if (authHeader) {
		headers.Authorization = authHeader;
	}

	const response = await fetch(url, { headers });

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`WNSWholegood request failed (${response.status}): ${body}`);
	}

	const data = await response.json();
	if (!Array.isArray(data)) {
		throw new Error("WNSWholegood response was not an array");
	}

	return data;
};

const getAllWholegoods = async ({
	baseUrl = DEFAULT_BASE_URL,
	params = DEFAULT_PARAMS,
	limit = DEFAULT_LIMIT,
	maxPages = DEFAULT_MAX_PAGES,
} = {}) => {
	const authHeader = buildAuthHeader();
	const allWholegoods = [];
	let offset = 0;
	let page = 0;
	let fetchedCount = 0;

	while (page < maxPages) {
		const batch = await fetchWholegoodsPage({
			baseUrl,
			params,
			limit,
			offset,
			authHeader,
		});

		for (const wholegood of batch) {
			fetchedCount += 1;
			//console.log(`Fetched #${fetchedCount} SystemID=${wholegood.systemID}`);
			//console.log(JSON.stringify(wholegood, null, 2));
		}

		allWholegoods.push(...batch);

		if (batch.length < limit) {
			break;
		}

		offset += limit;
		page += 1;
	}

	return allWholegoods;
};

module.exports = {
	getAllWholegoods,
	fetchWholegoodsPage,
	buildUrl,
	buildAuthHeader,
};