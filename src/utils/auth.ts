import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    if (!exp) {
      return true;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return exp < currentTime;
  } catch (e) {
    return true;
  }
};
