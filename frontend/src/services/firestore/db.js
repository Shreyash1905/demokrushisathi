import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// Helper to handle standardized dates
const timestamp = () => serverTimestamp();

export const getRecords = async (collectionName, conditions = [], order = null) => {
  try {
    let q = collection(db, collectionName);
    if (conditions.length > 0) {
      q = query(q, ...conditions.map(c => where(c.field, c.op, c.value)));
    }
    if (order) {
      q = query(q, orderBy(order.field, order.direction || 'asc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    throw error;
  }
};

export const getRecord = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${collectionName}/${id}:`, error);
    throw error;
  }
};

export const createRecord = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating ${collectionName}:`, error);
    throw error;
  }
};

export const updateRecord = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: timestamp(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating ${collectionName}/${id}:`, error);
    throw error;
  }
};

export const subscribeToRecords = (collectionName, callback, conditions = [], order = null) => {
  let q = collection(db, collectionName);
  if (conditions.length > 0) {
    const whereClauses = conditions.map(c => where(c.field, c.op, c.value));
    if (order) {
      q = query(q, ...whereClauses, orderBy(order.field, order.direction || 'asc'));
    } else {
      q = query(q, ...whereClauses);
    }
  } else if (order) {
    q = query(q, orderBy(order.field, order.direction || 'asc'));
  }
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error(`Subscription error on ${collectionName}:`, error);
  });
};

export const subscribeToRecord = (collectionName, id, callback) => {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Subscription error on ${collectionName}/${id}:`, error);
  });
};

export const softDeleteRecord = async (collectionName, id) => {
  return updateRecord(collectionName, id, { status: 'DELETED' });
};
