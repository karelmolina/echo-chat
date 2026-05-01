function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getOptionalEnvVar(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value;
}

export const env = {
  DATABASE_URL: getRequiredEnvVar("DATABASE_URL"),
  REDIS_URL: getRequiredEnvVar("REDIS_URL"),
  NEXT_PUBLIC_APP_URL: getRequiredEnvVar("NEXT_PUBLIC_APP_URL"),
  OPENAI_API_KEY: getOptionalEnvVar("OPENAI_API_KEY"),
  GROQ_API_KEY: getOptionalEnvVar("GROQ_API_KEY"),
  AI_PROVIDER: getOptionalEnvVar("AI_PROVIDER"),
};
