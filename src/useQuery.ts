import { computed, reactive, watch, toRefs, Ref } from '@vue/composition-api';

type Refs<Data> = {
  [K in keyof Data]: Ref<Data[K]>;
};

type UseQueryReturn<K> = Refs<{
  loading: boolean;
  data: K | null;
  error: any;
  isInitial: boolean;
}> & { refetch: () => void };

// path
export default function useQuery<K>(
  computedPath: () => string,
  fetcher: (arg: string) => Promise<K>
): UseQueryReturn<K>;

// multi args
export default function useQuery<T extends readonly any[], K>(
  args: T,
  fetcher: (...args: T) => Promise<K>
): UseQueryReturn<K>;

// computed path
export default function useQuery<K>(
  path: string,
  fetcher: (arg: string) => Promise<K>
): UseQueryReturn<K>;

// computed mulitple args
export default function useQuery<T extends any[], M extends T, K>(
  computed: () => T,
  fetcher: (...args: M) => Promise<K>
): UseQueryReturn<K>;

export default function useQuery<T extends readonly any[], K>(
  computedFnOrArgs: T | (() => T),
  fetcher: (...args: any) => Promise<K>
) {
  let argRef: Readonly<Ref<Readonly<T>>> | null = null;
  if (typeof computedFnOrArgs == 'function') {
    argRef = computed(computedFnOrArgs);
  }

  const stateObj = {
    data: null,
    loading: true,
    error: null,
    isInitial: true,
  };

  const state = reactive(stateObj);

  const fetchData = () => {
    state.error = null;
    state.loading = true;
    let args: readonly any[];
    if (argRef) {
      if (Array.isArray(argRef.value)) {
        args = argRef.value;
      } else {
        args = [argRef.value];
      }
    } else {
      if (Array.isArray(computedFnOrArgs)) {
        args = computedFnOrArgs;
      } else {
        args = [computedFnOrArgs];
      }
    }
    fetcher(...args)
      .then((res: any) => {
        state.data = res;
      })
      .catch((error: any) => {
        state.error = error;
      })
      .finally(() => {
        state.loading = false;
        state.isInitial = false;
      });
  };

  if (argRef) {
    watch(argRef, fetchData);
  } else {
    fetchData();
  }

  return { ...toRefs(state), refetch: fetchData };
}
