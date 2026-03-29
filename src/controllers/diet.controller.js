const DietLog = require('../models/DietLog');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { REWARDS } = require('../utils/constants');
const { awardProgress } = require('../services/gamification');
const { buildDietParams } = require('../services/paramMapper');
const mlService = require('../services/ml.service');

const MEAL_EMOJIS = { breakfast: '\u{1F963}', lunch: '\u{1F957}', snack: '\u{1F964}', dinner: '\u{1F35B}' };

// Default meals when ML service is unavailable
const DEFAULT_MEALS = [
  { mealId: 'default-1', mealType: 'breakfast', time: '7:30 AM', title: 'Recovery oats bowl', description: 'Warm oats with banana, honey, and seeds', heroEmoji: '\u{1F963}', conditions: ['High fiber', 'Energy boost'], nutrients: { calories: 430, protein: 28, carbs: 55, fats: 12, fiber: 8, hydration: 200 }, ingredients: [{ name: 'Oats', amount: '1 cup', icon: '\u{1F33E}', note: 'Complex carbs for sustained energy' }, { name: 'Banana', amount: '1 medium', icon: '\u{1F34C}', note: 'Natural sweetness + potassium' }, { name: 'Honey', amount: '1 tbsp', icon: '\u{1F36F}', note: 'Quick energy' }, { name: 'Mixed seeds', amount: '2 tbsp', icon: '\u{1F331}', note: 'Healthy fats + minerals' }], completed: false },
  { mealId: 'default-2', mealType: 'lunch', time: '1:00 PM', title: 'Protein crunch salad', description: 'Fresh greens with grilled chicken and quinoa', heroEmoji: '\u{1F957}', conditions: ['High protein', 'Low fat'], nutrients: { calories: 520, protein: 34, carbs: 45, fats: 18, fiber: 7, hydration: 150 }, ingredients: [{ name: 'Mixed greens', amount: '2 cups', icon: '\u{1F96C}', note: 'Vitamins and minerals' }, { name: 'Grilled chicken', amount: '150g', icon: '\u{1F357}', note: 'Lean protein' }, { name: 'Quinoa', amount: '1/2 cup', icon: '\u{1F33E}', note: 'Complete protein' }, { name: 'Olive oil dressing', amount: '1 tbsp', icon: '\u{1FAD2}', note: 'Heart-healthy fats' }], completed: false },
  { mealId: 'default-3', mealType: 'snack', time: '4:30 PM', title: 'Calm-focus smoothie', description: 'Berry and spinach smoothie with protein powder', heroEmoji: '\u{1F964}', conditions: ['Antioxidants', 'Brain health'], nutrients: { calories: 290, protein: 18, carbs: 35, fats: 8, fiber: 5, hydration: 300 }, ingredients: [{ name: 'Mixed berries', amount: '1 cup', icon: '\u{1FAD0}', note: 'Antioxidant-rich' }, { name: 'Spinach', amount: '1 cup', icon: '\u{1F96C}', note: 'Iron + folate' }, { name: 'Protein powder', amount: '1 scoop', icon: '\u{1F4AA}', note: 'Muscle recovery' }, { name: 'Almond milk', amount: '1 cup', icon: '\u{1F95B}', note: 'Low calorie base' }], completed: false },
  { mealId: 'default-4', mealType: 'dinner', time: '8:00 PM', title: 'Healing rice plate', description: 'Brown rice with dal and steamed vegetables', heroEmoji: '\u{1F35B}', conditions: ['Balanced', 'Easy digest'], nutrients: { calories: 610, protein: 38, carbs: 75, fats: 15, fiber: 10, hydration: 200 }, ingredients: [{ name: 'Brown rice', amount: '1 cup', icon: '\u{1F35A}', note: 'Whole grain fiber' }, { name: 'Dal', amount: '1 cup', icon: '\u{1F372}', note: 'Plant protein' }, { name: 'Steamed vegetables', amount: '1.5 cups', icon: '\u{1F966}', note: 'Vitamins and minerals' }, { name: 'Ghee', amount: '1 tsp', icon: '\u{1F9C8}', note: 'Gut healing' }], completed: false },
];

function transformMlMealToFrontend(mlMeal, index) {
  const type = mlMeal.meal_type || (index === 0 ? 'breakfast' : index === 1 ? 'lunch' : index === 2 ? 'snack' : 'dinner');
  return {
    mealId: `ml-meal-${index}`,
    mealType: type,
    time: mlMeal.time || ['7:30 AM', '1:00 PM', '4:30 PM', '8:00 PM'][index % 4],
    title: mlMeal.meal_name || mlMeal.name || 'Meal',
    description: mlMeal.description || '',
    heroEmoji: MEAL_EMOJIS[type] || '\u{1F37D}',
    conditions: (mlMeal.tags || []).slice(0, 3).map(t => t.replace(/_/g, ' ')),
    nutrients: {
      calories: mlMeal.nutrition?.energy_kcal || 400,
      protein: mlMeal.nutrition?.protein_g || 25,
      carbs: mlMeal.nutrition?.carbs_g || 50,
      fats: mlMeal.nutrition?.fats_g || 15,
      fiber: 7,
      hydration: mlMeal.nutrition?.water_ml || 200,
    },
    ingredients: (mlMeal.recipe?.ingredients || []).map(ing => ({
      name: ing.item || ing.name || '',
      amount: ing.quantity || ing.amount || '',
      icon: '\u{1F374}',
      note: mlMeal.benefit || '',
    })),
    completed: false,
  };
}

// Shared logic: generate diet plan for a user (used by both API and cron)
async function generateDietForUser(user) {
  const todayKey = new Date().toISOString().split('T')[0];
  const todayStart = new Date(todayKey);

  const existing = await DietLog.findOne({
    userId: user._id,
    date: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 86400000) },
  });
  if (existing) return existing;

  let meals = DEFAULT_MEALS;
  let dailyGoals = { calories: 2100, protein: 130, carbs: 210, fats: 65, fiber: 30, hydration: 2500 };

  try {
    const params = buildDietParams(user);
    console.log('[Diet API] REQUEST to ML service:', JSON.stringify(params, null, 2));
    const mlResult = await mlService.predictDietPlan(params);
    console.log('[Diet API] RESPONSE from ML service:', JSON.stringify(mlResult, null, 2));
    if (mlResult && mlResult.nutrition_plan && mlResult.nutrition_plan.meals) {
      meals = mlResult.nutrition_plan.meals.map((m, i) => transformMlMealToFrontend(m, i));
      console.log('[Diet API] Transformed meals:', JSON.stringify(meals.map(m => ({ title: m.title, mealType: m.mealType, time: m.time })), null, 2));
    } else {
      console.log('[Diet API] ML result missing nutrition_plan.meals, using defaults');
    }
  } catch (err) {
    console.log('[Diet API] ML diet service unavailable, using defaults. Error:', err.message);
  }

  return DietLog.create({ userId: user._id, date: todayStart, dailyGoals, meals });
}

exports.generateDietForUser = generateDietForUser;

exports.getToday = asyncHandler(async (req, res) => {
  console.log('[Diet API] GET /diet/today — user:', req.user.email || req.user._id);
  const dietLog = await generateDietForUser(req.user);
  console.log('[Diet API] GET /diet/today — returning', dietLog.meals.length, 'meals:', dietLog.meals.map(m => m.title));
  res.json({ meals: dietLog.meals, dailyGoals: dietLog.dailyGoals });
});

exports.toggleMeal = asyncHandler(async (req, res) => {
  const { mealId } = req.params;
  const todayKey = new Date().toISOString().split('T')[0];
  const todayStart = new Date(todayKey);

  const dietLog = await DietLog.findOne({
    userId: req.user._id,
    date: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 86400000) },
  });

  if (!dietLog) return res.status(404).json({ error: 'No diet plan for today' });

  const meal = dietLog.meals.find(m => m.mealId === mealId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  meal.completed = !meal.completed;
  meal.completedAt = meal.completed ? new Date() : null;
  await dietLog.save();

  if (meal.completed) {
    await awardProgress(req.user._id, {
      actionKey: `diet-meal-${mealId}-${todayKey}`,
      xp: REWARDS.DIET_MEAL.xp,
      gems: REWARDS.DIET_MEAL.gems,
      updates: { dietPlansFollowed: 1 },
    });
  }

  const updatedUser = await User.findById(req.user._id);
  res.json({ meals: dietLog.meals, gamification: updatedUser.gamification });
});

exports.refresh = asyncHandler(async (req, res) => {
  const user = req.user;
  const todayKey = new Date().toISOString().split('T')[0];
  const todayStart = new Date(todayKey);

  try {
    const params = buildDietParams(user);
    console.log('[Diet API] POST /diet/refresh — REQUEST to ML:', JSON.stringify(params, null, 2));
    const mlResult = await mlService.predictDietPlan(params);
    console.log('[Diet API] POST /diet/refresh — RESPONSE from ML:', JSON.stringify(mlResult, null, 2));
    let meals = DEFAULT_MEALS;
    if (mlResult && mlResult.nutrition_plan && mlResult.nutrition_plan.meals) {
      meals = mlResult.nutrition_plan.meals.map((m, i) => transformMlMealToFrontend(m, i));
      console.log('[Diet API] Refresh transformed meals:', meals.map(m => m.title));
    } else {
      console.log('[Diet API] Refresh: ML result missing nutrition_plan.meals, using defaults');
    }

    const dietLog = await DietLog.findOneAndUpdate(
      { userId: user._id, date: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 86400000) } },
      { meals, mlDietPlan: mlResult },
      { upsert: true, new: true }
    );

    res.json({ meals: dietLog.meals, dailyGoals: dietLog.dailyGoals });
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable' });
  }
});
