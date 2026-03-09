import {
  collection,
  doc,
  setDoc,
  getDoc,
  Timestamp,
  writeBatch,
  getDocs,
  CollectionReference,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Initialize all required Firestore collections and documents
 * This should be called once when the app starts
 * 
 * Note: This runs asynchronously and won't block app startup
 */
export async function initializeFirestoreCollections() {
  try {
    // Create metadata collection with app info
    await createMetadataCollection();
    console.log('✅ Firestore collections initialized');
    return true;
  } catch (error: any) {
    // Don't block app load - collections will be created when needed
    console.warn(
      '⚠️ Could not initialize collections (app will work offline):',
      error.message || error
    );
    return false;
  }
}

/**
 * Create the metadata collection for app-wide data
 */
async function createMetadataCollection() {
  try {
    const metadataRef = doc(db, 'metadata', 'app');
    
    try {
      const metadataSnap = await getDoc(metadataRef);

      // Only create if it doesn't exist
      if (!metadataSnap.exists()) {
        await setDoc(metadataRef, {
          initialized: true,
          version: '1.0',
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now(),
          collections: {
            users: 'User accounts and fitness data',
            metadata: 'App configuration and metadata',
          },
        });
        console.log('✅ Metadata collection created');
      } else {
        console.log('✅ Metadata collection already exists');
      }
    } catch (error: any) {
      // Handle offline errors gracefully
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.warn('⚠️ Firestore offline - will retry when connection available');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not create metadata collection:', error);
    throw error;
  }
}

/**
 * Verify that collections exist by checking Firestore structure
 */
export async function verifyCollectionsExist() {
  try {
    const metadataRef = doc(db, 'metadata', 'app');
    
    try {
      const metadataSnap = await getDoc(metadataRef);

      if (!metadataSnap.exists()) {
        console.warn('⚠️ Metadata collection not found. Running initialization...');
        await initializeFirestoreCollections();
        return false;
      }

      console.log('✅ Collections verified');
      return true;
    } catch (error: any) {
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.warn('⚠️ Firestore offline - will verify when connection available');
        return false;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not verify collections:', error);
    return false;
  }
}

/**
 * Get Firestore collection reference by name
 */
export function getCollectionRef(collectionName: string): CollectionReference {
  return collection(db, collectionName);
}

/**
 * Create sample data for testing (optional)
 * Only creates if collections don't have data
 */
export async function createSampleData() {
  try {
    const batch = writeBatch(db);

    // Create a sample metadata entry
    const metadataRef = doc(db, 'metadata', 'sample');
    batch.set(
      metadataRef,
      {
        name: 'Sample Data',
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );

    await batch.commit();
    console.log('✅ Sample data created');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

/**
 * Check and log collection status
 */
export async function checkCollectionStatus() {
  try {
    console.log('📊 Checking Firestore collections...');

    // Check metadata
    try {
      const metadataRef = doc(db, 'metadata', 'app');
      const metadataSnap = await getDoc(metadataRef);
      console.log(
        `- metadata/app: ${metadataSnap.exists() ? '✅ exists' : '❌ missing'}`
      );
    } catch (error: any) {
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.log('- metadata/app: ⚠️ offline (will sync when connection available)');
      } else {
        console.warn('- metadata/app: ⚠️ error checking', error.message);
      }
    }

    // Check if users collection can be accessed
    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      console.log(`- users collection: ✅ accessible (${usersSnap.size} users)`);
    } catch (error: any) {
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.log('- users collection: ⚠️ offline (will create on first signup)');
      } else {
        console.log('- users collection: ⚠️ not yet created (will create on first signup)');
      }
    }

    return true;
  } catch (error) {
    console.warn('⚠️ Could not check collection status:', error);
    return false;
  }
}
