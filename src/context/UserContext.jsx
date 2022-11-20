import { createContext, useState } from "react";

export const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <UserContext.Provider value={{ email, password, setEmail, setPassword }}>
      {children}
    </UserContext.Provider>
  );
};
