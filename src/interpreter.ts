import { PaymasterType } from './types';

export function interpretPaymasterType(paymasterUrl: string): PaymasterType {
  if (!isValidUrl(paymasterUrl)) {
    throw new Error('Invalid paymaster url');
  }

  const paymasterTypeValues = Object.values(PaymasterType) as string[];

  for (const paymasterType of paymasterTypeValues) {
    if (paymasterUrl.includes(paymasterType)) {
      return paymasterType as PaymasterType;
    }
  }

  throw new Error(`Unknown paymaster type for url ${paymasterUrl}`);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
