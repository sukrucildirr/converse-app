import { Platform } from "react-native"
import { IConfig } from "@/config/config.types"
import { shared } from "./shared"

export const productionConfig: IConfig = {
  ...shared,
  appStoreUrl: Platform.select({
    default: "TODO",
    android: "TODO",
  }),
  bundleId: Platform.OS === "android" ? "com.converse.prod" : "com.converse.native",
  scheme: "converse",
  websiteDomain: "converse.xyz",
  usernameSuffix: ".converse.xyz",
  universalLinks: ["converse.xyz/", "getconverse.app/"].flatMap((domain) => [
    `https://${domain}`,
    `http://${domain}`,
    domain,
  ]),
  evm: {
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    transactionChainId: "0x2105", // Base Mainnet
    USDC: {
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      name: "USD Coin",
      version: "2",
      decimals: 6,
    },
  },
} as const
