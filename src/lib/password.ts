export const PASSWORD_MIN_LENGTH = 6;

export function validateNewPassword(
  password: string,
  confirm: string,
  current?: string,
): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `パスワードは${PASSWORD_MIN_LENGTH}文字以上です`;
  }
  if (/\s/.test(password)) {
    return "パスワードに空白は使えません";
  }
  if (password !== confirm) {
    return "新しいパスワードが一致しません";
  }
  if (current && password === current) {
    return "現在のパスワードと別のパスワードを入力してください";
  }
  return null;
}

export function mapPasswordUpdateError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid_credentials")
  ) {
    return "現在のパスワードが正しくありません";
  }
  if (lower.includes("should be different") || lower.includes("same as the old")) {
    return "現在のパスワードと別のパスワードを入力してください";
  }
  if (
    lower.includes("at least") ||
    lower.includes("6 character") ||
    lower.includes("too short")
  ) {
    return `パスワードは${PASSWORD_MIN_LENGTH}文字以上です`;
  }
  if (
    lower.includes("leaked") ||
    lower.includes("pwned") ||
    lower.includes("data breach") ||
    lower.includes("haveibeenpwned")
  ) {
    return "このパスワードは安全ではないため使えません。別のパスワードを指定してください。";
  }
  if (
    lower.includes("session") ||
    lower.includes("jwt") ||
    lower.includes("not authenticated") ||
    lower.includes("auth session missing")
  ) {
    return "ログインの有効期限が切れました。再度ログインしてください。";
  }
  return "パスワードの変更に失敗しました";
}
