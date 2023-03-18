import { EventKind, RawEvent, Unsigned } from "."
import { NostrError, parseJson } from "../common"

export interface SetMetadata extends RawEvent {
  kind: EventKind.SetMetadata

  /**
   * Get the user metadata specified in this event.
   */
  getUserMetadata(): UserMetadata
}

export interface UserMetadata {
  name: string
  about: string
  picture: string
}

export function createSetMetadata(
  content: UserMetadata
): Unsigned<SetMetadata> {
  return {
    kind: EventKind.SetMetadata,
    tags: [],
    content: JSON.stringify(content),
    getUserMetadata,
  }
}

export function getUserMetadata(this: Unsigned<RawEvent>): UserMetadata {
  const userMetadata = parseJson(this.content)
  if (
    typeof userMetadata.name !== "string" ||
    typeof userMetadata.about !== "string" ||
    typeof userMetadata.picture !== "string"
  ) {
    throw new NostrError(
      `invalid user metadata ${userMetadata} in ${JSON.stringify(this)}`
    )
  }
  return userMetadata
}