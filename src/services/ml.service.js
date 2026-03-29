const axios = require('axios');

const ML_API_BASE = process.env.ML_API_URL || 'http://localhost:8000/api/ml';

async function predictCommunityRisk(params) {
  const { data } = await axios.post(`${ML_API_BASE}/community/predict`, params, { timeout: 30000 });
  return data;
}

async function predictDietPlan(params) {
  const { data } = await axios.post(`${ML_API_BASE}/diet/predict`, params, { timeout: 30000 });
  return data;
}

async function predictCoping(params) {
  const { data } = await axios.post(`${ML_API_BASE}/coping/predict`, params, { timeout: 30000 });
  return data;
}

async function predictRecoveryPlan(params) {
  const { data } = await axios.post(`${ML_API_BASE}/recovery/predict`, params, { timeout: 30000 });
  return data;
}

module.exports = { predictCommunityRisk, predictDietPlan, predictCoping, predictRecoveryPlan };
