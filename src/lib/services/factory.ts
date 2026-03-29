import type { IAuthService } from './IAuthService';
import type { IDbService } from './IDbService';
import type { IStorageService } from './IStorageService';

function createServices(): {
  authService: IAuthService;
  dbService: IDbService;
  storageService: IStorageService;
} {
  const backend = process.env.NEXT_PUBLIC_BACKEND ?? 'firebase';

  if (backend === 'pocketbase') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PocketbaseAuthService } = require('./pocketbase/PocketbaseAuthService');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PocketbaseDbService } = require('./pocketbase/PocketbaseDbService');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PocketbaseStorageService } = require('./pocketbase/PocketbaseStorageService');
    return {
      authService: new PocketbaseAuthService() as IAuthService,
      dbService: new PocketbaseDbService() as IDbService,
      storageService: new PocketbaseStorageService() as IStorageService,
    };
  }

  // Default: firebase
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FirebaseAuthService } = require('./firebase/FirebaseAuthService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FirebaseDbService } = require('./firebase/FirebaseDbService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FirebaseStorageService } = require('./firebase/FirebaseStorageService');
  return {
    authService: new FirebaseAuthService() as IAuthService,
    dbService: new FirebaseDbService() as IDbService,
    storageService: new FirebaseStorageService() as IStorageService,
  };
}

const { authService, dbService, storageService } = createServices();

export { authService, dbService, storageService };
