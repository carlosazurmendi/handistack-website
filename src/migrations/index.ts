import * as migration_20260605_165852_marketing_blueprint_pillars from './20260605_165852_marketing_blueprint_pillars';
import * as migration_20260708_122554_leads_consent from './20260708_122554_leads_consent';

export const migrations = [
  {
    up: migration_20260605_165852_marketing_blueprint_pillars.up,
    down: migration_20260605_165852_marketing_blueprint_pillars.down,
    name: '20260605_165852_marketing_blueprint_pillars',
  },
  {
    up: migration_20260708_122554_leads_consent.up,
    down: migration_20260708_122554_leads_consent.down,
    name: '20260708_122554_leads_consent'
  },
];
