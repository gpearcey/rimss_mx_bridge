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

module.exports = { getMxApiUrl, getMxHeaders };