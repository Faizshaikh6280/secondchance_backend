// Maps frontend onboarding data + DB fields to ML model input params

const TYPE_TO_SUBSTANCE = {
  alcohol: 'alcohol',
  smoking: 'cigarette',
  drugs: 'drug_powder',
  digital: 'polysubstance',
  sugar: 'alcohol',
  other: 'polysubstance',
};

const TYPE_TO_ADDICTION_TYPE = {
  alcohol: 'alcohol',
  smoking: 'tobacco',
  drugs: 'substance',
  digital: 'behavioral',
  sugar: 'food',
  other: 'other',
};

const DURATION_TO_MONTHS = { '<6m': 3, '6m-1y': 9, '1-3y': 24, '3-5y': 48, '>5y': 84 };
const DURATION_TO_YEARS = { '<6m': 0.25, '6m-1y': 0.75, '1-3y': 2, '3-5y': 4, '>5y': 7 };

const TRIGGER_TO_SCORE = { stress: 8, loneliness: 7, anger: 8, boredom: 5, social: 6 };
const TRIGGER_TO_STRESS = { stress: 'high', loneliness: 'medium', anger: 'high', boredom: 'low', social: 'medium' };
const MOTIVATION_TO_SCORE = { family: 9, health: 8, finance: 7, mind: 8, growth: 7 };

function daysSober(user) {
  return Math.max(1, Math.floor((Date.now() - new Date(user.recoveryStartDate).getTime()) / 86400000));
}

function buildCommunityParams(user) {
  const ob = user.onboarding;
  const ext = user.extendedProfile;
  const gam = user.gamification;
  const ds = daysSober(user);

  return {
    user_id: user._id.toString(),
    age: ext.age,
    gender: ext.gender === 'prefer_not_to_say' ? 'male' : ext.gender,
    education_level: ext.educationLevel,
    employment_status: ext.employmentStatus,
    income_bracket: ext.incomeBracket,
    addiction_type: TYPE_TO_ADDICTION_TYPE[ob.type] || 'other',
    years_using: DURATION_TO_YEARS[ob.duration] || 2,
    daily_amount: 3.0,
    relapse_history_count: 0,
    last_relapse_days: ds,
    comorbidities_count: 0,
    depression_score: 0,
    anxiety_score: 0,
    social_support_score: (ob.emergencyContacts?.length || 0) >= 2 ? 7 : 4,
    motivation_score: MOTIVATION_TO_SCORE[ob.motivation] || 7,
    app_activity_count: gam.stats.activitiesCompleted || 0,
    emergency_calls_count: 0,
    treatment_history: 0,
    medication: 0,
    sleep_hours_avg: 7.0,
    stress_level: (TRIGGER_TO_SCORE[ob.trigger] || 5) > 7 ? 7 : 4,
    triggers_score: TRIGGER_TO_SCORE[ob.trigger] || 5,
    craving_intensity: 5,
    stage_of_change: ds > 30 ? 'maintenance' : ds > 7 ? 'action' : 'preparation',
  };
}

function buildDietParams(user) {
  const ob = user.onboarding;
  const ext = user.extendedProfile;
  const bmi = Math.round((ext.weightKg / Math.pow(ext.heightCm / 100, 2)) * 100) / 100;

  return {
    age: ext.age,
    sex: ext.sex === 'other' ? 'male' : ext.sex,
    height_cm: ext.heightCm,
    weight_kg: ext.weightKg,
    bmi,
    activity_level: ext.activityLevel,
    region_country: ext.regionCountry,
    diet_type: ext.dietType,
    budget_level: ext.budgetLevel,
    primary_substance: TYPE_TO_SUBSTANCE[ob.type] || 'alcohol',
    secondary_substance: 'none',
    usage_duration_months: DURATION_TO_MONTHS[ob.duration] || 24,
    usage_frequency_per_day: 3.0,
    usage_quantity_per_day: 'medium',
    route_of_administration: 'oral',
    last_use_days_ago: daysSober(user),
    relapse_risk_level: 'medium',
    numbness_level: 'low',
    appetite_level: 'medium',
    hydration_status: 'medium',
    anemia_risk: 'low',
    vitamin_deficiency_risk: 'medium',
    protein_deficiency_risk: 'medium',
    sleep_quality: 'moderate',
    stress_level: TRIGGER_TO_STRESS[ob.trigger] || 'medium',
    spicy_food_tolerance: 'medium',
    chewing_difficulty: 0,
    swallowing_difficulty: 0,
    cooking_time_available: 30,
    meal_prep_skill: 'low',
    food_availability_level: 'medium',
  };
}

function buildCopingParams(user, sessionInput) {
  const ob = user.onboarding;
  const ds = daysSober(user);
  const h = new Date().getHours();
  const timeOfDay = h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';

  return {
    craving_level: sessionInput.cravingLevel || 7,
    mood: sessionInput.mood || 'very_low',
    recovery_stage: ds > 30 ? 'stable' : ds > 7 ? 'mid' : 'early',
    addiction_type: TYPE_TO_SUBSTANCE[ob.type] || 'alcohol',
    recent_activity: ob.trigger === 'loneliness' ? 'loneliness' :
      ob.trigger === 'stress' ? 'work_pressure' :
      ob.trigger === 'boredom' ? 'boredom' : 'general',
    time_of_day: timeOfDay,
    location_type: sessionInput.location || 'home',
    previous_coping_success: 'breathing_exercise',
  };
}

function buildRecoveryParams(user) {
  const ob = user.onboarding;
  const ext = user.extendedProfile;

  return {
    age: ext.age,
    sex: ext.sex === 'other' ? 'male' : ext.sex,
    primary_substance: TYPE_TO_SUBSTANCE[ob.type] || 'alcohol',
    secondary_substance: 'none',
    usage_duration_months: DURATION_TO_MONTHS[ob.duration] || 24,
    usage_frequency_per_day: 'medium',
    usage_quantity_per_day: 'medium',
    route_of_administration: 'oral',
    last_use_days_ago: daysSober(user),
    weakness_level: 'medium',
    numbness_level: 'low',
    sleep_quality: 'moderate',
    stress_level: TRIGGER_TO_STRESS[ob.trigger] || 'medium',
    appetite_level: 'medium',
    hydration_status: 'medium',
    relapse_risk_level: 'medium',
    activity_level: ext.activityLevel || 'low',
    country_or_region: ext.regionCountry || 'India',
    budget_level: ext.budgetLevel || 'medium',
    cooking_time_available: 'medium',
    willingness_for_daily_checkin: 1,
    current_energy_level: 'medium',
  };
}

module.exports = { buildCommunityParams, buildDietParams, buildCopingParams, buildRecoveryParams };
