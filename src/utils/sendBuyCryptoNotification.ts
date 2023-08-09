import { WebhookResponse } from 'api/webhookCallbacks/webhookCallbacks';

const sendBuyCryptoNotification = async (notificationInfo: WebhookResponse) => {

  const SuccessBody = `Tranaction complete. ${notificationInfo.cryptoAmount} ${notificationInfo.cryptoCurrency} has successfully arrived to your wallet. \n\n\nTransaction Details: \n Status: ${notificationInfo.status} Transaction id: ${notificationInfo.transactionId} \n Provider Fee: ${notificationInfo.providerFee} ${notificationInfo.fiatCurrency} \n Fiat currency: ${notificationInfo.fiatCurrency} \n Network: ${notificationInfo.network}`;
  const pendingBody = `Transaction Pending. Your purchase of  ${notificationInfo.cryptoAmount} ${notificationInfo.cryptoCurrency} is processing and will arive shortly`;
  const failedBody = `Tranaction Failed. Your purchase for ${notificationInfo.cryptoAmount} ${notificationInfo.cryptoCurrency} was unsuccessful and did not go through. \n\n\nTransaction Details: \n Status: ${notificationInfo.status} Transaction id: ${notificationInfo.transactionId} \n Provider Fee: ${notificationInfo.providerFee} ${notificationInfo.fiatCurrency} \n Fiat currency: ${notificationInfo.fiatCurrency} \n Network: ${notificationInfo.network}`;

  const notificationPayload = {
    accounts: [`eip155:${5}:${`0xeFc8e5657A08E00Cc083d1562eF379aCC0cE9cab`}`],
    notification: {
      title: notificationInfo.status === 'complete' ? 'Crypto Purchase Complete' : notificationInfo.status === 'pending' ? 'Crypto purchase pending' : 'Crypto Purchase Failed',
      body: notificationInfo.status === 'complete' ? SuccessBody : notificationInfo.status === 'pending' ? pendingBody : failedBody,
      icon: `https://tokens.pancakeswap.finance/images/symbol/${notificationInfo.cryptoCurrency.toLowerCase()}.png`,
      url: 'https://pc-custom-web.vercel.app',
      type: 'alerts',
    },
  };
  const walletConnectPushResponse = await fetch(
    `https://cast.walletconnect.com/${'ae5413feaf0cdaee02910dc807e03203'}/notify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${'85a7792c-c5d7-486b-b37e-e752918e4866'}`,
      },
      body: JSON.stringify(notificationPayload),
    },
  );

  // console.log(walletConnectPushResponse)

  const result = await walletConnectPushResponse.json();
  console.log(result)

  return result;
};

export default sendBuyCryptoNotification
