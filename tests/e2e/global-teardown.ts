import killPort from 'kill-port';
import config from '../../firebase.json';

type Emulator = {
    firestore?: {
        host?: string;
        port?: number;
    }
};

const FIRESTORE_EMULATOR_PORT = (config.emulators as Emulator)?.firestore?.port || 8080;

export default async function globalTeardown() {
    await killPort(FIRESTORE_EMULATOR_PORT);
}