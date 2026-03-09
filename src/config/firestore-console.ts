/**
 * Browser Console Utilities for Firestore Management
 * 
 * Add this to window object for easy access from browser console
 * 
 * Usage in browser console:
 * - window.firestoreSetup.initialize()
 * - window.firestoreSetup.checkStatus()
 * - window.firestoreSetup.createSample()
 */

import {
  initializeFirestoreCollections,
  checkCollectionStatus,
  createSampleData,
  verifyCollectionsExist,
} from './firestore-collections';

export const firestoreSetup = {
  /**
   * Initialize all Firestore collections
   */
  async initialize() {
    console.log('🔧 Initializing Firestore collections...');
    try {
      const result = await initializeFirestoreCollections();
      if (result) {
        console.log('✅ Firestore collections initialized successfully!');
      } else {
        console.error('❌ Failed to initialize collections');
      }
      return result;
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  },

  /**
   * Check status of Firestore collections
   */
  async checkStatus() {
    console.log('📊 Checking Firestore collection status...');
    try {
      await checkCollectionStatus();
      return true;
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  },

  /**
   * Verify collections exist
   */
  async verify() {
    console.log('🔍 Verifying collections...');
    try {
      const exists = await verifyCollectionsExist();
      if (exists) {
        console.log('✅ Collections verified!');
      } else {
        console.log('⚠️ Collections not found, initializing...');
        await this.initialize();
      }
      return exists;
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  },

  /**
   * Create sample test data
   */
  async createSample() {
    console.log('📝 Creating sample data...');
    try {
      await createSampleData();
      console.log('✅ Sample data created!');
      return true;
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  },

  /**
   * Helper: Get instructions
   */
  help() {
    console.log(`
📚 Firestore Setup Commands:

firestoreSetup.initialize()
  - Initialize all Firestore collections

firestoreSetup.checkStatus()
  - Check status of all collections

firestoreSetup.verify()
  - Verify collections exist (auto-initialize if missing)

firestoreSetup.createSample()
  - Create sample test data

firestoreSetup.help()
  - Show this help message

Example:
  await firestoreSetup.initialize();
  await firestoreSetup.checkStatus();
    `);
  },
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).firestoreSetup = firestoreSetup;
  console.log('📦 Firestore utilities available as window.firestoreSetup');
}

export default firestoreSetup;
