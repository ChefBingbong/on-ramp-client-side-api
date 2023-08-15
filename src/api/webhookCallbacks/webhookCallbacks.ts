import { Request, Response } from "express";
import { Cache } from "../../cache";
import { checkCacheForDuplicateRequests } from "../../utils/checkCache";
import {
	baseCurrencySchema,
	currencySchema,
	dataSchema,
	getValidQuoteSchema,
	myDataSchema,
} from "../../typeValidation/webhookValidation";
import { generateHMAC } from "../../utils/rsa_sig";
import config from "../../config/config";
import sendBuyCryptoNotification from "../../utils/sendBuyCryptoNotification";
import fs from 'fs'
const MoonPayCache = new Cache<string>(60);
const MercuryoCache = new Cache<string>(60);

export type WebhookResponse = {
	walletAddress: string;
	fiatAmount: number;
	cryptoAmount: number;
	fiatCurrency: string;
	cryptoCurrency: string;
	status: string;
	transactionId: string;
	updatedAt: string;
	network: string;
	providerFee: number;
	networkFee: number;
	rate: number;
	type: string;
};
export const MoonPayTestWebhook = async (req: Request, res: Response): Promise<void> => {
	const MoonPayEvent = req.body.data;
	const baseCurrency = baseCurrencySchema.parse(MoonPayEvent.baseCurrency);
	const currency = currencySchema.parse(MoonPayEvent.currency);
	const quote = getValidQuoteSchema.parse(MoonPayEvent.getValidQuote);
	const data = dataSchema.parse(MoonPayEvent);

	const isDuplicateRequest = checkCacheForDuplicateRequests(
		data.status,
		quote.transactionId,
		MoonPayCache,
	);
	if (isDuplicateRequest) {
		res.status(200).send({ message: "Duplicate event. Already processed." });
		return;
	}
	const moonpaySignatureV2Header = req.headers["moonpay-signature-v2"] as string;
	if (moonpaySignatureV2Header) {
		const elements = moonpaySignatureV2Header.split(",");

		const signatureData = {};
		elements.forEach((element) => {
			const [prefix, value] = element.split("=");
			signatureData[prefix.trim()] = value.trim();
		});

		const timestamp = signatureData["t"];
		const signature = signatureData["s"];

		let signedPayload = timestamp + ".";
		if (req.method === "POST") {
			const payload = JSON.stringify(req.body);
			signedPayload += payload;
		} else if (req.method === "GET") {
			const searchString = req.url.split("?")[1];
			signedPayload += searchString;
		}

		const expectedSignature = generateHMAC(config.moonpayWebhookKey, signedPayload);
		if (signature === expectedSignature) {
			
			let overideStatus = data.status;
			if (status === "completed") overideStatus = "complete";
			if (status === "failed") overideStatus = "failed";
			else res.send({ resp: "returning early" });

			const extractedData: WebhookResponse = {
				walletAddress: data.walletAddress,
				fiatAmount: Number(quote.baseCurrencyAmount),
				cryptoAmount: Number(quote.quoteCurrencyAmount),
				fiatCurrency: baseCurrency.code.toUpperCase(),
				cryptoCurrency: currency.code.toUpperCase(),
				status: overideStatus,
				transactionId: quote.transactionId,
				updatedAt: quote.updatedAt,
				network: currency.metadata.networkCode,
				providerFee: quote.feeAmount,
				networkFee: quote.networkFeeAmount,
				rate: quote.quoteCurrencyPrice,
				type: "MoonPay",
			};
			fs.appendFile('./addresses.txt', data.walletAddress + '\n', 'utf-8', err => {
				if (err) {
				  console.error('Error adding address:', err.message);
				  return res.status(500).json({ error: 'Error adding address' });
				}
			  
				res.json({ message: 'Address added successfully' });
			    });
			
			const pushResult = await sendBuyCryptoNotification(extractedData)
			res.send({ "webhook event verified": pushResult });
		} else {
			res.status(400).send({
				"Signatures do not match!": { signature, expectedSignature },
			});
		}
	} else {
		res.status(400).send("Moonpay-Signature-V2 header is missing.");
	}
};

export const MercuryoTestWebhook = async (req: Request, res: Response): Promise<void> => {
	const mercuryoEvent = req.body.data
	const { status, merchant_transaction_id } = mercuryoEvent;

	const isDuplicateRequest = checkCacheForDuplicateRequests(
		status,
		merchant_transaction_id,
		MercuryoCache,
	);
	// if (isDuplicateRequest) {
	// 	res.status(200).send({ message: "Duplicate event. Already processed." });
	// 	return;
	// }
	const mercuryoSignature = req.headers["x-signature"] as string;
	if (mercuryoSignature) {
		const expectedSignature = generateHMAC(config.mercuryoSignKey, JSON.stringify(req.body));
		if (mercuryoSignature === expectedSignature) {
			let overideStatus = status;
			if (status === "paid") overideStatus = "complete";
			if (status === "order_failed") overideStatus = "failed";
			if (status === "pending") overideStatus = "pending";


			const extractedData: WebhookResponse = {
				walletAddress: 'mercuryoEvent.merchant_transaction_id.split()[0]',
				fiatAmount: Number(mercuryoEvent.fiat_amount),
				cryptoAmount: Number(mercuryoEvent.amount),
				fiatCurrency: mercuryoEvent.fiat_currency.toUpperCase(),
				cryptoCurrency: mercuryoEvent.currency.toUpperCase(),
				status: overideStatus,
				transactionId: mercuryoEvent.merchant_transaction_id,
				updatedAt: mercuryoEvent.updated_at,
				network: "Ethereum",
				providerFee: 0,
				networkFee: 0,
				rate: 0,
				type: "Mercuryo",
			};
			let pushResult = ''
			if (overideStatus === 'complete' || overideStatus === 'failed' || overideStatus === 'pending') pushResult = await sendBuyCryptoNotification(extractedData)
			res.send({ "webhook event verified": pushResult });
		} else {
			res.status(400).send("Signatures do not match!");
		}
	} else {
		res.status(400).send("Mercuryo header is missing.");
	}
};