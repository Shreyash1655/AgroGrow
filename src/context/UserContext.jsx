import React, { createContext, useContext } from 'react';
import { useApp } from '../store/AppContext';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { user } = useApp();

  const profile = {
    fullName: user?.name || "Farmer",
    phone: "+91 9876543210",
    taluka: user?.taluka || "Goa",
    location: "India",
    selectedCrops: user?.crops || ["Cashew"],
    farmSize: user?.farmSize || "2"
  };

  return (
    <UserContext.Provider value={{ profile }}>
      {children}
    </UserContext.Provider>
  );
};