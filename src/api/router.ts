import express, { Router } from 'express';
// import app from "@app";
import {
  fetchBscAvailability,
  fetchBscQuote,
  generateBinanceConnectSig,
  generateMercuryoSig,
  generateMoonPaySig,
} from './handlers/signatureHandlers';
import {
  fetchBinanceConnectIpAvailability,
  fetchMercuryoIpAvailability,
  fetchMoonPayIpAvailability,
  fetchProviderAvailability,
  fetchProviderQuotes,
} from './handlers/proxyHandlers';
import { fetchBinanceConnectQuote } from './quoterFetchers';
import { fetchIpDetails, fetchMercuryoAvailability } from './ipFetchers';
import { MercuryoTestWebhook, MoonPayTestWebhook } from './webhookCallbacks/webhookCallbacks';

const router: Router = express.Router();

//router routes
router.route('/generate-mercuryo-sig').post(generateMercuryoSig).get(generateMercuryoSig);
router.route('/generate-moonpay-sig').post(generateMoonPaySig);
router.route('/generate-binance-connect-sig').post(generateBinanceConnectSig).get(generateBinanceConnectSig);

router.route('/fetch-bsc-quote').post(fetchBscQuote);
// router.route("/fetch-mercuryo-quote").post(fetchProviderQuotes)

router.route('/fetch-bsc-availability').post(fetchBinanceConnectIpAvailability);
router.route('/fetch-moonpay-availability').get(fetchMoonPayIpAvailability);
router.route('/fetch-mercuryo-availability').get(fetchMercuryoIpAvailability);
router.route('/user-ip').get(fetchIpDetails);
router.route('/fetch-provider-quotes').post(fetchProviderQuotes);
router.route('/fetch-provider-availability').post(fetchProviderAvailability);

//webhooks
router.route('/webhook').post(MoonPayTestWebhook)
router.route('/webhook-mercuryo').post(MercuryoTestWebhook)


export default router;
