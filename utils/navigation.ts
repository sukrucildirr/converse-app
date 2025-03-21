import { createNavigationContainerRef } from "@react-navigation/native"
import * as Linking from "expo-linking"
import { Linking as RNLinking } from "react-native"
import { NavigationParamList } from "@/navigation/navigation.types"
import { config } from "../config"
import logger from "./logger"

// https://reactnavigation.org/docs/navigating-without-navigation-prop/#usage
export const converseNavigatorRef = createNavigationContainerRef()

export const navigate = async <T extends keyof NavigationParamList>(
  screen: T,
  params?: NavigationParamList[T],
) => {
  logger.debug("[Navigation] Navigating to:", screen, params)
  if (!converseNavigatorRef) {
    logger.error("[Navigation] Conversation navigator not found")
    return
  }

  if (!converseNavigatorRef.isReady()) {
    logger.error(
      "[Navigation] Conversation navigator is not ready (wait for appStore#hydrated to be true using waitForAppStoreHydration)",
    )
    return
  }

  logger.debug(`[Navigation] Navigating to ${screen} ${params ? JSON.stringify(params) : ""}`)

  // todo(any): figure out proper typing here
  // @ts-ignore
  converseNavigatorRef.navigate(screen, params)
}

export const getSchemedURLFromUniversalURL = (url: string) => {
  // Handling universal links by saving a schemed URI
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      return Linking.createURL(url.replace(prefix, ""))
    }
  }
  return url
}

const isDMLink = (url: string) => {
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length)
      if (path.toLowerCase().startsWith("dm/")) {
        return true
      }
    }
  }
  return false
}

const isGroupInviteLink = (url: string) => {
  // First check if it's a universal link
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length)
      if (path.toLowerCase().startsWith("group-invite/")) {
        logger.debug("[Navigation] Found group invite universal link:", path)
        return true
      }
    }
  }

  // Then check for deep link format with scheme
  if (url.includes("group-invite")) {
    logger.debug("[Navigation] Found group invite deep link:", url)
    return true
  }

  logger.debug("[Navigation] Not a group invite link:", url)
  return false
}

const isGroupLink = (url: string) => {
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length)
      if (path.toLowerCase().startsWith("group/")) {
        return true
      }
    }
  }
  return false
}

const originalOpenURL = RNLinking.openURL.bind(RNLinking)
RNLinking.openURL = (url: string) => {
  logger.debug("[Navigation] Processing URL:", url)

  try {
    if (isDMLink(url)) {
      logger.debug("[Navigation] Handling DM link")
      return originalOpenURL(getSchemedURLFromUniversalURL(url))
    }
    if (isGroupInviteLink(url)) {
      logger.debug("[Navigation] Handling group invite link")
      return originalOpenURL(getSchemedURLFromUniversalURL(url))
    }
    if (isGroupLink(url)) {
      logger.debug("[Navigation] Handling group link")
      return originalOpenURL(getSchemedURLFromUniversalURL(url))
    }
    logger.debug("[Navigation] Handling default link")
    return originalOpenURL(url)
  } catch (error) {
    logger.error("[Navigation] Error processing URL:", error)
    return Promise.reject(error)
  }
}
