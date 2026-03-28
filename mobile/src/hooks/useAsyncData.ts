import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface UseAsyncDataOptions<T> {
  fetchFn: () => Promise<T>;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
}

interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
  reload: () => Promise<void>;
}

export default function useAsyncData<T>({
  fetchFn,
  errorMessage = 'Failed to load data',
  onSuccess,
}: UseAsyncDataOptions<T>): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Store latest values in refs to avoid dependency changes
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  const errorMessageRef = useRef(errorMessage);

  fetchFnRef.current = fetchFn;
  onSuccessRef.current = onSuccess;
  errorMessageRef.current = errorMessage;

  const load = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const result = await fetchFnRef.current();
      setData(result);
      onSuccessRef.current?.(result);
    } catch (error) {
      Alert.alert('Error', errorMessageRef.current);
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  return { data, loading, refreshing, refresh, reload };
}
