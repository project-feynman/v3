import { Enrollement } from "./services/enrollement";

export function initEnrollementService (user) {
  return new Enrollement(user);
}

export function encodeKey (key) {
  return key.replace(".", "_");
}
