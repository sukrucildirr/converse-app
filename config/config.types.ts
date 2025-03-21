// import { IXmtpEnv } from "@/utils/xmtpRN/xmtp.types";

import type { IXmtpEnv } from "@/features/xmtp/xmtp.types"

type IEvmConfig = {
  rpcEndpoint: string
  transactionChainId: string
  USDC: {
    contractAddress: string
    name: string
    version: string
    decimals: number
  }
}

type IPrivyConfig = {
  appId: string
  clientId: string
}

export type ILoggerColorScheme = "light" | "dark"

export type IConfig = {
  appName: string
  appVersion: string
  appStoreUrl: string
  loggerColorScheme: ILoggerColorScheme
  debugMenu: boolean
  debugAddresses: string[]
  lensApiDomain: string
  lensSuffix: string
  sentryDSN: string
  framesAllowedSchemes: ("http" | "https" | "ethereum")[]
  thirdwebClientId: string
  xmtpEnv: IXmtpEnv
  apiURI: string
  bundleId: string
  scheme: string
  websiteDomain: string
  usernameSuffix: string
  reactQueryPersistCacheIsEnabled: boolean
  universalLinks: string[]
  privy: IPrivyConfig
  evm: IEvmConfig
  appCheckDebugToken: string | undefined
  reactQueryEncryptionKey: string
  xmtp: {
    maxMsUntilLogError: number
  }
}
