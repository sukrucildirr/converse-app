import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import {
  getTransactionsStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import {
  getCoinbaseTransactionDetails,
  getTransactionDetails,
} from "../../utils/api";
import {
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../utils/colors";
import {
  TransactionDetails,
  createUniformTransaction,
  extractChainIdToHex,
  getTxContentType,
  mergeTransactionRefData,
} from "../../utils/transaction";
import { TransactionReference } from "../../utils/xmtpRN/contentTypes/transactionReference";
import { MessageToDisplay } from "./ChatMessage";
import ChatMessageMetadata from "./ChatMessageMetadata";

type Props = {
  message: MessageToDisplay;
};

export default function ChatTransactionReference({ message }: Props) {
  const colorScheme = useColorScheme();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const styles = useStyles();
  const [transaction, setTransaction] = useState({
    loading: true,
    error: false,
    id: "", // Concatenation of "[networkid]-[reference]"
    contentType: undefined as
      | undefined
      | "transactionReference"
      | "coinbaseRegular"
      | "coinbaseSponsored",
    namespace: undefined as undefined | string,
    networkId: "",
    reference: "",
    metadata: undefined as undefined | object,
    status: undefined as undefined | "PENDING" | "FAILURE" | "SUCCESS",
    sponsored: true, // by converse
    blockExplorerURL: undefined as undefined | string,
    events: undefined as undefined | [],
  });
  const fetchingTransaction = useRef(false);
  const showing = !transaction.loading;

  const saveAndDisplayTransaction = useCallback(
    (
      contentType:
        | "transactionReference"
        | "coinbaseRegular"
        | "coinbaseSponsored",
      txRef: TransactionReference,
      txRefId: string,
      txDetails: TransactionDetails,
      update = false
    ) => {
      if (txRef.namespace === "eip155" && txRef.networkId && txRef.reference) {
        const transactionStore = getTransactionsStore(currentAccount);
        const transaction = mergeTransactionRefData(
          contentType,
          txRef,
          txRefId,
          txDetails
        );

        if (update) {
          transactionStore.getState().updateTransaction(txRefId, transaction);
        } else {
          transactionStore.getState().setTransactions([transaction]);
        }
      }
    },
    [currentAccount]
  );

  useEffect(() => {
    const go = async () => {
      if (fetchingTransaction.current) return;
      fetchingTransaction.current = true;
      setTransaction((t) => ({ ...t, loading: true }));

      const txRef = JSON.parse(message.content);
      const txContentType = getTxContentType(txRef);
      let txDetails: TransactionDetails | undefined;

      try {
        switch (txContentType) {
          case "transactionReference": {
            txDetails = await getTransactionDetails(
              currentAccount,
              txRef.networkId,
              txRef.reference
            );
            break;
          }
          case "coinbaseRegular": {
            txDetails = await getTransactionDetails(
              currentAccount,
              extractChainIdToHex(txRef.network.rawValue),
              txRef.transactionHash
            );
            break;
          }
          case "coinbaseSponsored": {
            txDetails = await getCoinbaseTransactionDetails(
              currentAccount,
              extractChainIdToHex(txRef.network.rawValue),
              txRef.sponsoredTxId
            );
            break;
          }
          default: {
            console.error("Invalid transaction content type");
            break;
          }
        }

        if (txDetails) {
          const uniformTx = createUniformTransaction(txRef, txDetails);
          console.log("uniformTx:", uniformTx);
        } else {
          console.error("Transaction details could not be fetched");
        }
      } catch (error) {
        console.error("Error fetching transaction details:", error);
      }
    };

    const txRef = JSON.parse(message.content);
    const txContentType = getTxContentType(txRef);

    if (!txContentType) {
      // sentryTrackMessage("INVALID_TRANSACTION_REFERENCE", { message });
      // TODO: should display message fallback
      setTransaction((a) => ({ ...a, error: true, loading: false }));
    } else {
      setTransaction((t) => ({ ...t, contentType: txContentType }));
      go();
    }
  }, [currentAccount, message, saveAndDisplayTransaction]);

  const textStyle = [
    styles.text,
    { color: message.fromMe ? "white" : textPrimaryColor(colorScheme) },
  ];

  const metadataView = (
    <ChatMessageMetadata message={message} white={showing} />
  );

  // Conditional rendering
  if (transaction.loading) {
    return (
      <>
        <View
          style={[
            styles.innerBubble,
            message.fromMe ? styles.innerBubbleMe : undefined,
          ]}
        >
          <Text style={textStyle}>Loading...</Text>
        </View>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  } else if (transaction.error) {
    return null;
  } else {
    return (
      <>
        <View
          style={[
            styles.innerBubble,
            message.fromMe ? styles.innerBubbleMe : undefined,
          ]}
        >
          <Text style={textStyle}>{message.content}</Text>
        </View>
        <View style={{ opacity: 0 }}>{metadataView}</View>
      </>
    );
  }
}

// TODO UPDATE STYLE
const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    imagePreview: {
      borderRadius: 14,
      width: "100%",
      zIndex: 1,
    },
    text: {
      paddingHorizontal: 8,
      paddingVertical: Platform.OS === "android" ? 2 : 3,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    innerBubble: {
      backgroundColor: messageInnerBubbleColor(colorScheme),
      borderRadius: 14,
      width: "100%",
      paddingHorizontal: 2,
      paddingVertical: 6,
      marginBottom: 5,
    },
    innerBubbleMe: {
      backgroundColor: myMessageInnerBubbleColor(colorScheme),
    },
    metadataContainer: {
      position: "absolute",
      bottom: 6,
      right: 12,
      backgroundColor: "rgba(24, 24, 24, 0.5)",
      borderRadius: 18,
      paddingLeft: 1,
      paddingRight: 2,
      zIndex: 2,
      ...Platform.select({
        default: {
          paddingBottom: 1,
          paddingTop: 1,
        },
        android: { paddingBottom: 3, paddingTop: 2 },
      }),
    },
  });
};
