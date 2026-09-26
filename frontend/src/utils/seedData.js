import { createRecord } from '../services/firestore/db';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * UTILITY FOR DEVELOPMENT ONLY.
 * Seeds realistic agricultural data to Firestore collections to verify UI works.
 */
export const seedDevelopmentData = async () => {
  const isConfirmed = window.confirm("This will write realistic mock data to your Firestore database. Proceed?");
  if (!isConfirmed) return;

  try {
    const ts = serverTimestamp();
    
    // Seed Users
    const mockUsers = [
      { id: 'admin@krushisathi.in', email: 'admin@krushisathi.in', role: 'ADMIN', name: 'System Administrator' },
      { id: 'expert@krushisathi.in', email: 'expert@krushisathi.in', role: 'EXPERT', name: 'Dr. Prakash Hegde (UAS Dharwad)' },
      { id: 'fpo@krushisathi.in', email: 'fpo@krushisathi.in', role: 'FPO', name: 'Sahyadri Farmers Producer Company Ltd', fpoId: 'fpo-sahyadri-001' },
      { id: 'buyer@krushisathi.in', email: 'buyer@krushisathi.in', role: 'BUYER', name: 'Campco Ltd Procurement', buyerId: 'buyer-campco-001' },
    ];
    
    for (const u of mockUsers) {
      await setDoc(doc(db, 'users', u.id), { email: u.email, role: u.role, name: u.name, createdAt: ts, updatedAt: ts });
    }

    // Seed Farmers
    const farmers = [
      { name: 'Ramesh Gowda', location: 'Sagara, Karnataka', activeCrops: ['Arecanut (Red)', 'Black Pepper'], status: 'Active' },
      { name: 'Naveen Kumar', location: 'Sirsi, Karnataka', activeCrops: ['Arecanut (White)'], status: 'Active' },
      { name: 'Siddaramaiah K.', location: 'Shimoga, Karnataka', activeCrops: ['Paddy (Jyothi)'], status: 'Active' },
      { name: 'Manjula V.', location: 'Tirthahalli, Karnataka', activeCrops: ['Arecanut (Red)'], status: 'Active' },
    ];
    
    for (const f of farmers) {
      await createRecord('farmers', f);
    }

    // Seed FPOs
    await setDoc(doc(db, 'fpos', 'fpo-sahyadri-001'), { name: 'Sahyadri Farmers Producer Company Ltd', location: 'Shimoga District', status: 'Active', createdAt: ts, updatedAt: ts });
    await setDoc(doc(db, 'fpos', 'fpo-malnad-002'), { name: 'Malnad Areca Growers FPO', location: 'Sagara', status: 'Active', createdAt: ts, updatedAt: ts });

    // Seed FPO Members for the demo FPO
    const members = [
      { fpoId: 'fpo-sahyadri-001', name: 'Ramesh Gowda', phone: '+91 9876543210', location: 'Sagara', role: 'FARMER', status: 'ACTIVE' },
      { fpoId: 'fpo-sahyadri-001', name: 'Siddaramaiah K.', phone: '+91 8765432109', location: 'Shimoga', role: 'FARMER', status: 'ACTIVE' },
      { fpoId: 'fpo-sahyadri-001', name: 'Chandrashekar Bhat', phone: '+91 7654321098', location: 'Tirthahalli', role: 'FARMER', status: 'ACTIVE' },
    ];
    for (const m of members) {
      await createRecord('fpoMembers', m);
    }

    // Seed Expert Cases
    await createRecord('expertCases', { 
      farmerName: 'Ramesh Gowda', 
      crop: 'Arecanut', 
      location: 'Sagara', 
      aiObservation: 'Yellow Leaf Disease (YLD) detected in crown leaves.',
      confidence: '89%',
      severity: 'High',
      status: 'Open'
    });
    
    await createRecord('expertCases', { 
      farmerName: 'Naveen Kumar', 
      crop: 'Arecanut', 
      location: 'Sirsi', 
      aiObservation: 'Symptoms consistent with Koleroga (Fruit Rot).',
      confidence: '95%',
      severity: 'Critical',
      status: 'Resolved',
      finalDiagnosis: 'Confirmed Koleroga. Recommended spraying 1% Bordeaux mixture.'
    });

    await createRecord('expertCases', { 
      farmerName: 'Siddaramaiah K.', 
      crop: 'Paddy', 
      location: 'Shimoga', 
      aiObservation: 'Rice Blast lesions observed on leaves.',
      confidence: '92%',
      severity: 'Medium',
      status: 'Open'
    });

    // Seed Harvest Listings
    await createRecord('harvestListings', {
      fpoId: 'fpo-sahyadri-001',
      fpoName: 'Sahyadri Farmers Producer Company Ltd',
      crop: 'Arecanut (Rashi)', 
      quantity: '4500', 
      expectedDate: '2026-10-15', 
      farmers: 24, 
      status: 'Available'
    });

    await createRecord('harvestListings', {
      fpoId: 'fpo-sahyadri-001',
      fpoName: 'Sahyadri Farmers Producer Company Ltd',
      crop: 'Black Pepper (Malabar Garbled)', 
      quantity: '1200', 
      expectedDate: '2026-11-10', 
      farmers: 15, 
      status: 'Aggregating'
    });
    
    await createRecord('harvestListings', {
      fpoId: 'fpo-malnad-002',
      fpoName: 'Malnad Areca Growers FPO',
      crop: 'Arecanut (Chali)', 
      quantity: '8500', 
      expectedDate: '2026-10-25', 
      farmers: 45, 
      status: 'Available'
    });

    // Seed Buyer Requirements
    const req1 = await createRecord('buyerRequirements', {
      buyerId: 'buyer-campco-001',
      crop: 'Arecanut (Rashi)', 
      quantity: '5000', 
      requiredDate: '2026-10-20',
      quality: 'Moisture < 10%, well dried.',
      status: 'Active'
    });

    const req2 = await createRecord('buyerRequirements', {
      buyerId: 'buyer-campco-001',
      crop: 'Black Pepper (Malabar Garbled)', 
      quantity: '2500', 
      requiredDate: '2026-11-20',
      quality: 'Bulk density > 550 g/l.',
      status: 'Active'
    });

    // Seed an Offer
    await createRecord('offers', {
      buyerId: 'buyer-campco-001',
      sellerId: 'fpo-sahyadri-001',
      requirementId: req1, // reference to the req id
      crop: 'Arecanut (Rashi)',
      quantity: 4500,
      price: 450, // ₹450 per kg
      status: 'Pending',
      notes: 'Please arrange delivery to Mangalore warehouse.'
    });

    alert("Realistic agricultural data injected successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    alert("Failed to seed data: " + error.message);
  }
};
