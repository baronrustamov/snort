import { EventKind, RawEvent, Unsigned } from "."
import { NostrError } from "../common"
import { PublicKey } from "../crypto"

export interface ContactList extends RawEvent {
  kind: EventKind.ContactList

  /**
   * Get the contacts in the event.
   */
  getContacts(): Contact[]
}

export interface Contact {
  pubkey: PublicKey
  relay?: URL
  petname?: string
}

export function createContactList(contacts: Contact[]): Unsigned<ContactList> {
  return {
    kind: EventKind.ContactList,
    tags: contacts.map((contact) => [
      "p",
      contact.pubkey,
      contact.relay?.toString() ?? "",
      contact.petname ?? "",
    ]),
    content: "",
    getContacts,
  }
}

export function getContacts(this: ContactList): Contact[] {
  return this.tags
    .filter((tags) => tags[0] === "p")
    .map((tags) => {
      // The first element is the pubkey.
      const pubkey = tags[1]
      if (pubkey === undefined) {
        throw new NostrError(
          `missing contact pubkey for contact list event: ${JSON.stringify(
            this
          )}`
        )
      }

      // The second element is the optional relay URL.
      let relay: URL | undefined
      try {
        if (tags[2] !== undefined && tags[2] !== "") {
          console.log(tags[2])
          relay = new URL(tags[2])
        }
      } catch (e) {
        throw new NostrError(
          `invalid relay URL for contact list event: ${JSON.stringify(this)}`
        )
      }

      // The third element is the optional petname.
      let petname: string | undefined
      if (tags[3] !== undefined && tags[3] !== "") {
        petname = tags[3]
      }

      return {
        pubkey,
        relay,
        petname,
      }
    })
}
