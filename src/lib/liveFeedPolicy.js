export function liveFeedUnavailableReason(baseUrl = "/") {
  if (baseUrl && baseUrl !== "/") {
    return "Live credit-collar feed is unavailable on static subpath deployments.";
  }
  return null;
}
