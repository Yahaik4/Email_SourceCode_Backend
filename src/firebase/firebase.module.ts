import { Global, Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { initialize } from 'fireorm';

@Global()
@Module({
  providers: [
    {
      provide: 'FIRESTORE',
      useFactory: () => {
        const serviceAccountPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '');
        if (!fs.existsSync(serviceAccountPath)) {
          throw new Error(`Service account file not found at ${serviceAccountPath}`);
        }

        const serviceAccount = require(serviceAccountPath); 
        const app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        const firestore = admin.firestore(app);
        firestore.settings({
          ignoreUndefinedProperties: true,  // Bỏ qua các trường undefined
        });
        
        initialize(firestore);

        return firestore;
      },
    },
  ],
  exports: ['FIRESTORE'],
})
export class FirebaseModule {}
