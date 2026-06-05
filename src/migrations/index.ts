import * as migration_20260605_165852_marketing_blueprint_pillars from './20260605_165852_marketing_blueprint_pillars';

export const migrations = [
  {
    up: migration_20260605_165852_marketing_blueprint_pillars.up,
    down: migration_20260605_165852_marketing_blueprint_pillars.down,
    name: '20260605_165852_marketing_blueprint_pillars'
  },
];
