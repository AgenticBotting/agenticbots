/** Decode React's text/attribute escapes once before measuring visible metadata. */
export function metadataText(value) {
  const escapes = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" };
  return value.replace(/&(?:amp|lt|gt|quot|#x27);/g, entity => escapes[entity]);
}
