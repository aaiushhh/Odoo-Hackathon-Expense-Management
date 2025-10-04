const axios = require('axios');

exports.convert = async (from, to, amount) => {
  const url = `https://api.exchangerate-api.com/v4/latest/${from}`;
  const response = await axios.get(url);
  const rate = response.data.rates[to];
  if (!rate) throw new Error(`Cannot convert from ${from} to ${to}`);
  return amount * rate;
};
