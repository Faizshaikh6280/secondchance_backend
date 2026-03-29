const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendAcquaintanceCredentials } = require('./email.service');

async function createAcquaintanceAccounts(addict, contacts) {
  if (!contacts?.length) return;

  for (const contact of contacts) {
    if (!contact.email) continue;

    try {
      const existing = await User.findOne({ email: contact.email.toLowerCase() });
      if (existing) {
        if (existing.role === 'acquaintance' && !existing.linkedUserId) {
          existing.linkedUserId = addict._id;
          existing.linkedRelationship = contact.role;
          await existing.save();
        }
        const ec = addict.onboarding.emergencyContacts.find(c => c.email === contact.email);
        if (ec) ec.acquaintanceUserId = existing._id;
        await addict.save();
        continue;
      }

      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 10);

      const acqUser = await User.create({
        email: contact.email.toLowerCase(),
        passwordHash,
        name: contact.role,
        role: 'acquaintance',
        linkedUserId: addict._id,
        linkedRelationship: contact.role,
      });

      const ec = addict.onboarding.emergencyContacts.find(c => c.email === contact.email);
      if (ec) ec.acquaintanceUserId = acqUser._id;
      await addict.save();

      console.log(`[Acquaintance] Created account for ${contact.email} (${contact.role})`);

      // Send credentials email (fire-and-forget — never blocks account creation)
      sendAcquaintanceCredentials(contact.email, {
        password,
        addictName: addict.name,
        role: contact.role,
      }).catch(err => console.log(`[Acquaintance] Email to ${contact.email} failed: ${err.message}`));
    } catch (err) {
      console.log(`[Acquaintance] Failed to create account for ${contact.email}: ${err.message}`);
    }
  }
}

module.exports = { createAcquaintanceAccounts };
