import { EventId, EventKind, RawEvent, Unsigned, UnsignedWithPubkey } from "."
import { defined, NostrError } from "../common"
import {
  aesDecryptBase64,
  aesEncryptBase64,
  getPublicKey,
  HexOrBechPrivateKey,
  parsePrivateKey,
  parsePublicKey,
  PrivateKey,
  PublicKey,
} from "../crypto"

export interface DirectMessage extends RawEvent {
  kind: EventKind.DirectMessage

  /**
   * Get the message plaintext, or undefined if this client is not the recipient.
   */
  getMessage(priv?: HexOrBechPrivateKey): Promise<string | undefined>
  /**
   * Get the recipient pubkey.
   */
  getRecipient(): PublicKey
  /**
   * Get the event ID of the previous message.
   */
  getPrevious(): EventId | undefined
}

// TODO Since you already require the private key, maybe this should return the message already signed?
// With NIP-07 the parameter will be optional, then what?
export async function createDirectMessage({
  message,
  recipient,
  priv,
}: {
  message: string
  recipient: PublicKey
  priv: PrivateKey
}): Promise<Unsigned<DirectMessage>> {
  recipient = parsePublicKey(recipient)
  priv = parsePrivateKey(priv)
  const { data, iv } = await aesEncryptBase64(priv, recipient, message)
  return {
    kind: EventKind.DirectMessage,
    tags: [["p", recipient]],
    content: `${data}?iv=${iv}`,
    getMessage,
    getRecipient,
    getPrevious,
  }
}

export async function getMessage(
  this: UnsignedWithPubkey<DirectMessage>,
  priv?: HexOrBechPrivateKey
): Promise<string | undefined> {
  if (priv !== undefined) {
    priv = parsePrivateKey(priv)
  }
  const [data, iv] = this.content.split("?iv=")
  if (data === undefined || iv === undefined) {
    throw new NostrError(`invalid direct message content ${this.content}`)
  }
  if (priv === undefined) {
    // TODO Try to use NIP-07
    throw new NostrError("todo")
  } else if (getPublicKey(priv) === this.getRecipient()) {
    return await aesDecryptBase64(this.pubkey, priv, { data, iv })
  }
  return undefined
}

export function getRecipient(this: Unsigned<RawEvent>): PublicKey {
  const recipientTag = this.tags.find((tag) => tag[0] === "p")
  if (typeof recipientTag?.[1] !== "string") {
    throw new NostrError(
      `expected "p" tag to be of type string, but got ${
        recipientTag?.[1]
      } in ${JSON.stringify(this)}`
    )
  }
  return recipientTag[1]
}

export function getPrevious(this: Unsigned<RawEvent>): EventId | undefined {
  const previousTag = this.tags.find((tag) => tag[0] === "e")
  if (typeof previousTag?.[1] !== "string") {
    throw new NostrError(
      `expected "e" tag to be of type string, but got ${
        previousTag?.[1]
      } in ${JSON.stringify(this)}`
    )
  }
  return defined(previousTag?.[1])
}
