import { useState, useEffect, useCallback, useRef } from "react";
import { fetchEventById, fetchEventNames } from "../services/api/events";
import { fetchDepartments } from "../services/api/departments";
import { fetchBlocksByDepartment } from "../services/api/blocks";

export const useEventDetailsById = (eventId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousData = useRef(null);

  const fetchData = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchEventById(id);
        const newDataString = JSON.stringify(result);
        const previousDataString = JSON.stringify(previousData.current);

        if (newDataString !== previousDataString) {
          setData(result);
          previousData.current = result;
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [fetchEventById]
  );

  useEffect(() => {
    if (eventId) {
      fetchData(eventId);
    } else {
      setData(null);
      previousData.current = null;
    }
  }, [eventId, fetchData]);

  return {
    eventData: data,
    isLoadingEventDetails: loading,
    errorFetchingEventDetails: error,
  };
};

export const useDepartments = () => {
  const [departmentsData, setDepartmentsData] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [errorDepartments, setErrorDepartments] = useState(null);
  const previousData = useRef(null);

  useEffect(() => {
    const fetchDepts = async () => {
      setLoadingDepartments(true);
      setErrorDepartments(null);
      try {
        const result = await fetchDepartments();
        const newDataString = JSON.stringify(result);
        const previousDataString = JSON.stringify(previousData.current);

        if (newDataString !== previousDataString) {
          setDepartmentsData(result);
          previousData.current = result;
        }
      } catch (error) {
        setErrorDepartments(error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepts();
  }, []);

  return { departmentsData, loadingDepartments, errorDepartments };
};

export const useBlocksByDepartments = (departmentIds) => {
  const [blocksData, setBlocksData] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [errorBlocks, setErrorBlocks] = useState(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (departmentIds && departmentIds.length > 0) {
        setLoadingBlocks(true);
        setErrorBlocks(null);
        try {
          const result = await fetchBlocksByDepartment(departmentIds);
          setBlocksData(result);
        } catch (error) {
          setErrorBlocks(error);
        } finally {
          setLoadingBlocks(false);
        }
      } else {
        setBlocksData([]);
      }
    };

    fetchBlocks();
  }, [departmentIds]);

  return { blocksData, loadingBlocks, errorBlocks };
};

export const useEventNames = () => {
  const [eventNamesData, setEventNamesData] = useState([]);
  const [loadingEventNames, setLoadingEventNames] = useState(true);
  const [errorEventNames, setErrorEventNames] = useState(null);
  const previousData = useRef(null);

  const fetchEventNamesData = useCallback(async () => {
    setLoadingEventNames(true);
    setErrorEventNames(null);
    try {
      const response = await fetchEventNames();
      const newDataString = JSON.stringify(response);
      const previousDataString = JSON.stringify(previousData.current);

      if (newDataString !== previousDataString) {
        setEventNamesData(response);
        previousData.current = response;
      }
    } catch (error) {
      setErrorEventNames(error);
    } finally {
      setLoadingEventNames(false);
    }
  }, [fetchEventNames]);

  useEffect(() => {
    fetchEventNamesData();
  }, [fetchEventNamesData]);

  return { eventNamesData, loadingEventNames, errorEventNames };
};
