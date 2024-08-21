import { DBConfig } from 'ngx-indexed-db';

// Ahead of time compiles requires an exported function for factories
export const migrationFactory: DBConfig["migrationFactory"] = () => {
  return {
  };
}

export const indexedDbConfig: DBConfig = {
  name: "TswMfdDb",
  version: 1,
  objectStoresMeta: [
    {
      store: "settings",
      storeConfig: { keyPath: "name", autoIncrement: false },
      storeSchema: []
    }
  ],
  migrationFactory
}
