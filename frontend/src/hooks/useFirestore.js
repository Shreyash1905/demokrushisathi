import { useState, useEffect } from 'react';
import { subscribeToRecords, subscribeToRecord } from '../services/firestore/db';

export const useCollection = (collectionName, conditions = [], order = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToRecords(
      collectionName, 
      (fetchedData) => {
        setData(fetchedData);
        setLoading(false);
      },
      conditions,
      order
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, JSON.stringify(conditions), JSON.stringify(order)]);

  return { data, loading, error };
};

export const useDocument = (collectionName, docId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRecord(
      collectionName,
      docId,
      (fetchedData) => {
        setData(fetchedData);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, docId]);

  return { data, loading, error };
};
