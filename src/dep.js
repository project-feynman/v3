import { Enrollment } from "./services/enrollement";

export function initEnrollementService (user) {
  return new Enrollment(user);
}