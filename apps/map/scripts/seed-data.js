#!/usr/bin/env node
/**
 * MapSet - Seed Data Script
 * Creates sample data for local development testing
 * 
 * Usage: node scripts/seed-data.js
 * Requires: Firebase emulators running
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  connectFirestoreEmulator
} = require('firebase/firestore');
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase config for emulators
const firebaseConfig = {
  projectId: 'openai-mapset-eboss-map',
  apiKey: 'fake-api-key-for-emulator',
  authDomain: 'localhost:9099'
};

// Sample data
const SAMPLE_SITES = [
  {
    name: 'MapSet Abilene - Phase 1',
    address: 'Abilene, TX 79601',
    latitude: 32.4487,
    longitude: -99.7331,
    visibility: 'internal',
    status: 'active'
  },
  {
    name: 'Test Site - Dallas',
    address: 'Dallas, TX 75201',
    latitude: 32.7767,
    longitude: -96.7970,
    visibility: 'internal',
    status: 'active'
  }
];

const SAMPLE_GENERATORS = [
  {
    label: 'EBOSS-125-001',
    kw: 100,
    widthM: 2.5,
    lengthM: 4.2,
    orientationDeg: 0,
    project: 'Phase 1'
  },
  {
    label: 'EBOSS-125-002',
    kw: 100,
    widthM: 2.5,
    lengthM: 4.2,
    orientationDeg: 45,
    project: 'Phase 1'
  },
  {
    label: 'EBOSS-220-001',
    kw: 176,
    widthM: 3.0,
    lengthM: 5.0,
    orientationDeg: 90,
    project: 'Phase 2'
  },
  {
    label: 'BOSS400-001',
    kw: 320,
    widthM: 4.0,
    lengthM: 12.0,
    orientationDeg: 0,
    project: 'Backup'
  }
];

const SAMPLE_USERS = [
  { email: 'admin@anacorp.com', password: 'password123', role: 'admin' },
  { email: 'tech1@anacorp.com', password: 'password123', role: 'tech' },
  { email: 'sales1@anacorp.com', password: 'password123', role: 'sales' }
];

async function seedData() {
  console.log('🔥 MapSet - Seeding Development Data\n');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Connect to emulators
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

  try {
    // Create users
    console.log('👤 Creating test users...');
    for (const userData of SAMPLE_USERS) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );

        // Add user profile to Firestore
        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          email: userData.email,
          displayName: userData.email.split('@')[0],
          role: userData.role,
          status: 'active',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        console.log(`  ✓ Created ${userData.email} (${userData.role})`);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          console.log(`  ⚠ ${userData.email} already exists`);
        } else {
          console.error(`  ✗ Error creating ${userData.email}:`, err.message);
        }
      }
    }

    // Create sites
    console.log('\n📍 Creating sites...');
    const siteIds = [];
    for (const siteData of SAMPLE_SITES) {
      const siteRef = await addDoc(collection(db, 'sites'), {
        ...siteData,
        createdBy: 'system',
        members: { 'system': { role: 'admin' } },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      siteIds.push(siteRef.id);
      console.log(`  ✓ Created site: ${siteData.name} (${siteRef.id})`);
    }

    // Create generators for first site
    console.log('\n⚡ Creating generators...');
    const baseLat = SAMPLE_SITES[0].latitude;
    const baseLng = SAMPLE_SITES[0].longitude;

    for (let i = 0; i < SAMPLE_GENERATORS.length; i++) {
      const gen = SAMPLE_GENERATORS[i];
      // Offset positions slightly
      const lat = baseLat + (i * 0.001);
      const lng = baseLng + (i * 0.001);

      await addDoc(collection(db, 'generators'), {
        ...gen,
        siteId: siteIds[0],
        latitude: lat,
        longitude: lng,
        photoUrl: null,
        createdBy: 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`  ✓ Created generator: ${gen.label} (${gen.kw}kW)`);
    }

    // Create some drawings
    console.log('\n📐 Creating drawings...');
    const drawings = [
      {
        type: 'rectangle',
        label: 'Building A',
        category: 'existing',
        siteId: siteIds[0],
        bounds: {
          north: baseLat + 0.002,
          south: baseLat - 0.001,
          east: baseLng + 0.002,
          west: baseLng - 0.001
        },
        color: '#FF0000',
        strokeWeight: 2,
        fillOpacity: 0.1
      },
      {
        type: 'polyline',
        label: 'Access Road',
        category: 'existing',
        siteId: siteIds[0],
        path: [
          { lat: baseLat - 0.002, lng: baseLng },
          { lat: baseLat - 0.001, lng: baseLng + 0.001 },
          { lat: baseLat, lng: baseLng + 0.001 }
        ],
        color: '#0000FF',
        strokeWeight: 3
      }
    ];

    for (const drawing of drawings) {
      await addDoc(collection(db, 'drawings'), {
        ...drawing,
        createdBy: 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`  ✓ Created drawing: ${drawing.label}`);
    }

    console.log('\n✅ Seeding complete!');
    console.log('\nTest Accounts:');
    SAMPLE_USERS.forEach(u => {
      console.log(`  ${u.email} / ${u.password} (${u.role})`);
    });
    console.log(`\nOpen http://localhost:8080 to view the app`);
    console.log(`Open http://127.0.0.1:4000 for Emulator UI`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Check if emulators are running
const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  seedData();
});

req.on('error', () => {
  console.error('❌ Firebase emulators are not running!');
  console.error('   Start them with: firebase emulators:start');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Firebase emulators are not responding!');
  process.exit(1);
});

req.end();
