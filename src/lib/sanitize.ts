export const sanitizeForPrompt = (
  input: string,
  maxLength: number = 500,
): string => {
  return input
    .replace(/ignore\s+(previous|all|above)/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/assistant\s*:/gi, '')
    .replace(/\[INST\]/gi, '')
    .replace(/<<SYS>>/gi, '')
    .replace(/[<>\[\]{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, maxLength)
    .trim()
}
