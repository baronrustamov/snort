import { RelaySettings } from "@snort/nostr";

/**
 * Add-on api for snort features
 */
export const ApiHost = "https://api.snort.social";

/**
 * LibreTranslate endpoint
 */
export const TranslateHost = "https://translate.snort.social";

/**
 * Void.cat file upload service url
 */
export const VoidCatHost = "https://void.cat";

/**
 * Kierans pubkey
 */
export const KieranPubKey = "npub1m6az5zc2c5hzalker52x7zkzht6qs6yvj9l4pyjgvw9welfaf7yqz6mlgn";

/**
 * Official snort account
 */
export const SnortPubKey = "npub1m6az5zc2c5hzalker52x7zkzht6qs6yvj9l4pyjgvw9welfaf7yqz6mlgn";

/**
 * Websocket re-connect timeout
 */
export const DefaultConnectTimeout = 2000;

/**
 * How long profile cache should be considered valid for
 */
export const ProfileCacheExpire = 1_000 * 60 * 30;

/**
 * Default bootstrap relays
 */
export const DefaultRelays = new Map<string, RelaySettings>([
  ["wss://relay.semaphore.life", { read: true, write: true }],
  ["wss://relay.snort.social", { read: true, write: false }],
  ["wss://nostr.wine", { read: true, write: false }]
]);

/**
 * Default search relays
 */
export const SearchRelays = new Map<string, RelaySettings>([["wss://relay.semaphore.life", { read: true, write: true }]]);

/**
 * List of recommended follows for new users
 */
export const RecommendedFollows = [
  "npub1m6az5zc2c5hzalker52x7zkzht6qs6yvj9l4pyjgvw9welfaf7yqz6mlgn", // V
  "npub15pujdvthhea5rk86a5fs20549xrsqksf77eefcphu4m79ldpmgcsaumkgm", // I
];

/**
 * NIP06-defined derivation path for private keys
 */
export const DerivationPath = "m/44'/1237'/0'/0/0";

/**
 * Regex to match email address
 */
export const EmailRegex =
  // eslint-disable-next-line no-useless-escape
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Regex to match a mnemonic seed
 */
export const MnemonicRegex = /^([^\s]+\s){11}[^\s]+$/;

/**
 * Extract file extensions regex
 */
// eslint-disable-next-line no-useless-escape
export const FileExtensionRegex = /\.([\w]+)$/i;

/**
 * Extract note reactions regex
 */
export const MentionRegex = /(#\[\d+\])/gi;

/**
 * Simple lightning invoice regex
 */
export const InvoiceRegex = /(lnbc\w+)/i;

/**
 * YouTube URL regex
 */
export const YoutubeUrlRegex =
  /(?:https?:\/\/)?(?:www|m\.)?(?:youtu\.be\/|youtube\.com\/(?:live\/|shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/;

/**
 * Tweet Regex
 */
export const TweetUrlRegex = /https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/;

/**
 * Hashtag regex
 */
// eslint-disable-next-line no-useless-escape
export const HashtagRegex = /(#[^\s!@#$%^&*()=+.\/,\[{\]};:'"?><]+)/;

/**
 * Tidal share link regex
 */
export const TidalRegex = /tidal\.com\/(?:browse\/)?(\w+)\/([a-z0-9-]+)/i;

/**
 * SoundCloud regex
 */
export const SoundCloudRegex = /soundcloud\.com\/(?!live)([a-zA-Z0-9]+)\/([a-zA-Z0-9-]+)/;

/**
 * Mixcloud regex
 */
export const MixCloudRegex = /mixcloud\.com\/(?!live)([a-zA-Z0-9]+)\/([a-zA-Z0-9-]+)/;

/**
 * Spotify embed regex
 */
export const SpotifyRegex = /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/;

/**
 * Twitch embed regex
 */
export const TwitchRegex = /twitch.tv\/([a-z0-9_]+$)/i;

/**
 * Apple Music embed regex
 */
export const AppleMusicRegex =
  /music\.apple\.com\/([a-z]{2}\/)?(?:album|playlist)\/[\w\d-]+\/([.a-zA-Z0-9-]+)(?:\?i=\d+)?/i;

/**
 * Nostr Nests embed regex
 */
export const NostrNestsRegex = /nostrnests\.com\/[a-zA-Z0-9]+/i;

/*
 * Magnet link parser
 */
export const MagnetRegex = /(magnet:[\S]+)/i;

/**
 * Wavlake embed regex
 */
export const WavlakeRegex =
  /player\.wavlake\.com\/(?!feed\/)(track\/[.a-zA-Z0-9-]+|album\/[.a-zA-Z0-9-]+|[.a-zA-Z0-9-]+)/i;
