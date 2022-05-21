import { useCallback, useEffect, useState } from "react";
import { Status } from "../enums";
import { isEmpty } from "lodash.isempty";

function defaultValidation<T>(res: T) {
  return !isEmpty(res);
}

function useAsync<T, E extends Error>(
  asyncFunction: () => Promise<T>,
  cleanup?: () => void,
  isSuccess = defaultValidation,
  immediate = true,
  resetTimeout = 4000,
  defaultValue?: T
) {
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [value, setValue] = useState<T | null>(defaultValue);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async (): Promise<void> => {
    setStatus(Status.PENDING);
    setValue(defaultValue || null);
    setError(null);
    return asyncFunction()
      .then((response: T) => {
        if (isSuccess(response)) {
          setStatus(Status.SUCCESS);
          setValue(response);
          !!cleanup && cleanup();
        } else {
          setStatus(Status.ERROR);
          setError(new Error("Response validation failed") as E);
        }
      })
      .catch((error: E) => {
        setStatus(Status.ERROR);
        setError(error);
      })
      .finally(() => {
        if (resetTimeout > 0) {
          setTimeout(() => {
            setStatus(Status.IDLE);
            setValue(defaultValue || null);
            setError(null);
          }, resetTimeout);
        }
      });
  }, [asyncFunction, cleanup, isSuccess, defaultValue, resetTimeout]);

  useEffect(() => {
    immediate && execute();
  }, [execute, immediate]);

  return { execute, status, value, error };
}

export default useAsync;
