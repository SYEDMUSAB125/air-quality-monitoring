import { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database'                                                                                                                                                                                                                                                                                                                             

export function useAirQualityReadings() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const readingsRef = ref(database, 'AirQuality');

    const unsubscribe = onValue(readingsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          // Convert the object of readings into an array
          const readingsArray = Object.entries(data).map(([timestamp, readingData]) => ({
            timestamp,
            ...readingData
          }));
          setReadings(readingsArray);
        } else {
          setReadings([]);
        }
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    }, (error) => {
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { readings, loading, error };
}