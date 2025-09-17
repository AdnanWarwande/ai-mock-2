import Vapi from "@vapi-ai/web";

const webToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!webToken) {
  console.error("VAPI_WEB_TOKEN is missing from environment variables");
}

export const vapi = new Vapi(webToken!);
