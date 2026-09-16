import React, { createContext, useContext, useState, useCallback } from 'react';

const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prevKey) => prevKey + 1);
  }, []);

  return (
    <AttendanceContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => useContext(AttendanceContext);
